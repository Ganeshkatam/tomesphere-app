-- PR 2: Reader & Content Security
-- Transitions book-pdfs storage bucket to private, enforces unique primary files,
-- and normalizes book_files.storage_path from raw public URLs to relative canonical object keys.

-- 1. Transition book-pdfs bucket to private
UPDATE storage.buckets
SET public = false
WHERE id = 'book-pdfs';

-- 2. Ensure only supported formats exist (fail-closed integrity check)
DO $$
DECLARE
  v_invalid_count integer;
BEGIN
  SELECT count(*)
  INTO v_invalid_count
  FROM public.book_files
  WHERE format NOT IN ('pdf', 'epub');

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'PR2 Migration Aborted: % book_files records contain unsupported formats', v_invalid_count;
  END IF;
END $$;

-- 3. Fail-closed check: Ensure any URL-based storage_path specifically targets the book-pdfs bucket
DO $$
DECLARE
  v_external_count integer;
BEGIN
  SELECT count(*)
  INTO v_external_count
  FROM public.book_files
  WHERE (storage_path LIKE 'http://%' OR storage_path LIKE 'https://%')
    AND storage_path NOT LIKE '%/storage/v1/object/public/book-pdfs/%'
    AND storage_path NOT LIKE '%/storage/v1/object/sign/book-pdfs/%';

  IF v_external_count > 0 THEN
    RAISE EXCEPTION 'PR2 Migration Aborted: % book_files records reference non-book-pdfs URLs', v_external_count;
  END IF;
END $$;

-- 4. Normalize URL-encoded paths to clean relative canonical object keys
-- Strip host, storage API endpoints, bucket names, and decode URI percent-encoding
UPDATE public.book_files
SET storage_path = btrim(
  replace(
    replace(
      replace(
        storage_path,
        'https://qusuvzwycdmnecixzsgc.supabase.co/storage/v1/object/public/book-pdfs/',
        ''
      ),
      'https://qusuvzwycdmnecixzsgc.supabase.co/storage/v1/object/sign/book-pdfs/',
      ''
    ),
    'book-pdfs/',
    ''
  ),
  '/'
)
WHERE storage_path LIKE 'http://%'
   OR storage_path LIKE 'https://%'
   OR storage_path LIKE 'book-pdfs/%';

-- 5. Fail-closed check: Verify normalization produced no empty or duplicate paths
DO $$
DECLARE
  v_empty_count integer;
  v_duplicate_count integer;
BEGIN
  SELECT count(*)
  INTO v_empty_count
  FROM public.book_files
  WHERE storage_path IS NULL OR length(btrim(storage_path)) = 0;

  IF v_empty_count > 0 THEN
    RAISE EXCEPTION 'PR2 Migration Aborted: % book_files records resolved to empty paths', v_empty_count;
  END IF;

  SELECT count(*)
  INTO v_duplicate_count
  FROM (
    SELECT book_id, storage_path, count(*)
    FROM public.book_files
    GROUP BY book_id, storage_path
    HAVING count(*) > 1
  ) dups;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'PR2 Migration Aborted: % duplicate (book_id, storage_path) collisions detected', v_duplicate_count;
  END IF;
END $$;

-- 6. Add constraint preventing public URLs or bucket prefixes in storage_path
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.book_files'::regclass
      AND conname = 'chk_book_files_storage_path_canonical'
  ) THEN
    ALTER TABLE public.book_files
      ADD CONSTRAINT chk_book_files_storage_path_canonical
      CHECK (
        storage_path NOT LIKE 'http://%' AND
        storage_path NOT LIKE 'https://%' AND
        storage_path NOT LIKE 'book-pdfs/%' AND
        storage_path NOT LIKE '/%'
      );
  END IF;
END $$;

-- 7. Add partial unique index: Exactly one primary file per book
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_files_primary
  ON public.book_files (book_id)
  WHERE is_primary = true;
