-- PR 2: Reader & Content Security
-- Transitions book-pdfs storage bucket to private, enforces unique primary files,
-- and normalizes book_files.storage_path from raw public URLs to relative canonical object keys.
-- INVARIANT: Canonical object key grammar must be: <book_id>/<safe_filename>

-- 1. Transition book-pdfs bucket to private
UPDATE storage.buckets
SET public = false
WHERE id = 'book-pdfs';

-- 2. Fail-closed check: Ensure only supported formats exist
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

-- 4. Environment-agnostic normalization: Strip URL protocols, hostnames, and storage endpoints
-- This works across local, staging, test, and production environments without hardcoding hostnames.
UPDATE public.book_files
SET storage_path = regexp_replace(
  storage_path,
  '^https?://[^/]+/storage/v1/object/(?:public|sign)/book-pdfs/',
  ''
)
WHERE storage_path ~* '^https?://[^/]+/storage/v1/object/(?:public|sign)/book-pdfs/';

-- Strip residual bucket prefixes
UPDATE public.book_files
SET storage_path = regexp_replace(storage_path, '^book-pdfs/', '')
WHERE storage_path LIKE 'book-pdfs/%';

-- Strip leading slashes
UPDATE public.book_files
SET storage_path = ltrim(storage_path, '/')
WHERE storage_path LIKE '/%';

-- 5. Canonical path prefixing: Ensure path root matches book_id (<book_id>/<filename>)
-- If legacy records were stored with flat filenames, prefix with book_id
UPDATE public.book_files
SET storage_path = book_id::text || '/' || storage_path
WHERE storage_path NOT LIKE (book_id::text || '/%');

-- Optional synchronization of flat storage.objects names to canonical prefixed names
UPDATE storage.objects
SET name = bf.book_id::text || '/' || storage.objects.name
FROM public.book_files bf
WHERE storage.objects.bucket_id = 'book-pdfs'
  AND storage.objects.name NOT LIKE (bf.book_id::text || '/%')
  AND storage.objects.name = split_part(bf.storage_path, '/', 2);

-- 6. Fail-closed check: Verify normalization produced non-empty, non-duplicate canonical paths
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

-- 7. Add positive canonical grammar check constraint
-- Enforces:
-- - First path segment strictly matches the row's book_id (ownership binding)
-- - Second segment consists of safe filename characters
-- - Exactly two path segments (no nested directories)
-- - Disallows directory traversal (..), backslashes, queries, and fragments
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
        split_part(storage_path, '/', 1) = book_id::text
        AND split_part(storage_path, '/', 2) ~ '^[a-zA-Z0-9._ ()\-''"]+$'
        AND split_part(storage_path, '/', 3) = ''
        AND storage_path NOT LIKE '%..%'
        AND storage_path NOT LIKE '%\%'
        AND storage_path NOT LIKE '%?%'
        AND storage_path NOT LIKE '%#%'
      );
  END IF;
END $$;

-- 8. Add partial unique index: Exactly one primary content file per book
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_files_primary
  ON public.book_files (book_id)
  WHERE is_primary = true;
