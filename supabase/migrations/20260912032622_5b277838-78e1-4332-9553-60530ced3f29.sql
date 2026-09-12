CREATE POLICY "worship default pack is readable by everyone"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'worship-pad-samples'
  AND position('/' in name) = 0
);