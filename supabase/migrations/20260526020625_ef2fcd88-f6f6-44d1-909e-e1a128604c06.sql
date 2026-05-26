
-- 1. Drop premium columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_premium;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS premium_since;

-- 2. Profiles: protect privileged columns via trigger
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow privileged column changes when run as service_role (server-side)
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
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
$$;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Keep existing RLS policies; add WITH CHECK to UPDATE
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Practice sessions: validation trigger
CREATE OR REPLACE FUNCTION public.validate_practice_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_xp integer;
BEGIN
  IF NEW.duration_seconds IS NULL OR NEW.duration_seconds < 0 OR NEW.duration_seconds > 14400 THEN
    RAISE EXCEPTION 'Invalid duration_seconds';
  END IF;
  IF NEW.bpm IS NOT NULL AND (NEW.bpm < 20 OR NEW.bpm > 400) THEN
    RAISE EXCEPTION 'Invalid bpm';
  END IF;
  -- Cap XP: 10 XP per minute, max 600
  max_xp := LEAST(600, GREATEST(0, (NEW.duration_seconds / 60) * 10));
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
$$;

DROP TRIGGER IF EXISTS validate_practice_session_trigger ON public.practice_sessions;
CREATE TRIGGER validate_practice_session_trigger
BEFORE INSERT OR UPDATE ON public.practice_sessions
FOR EACH ROW EXECUTE FUNCTION public.validate_practice_session();

-- Add UPDATE + DELETE policies for practice_sessions
CREATE POLICY "users update own sessions"
ON public.practice_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own sessions"
ON public.practice_sessions
FOR DELETE
USING (auth.uid() = user_id);
