-- 1. Grants (ensure Data API access)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT ALL ON public.practice_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

-- 2. Indexes for stats queries
CREATE INDEX IF NOT EXISTS practice_sessions_user_created_idx ON public.practice_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS practice_sessions_user_exercise_idx ON public.practice_sessions (user_id, exercise_id);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON public.favorites (user_id);

-- 3. Relax/refine XP validation: 10 XP per minute (continuous), min 5, max 600
CREATE OR REPLACE FUNCTION public.validate_practice_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  max_xp integer;
BEGIN
  IF NEW.duration_seconds IS NULL OR NEW.duration_seconds < 0 OR NEW.duration_seconds > 14400 THEN
    RAISE EXCEPTION 'Invalid duration_seconds';
  END IF;
  IF NEW.bpm IS NOT NULL AND (NEW.bpm < 10 OR NEW.bpm > 400) THEN
    RAISE EXCEPTION 'Invalid bpm';
  END IF;
  max_xp := LEAST(600, GREATEST(5, floor(NEW.duration_seconds / 6.0)::int));
  IF NEW.xp_earned IS NULL OR NEW.xp_earned < 0 THEN
    NEW.xp_earned := 0;
  ELSIF NEW.xp_earned > max_xp THEN
    NEW.xp_earned := max_xp;
  END IF;
  IF NEW.accuracy IS NOT NULL AND (NEW.accuracy < 0 OR NEW.accuracy > 100) THEN
    RAISE EXCEPTION 'Invalid accuracy';
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Allow trusted server-side progress updates through a session flag
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND coalesce(current_setting('app.progress_update', true), '') <> 'on' THEN
    NEW.id := OLD.id;
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.streak_days := OLD.streak_days;
    NEW.last_practice_at := OLD.last_practice_at;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- 5. Server-side progress recorder
CREATE OR REPLACE FUNCTION public.record_practice_session(
  p_exercise_type text,
  p_exercise_id text DEFAULT NULL,
  p_bpm integer DEFAULT NULL,
  p_duration_seconds integer DEFAULT 0,
  p_accuracy numeric DEFAULT NULL
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
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_duration_seconds IS NULL OR p_duration_seconds < 0 THEN
    p_duration_seconds := 0;
  END IF;
  p_duration_seconds := LEAST(p_duration_seconds, 14400);

  v_xp := LEAST(600, GREATEST(5, floor(p_duration_seconds / 6.0)::int));

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

GRANT EXECUTE ON FUNCTION public.record_practice_session(text, text, integer, integer, numeric) TO authenticated;