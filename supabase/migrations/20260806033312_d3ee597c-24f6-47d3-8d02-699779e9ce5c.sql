-- 1. Lock down function execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_practice_session() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_practice_session(text, text, integer, integer, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_practice_session(text, text, integer, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- 2. Hardened practice session recorder
CREATE OR REPLACE FUNCTION public.record_practice_session(
  p_exercise_type text,
  p_exercise_id text DEFAULT NULL::text,
  p_bpm integer DEFAULT NULL::integer,
  p_duration_seconds integer DEFAULT 0,
  p_accuracy numeric DEFAULT NULL::numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_xp integer;
  v_last timestamptz;
  v_streak integer;
  v_new_streak integer;
  v_profile public.profiles;
  v_today_xp integer;
  v_today_count integer;
  v_dup uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Parameter validation
  IF p_exercise_type IS NULL OR btrim(p_exercise_type) = '' OR length(p_exercise_type) > 64 THEN
    RAISE EXCEPTION 'Invalid exercise_type';
  END IF;
  IF p_exercise_id IS NOT NULL AND length(p_exercise_id) > 128 THEN
    RAISE EXCEPTION 'Invalid exercise_id';
  END IF;
  IF p_bpm IS NOT NULL AND (p_bpm < 20 OR p_bpm > 400) THEN
    RAISE EXCEPTION 'Invalid bpm';
  END IF;
  IF p_accuracy IS NOT NULL AND (p_accuracy < 0 OR p_accuracy > 100) THEN
    RAISE EXCEPTION 'Invalid accuracy';
  END IF;
  IF p_duration_seconds IS NULL OR p_duration_seconds < 0 THEN
    p_duration_seconds := 0;
  END IF;
  p_duration_seconds := LEAST(p_duration_seconds, 14400);
  IF p_duration_seconds < 5 THEN
    RAISE EXCEPTION 'Session too short';
  END IF;

  -- Duplicate submission guard (same payload within 5 seconds)
  SELECT id INTO v_dup
  FROM public.practice_sessions
  WHERE user_id = uid
    AND exercise_type = p_exercise_type
    AND exercise_id IS NOT DISTINCT FROM p_exercise_id
    AND duration_seconds = p_duration_seconds
    AND created_at > now() - interval '5 seconds'
  LIMIT 1;

  IF v_dup IS NOT NULL THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = uid;
    RETURN jsonb_build_object(
      'xp_earned', 0,
      'xp', v_profile.xp,
      'level', v_profile.level,
      'streak_days', v_profile.streak_days,
      'duplicate', true
    );
  END IF;

  -- Abuse protection: daily caps
  SELECT coalesce(sum(xp_earned), 0), count(*)
    INTO v_today_xp, v_today_count
  FROM public.practice_sessions
  WHERE user_id = uid AND created_at >= date_trunc('day', now());

  IF v_today_count >= 200 THEN
    RAISE EXCEPTION 'Daily session limit reached';
  END IF;

  v_xp := LEAST(600, GREATEST(5, floor(p_duration_seconds / 6.0)::int));
  v_xp := LEAST(v_xp, GREATEST(0, 3000 - v_today_xp));

  INSERT INTO public.practice_sessions
    (user_id, exercise_type, exercise_id, bpm, duration_seconds, accuracy, xp_earned)
  VALUES (uid, p_exercise_type, p_exercise_id, p_bpm, p_duration_seconds, p_accuracy, v_xp);

  SELECT last_practice_at, streak_days INTO v_last, v_streak
  FROM public.profiles WHERE id = uid;

  v_streak := coalesce(v_streak, 0);
  IF v_last IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last::date = current_date THEN
    v_new_streak := GREATEST(v_streak, 1);
  ELSIF v_last::date = current_date - 1 THEN
    v_new_streak := v_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  PERFORM set_config('app.progress_update', 'on', true);
  UPDATE public.profiles
     SET xp = xp + v_xp,
         level = GREATEST(1, floor((xp + v_xp) / 100.0)::int + 1),
         streak_days = v_new_streak,
         last_practice_at = now()
   WHERE id = uid
   RETURNING * INTO v_profile;
  PERFORM set_config('app.progress_update', 'off', true);

  RETURN jsonb_build_object(
    'xp_earned', v_xp,
    'xp', v_profile.xp,
    'level', v_profile.level,
    'streak_days', v_profile.streak_days
  );
END;
$function$;

-- 3. Hardened account deletion (recent auth required)
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_iat bigint;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Require a recently issued token (reauthentication guard)
  BEGIN
    v_iat := (current_setting('request.jwt.claims', true)::jsonb ->> 'iat')::bigint;
  EXCEPTION WHEN others THEN
    v_iat := NULL;
  END;

  IF v_iat IS NULL OR to_timestamp(v_iat) < now() - interval '1 hour' THEN
    RAISE EXCEPTION 'Reauthentication required';
  END IF;

  DELETE FROM public.practice_sessions WHERE user_id = uid;
  DELETE FROM public.favorites WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$function$;

-- 4. Secure guest progress migration (one-time, caller-only, clamped)
CREATE OR REPLACE FUNCTION public.migrate_guest_progress(
  p_xp integer,
  p_level integer,
  p_streak_days integer,
  p_skill_level text DEFAULT NULL,
  p_onboarded boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_profile public.profiles;
  v_xp integer;
  v_streak integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = uid;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- One-time only: allowed only on an account with no server-side progress yet
  IF v_profile.xp > 0 OR v_profile.streak_days > 0 THEN
    RAISE EXCEPTION 'Progress already exists for this account';
  END IF;

  v_xp := LEAST(GREATEST(coalesce(p_xp, 0), 0), 100000);
  v_streak := LEAST(GREATEST(coalesce(p_streak_days, 0), 0), 3650);

  IF p_skill_level IS NOT NULL AND p_skill_level NOT IN ('beginner', 'intermediate', 'advanced') THEN
    RAISE EXCEPTION 'Invalid skill_level';
  END IF;

  PERFORM set_config('app.progress_update', 'on', true);
  UPDATE public.profiles
     SET xp = v_xp,
         level = GREATEST(1, floor(v_xp / 100.0)::int + 1),
         streak_days = v_streak,
         skill_level = coalesce(p_skill_level, skill_level),
         onboarded = coalesce(p_onboarded, onboarded)
   WHERE id = uid
   RETURNING * INTO v_profile;
  PERFORM set_config('app.progress_update', 'off', true);

  RETURN jsonb_build_object(
    'xp', v_profile.xp,
    'level', v_profile.level,
    'streak_days', v_profile.streak_days
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.migrate_guest_progress(integer, integer, integer, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.migrate_guest_progress(integer, integer, integer, text, boolean) TO authenticated;

-- 5. RLS: scope every policy to authenticated users only
DROP POLICY IF EXISTS "users manage own favorites" ON public.favorites;
CREATE POLICY "users manage own favorites" ON public.favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users view own sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "users insert own sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "users update own sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "users delete own sessions" ON public.practice_sessions;
CREATE POLICY "users view own sessions" ON public.practice_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own sessions" ON public.practice_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own sessions" ON public.practice_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own sessions" ON public.practice_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. Explicit table grants (no anonymous access)
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.practice_sessions FROM anon;
REVOKE ALL ON public.favorites FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.practice_sessions TO service_role;
GRANT ALL ON public.favorites TO service_role;