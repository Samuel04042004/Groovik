CREATE TABLE public.worship_pad_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_slug text NOT NULL DEFAULT 'worship-pack-01',
  chord_id text NOT NULL,
  root_note text NOT NULL,
  quality text NOT NULL CHECK (quality IN ('maj','min')),
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'audio/mpeg',
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_slug, chord_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_pad_samples TO authenticated;
GRANT ALL ON public.worship_pad_samples TO service_role;

ALTER TABLE public.worship_pad_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own worship samples" ON public.worship_pad_samples
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own worship samples" ON public.worship_pad_samples
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own worship samples" ON public.worship_pad_samples
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own worship samples" ON public.worship_pad_samples
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX worship_pad_samples_user_pack_idx ON public.worship_pad_samples (user_id, pack_slug);

CREATE OR REPLACE FUNCTION public.touch_worship_pad_samples()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_worship_pad_samples_updated_at
  BEFORE UPDATE ON public.worship_pad_samples
  FOR EACH ROW EXECUTE FUNCTION public.touch_worship_pad_samples();

CREATE POLICY "worship samples read own folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'worship-pad-samples' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "worship samples insert own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'worship-pad-samples' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "worship samples update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'worship-pad-samples' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'worship-pad-samples' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "worship samples delete own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'worship-pad-samples' AND auth.uid()::text = (storage.foldername(name))[1]);