-- Add academic fields to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS academic_subject TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_textbook BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS edition TEXT;

-- Create index for faster academic subject queries
CREATE INDEX IF NOT EXISTS idx_books_academic_subject ON books(academic_subject);
CREATE INDEX IF NOT EXISTS idx_books_is_textbook ON books(is_textbook);

-- Academic subjects enum (optional, for validation)
CREATE TYPE academic_subject_type AS ENUM (
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business',
    'Economics',
    'Psychology',
    'History',
    'Literature',
    'Philosophy',
    'Medicine',
    'Law',
    'Education'
);
