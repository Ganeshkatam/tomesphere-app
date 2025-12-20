-- ========================================
-- COMPLETE STUDENT FEATURES DATABASE SETUP
-- This file combines all migrations and can be run safely multiple times
-- ========================================

-- ========================================
-- PART 1: STUDENT VERIFICATION
-- ========================================

-- Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    edu_email TEXT UNIQUE NOT NULL,
    institution_name TEXT,
    student_id TEXT,
    graduation_year INTEGER,
    major TEXT,
    verification_status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    discount_eligible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Tokens Table
CREATE TABLE IF NOT EXISTS student_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    edu_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Student Verification
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_verification_status ON student_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON student_verification_tokens(token);

-- Enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can insert their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can update their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can view their own tokens" ON student_verification_tokens;

-- Create policies
CREATE POLICY "Users can view their own student profile"
    ON student_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student profile"
    ON student_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
    ON student_verification_tokens FOR SELECT
    USING (auth.uid() = user_id);

-- ========================================
-- PART 2: SMART NOTES
-- ========================================

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Highlights Table
CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    page_number INTEGER,
    color TEXT DEFAULT 'yellow',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_note_id ON highlights(note_id);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view highlights from their notes" ON highlights;
DROP POLICY IF EXISTS "Users can insert highlights to their notes" ON highlights;
DROP POLICY IF EXISTS "Users can update highlights from their notes" ON highlights;
DROP POLICY IF EXISTS "Users can delete highlights from their notes" ON highlights;

-- Create policies
CREATE POLICY "Users can view their own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view highlights from their notes"
    ON highlights FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert highlights to their notes"
    ON highlights FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()
    ));

CREATE POLICY "Users can update highlights from their notes"
    ON highlights FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete highlights from their notes"
    ON highlights FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()
    ));

-- ========================================
-- PART 3: EXAM PREPARATION
-- ========================================

-- Practice Tests Table
CREATE TABLE IF NOT EXISTS practice_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_by UUID REFERENCES profiles(id),
    time_limit_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Questions Table
CREATE TABLE IF NOT EXISTS test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK (question_type IN ('multiple-choice', 'true-false', 'short-answer')),
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER
);

-- Flashcards Table
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Test Attempts Table
CREATE TABLE IF NOT EXISTS user_test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    answers JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Exam Prep
CREATE INDEX IF NOT EXISTS idx_practice_tests_subject ON practice_tests(subject);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_user_id ON user_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_test_id ON user_test_attempts(test_id);

-- Enable RLS
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view practice tests" ON practice_tests;
DROP POLICY IF EXISTS "Authenticated users can create practice tests" ON practice_tests;
DROP POLICY IF EXISTS "Anyone can view test questions" ON test_questions;
DROP POLICY IF EXISTS "Users can view their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can view their own test attempts" ON user_test_attempts;
DROP POLICY IF EXISTS "Users can insert their own test attempts" ON user_test_attempts;

-- Create policies
CREATE POLICY "Anyone can view practice tests"
    ON practice_tests FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create practice tests"
    ON practice_tests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view test questions"
    ON test_questions FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own flashcards"
    ON flashcards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards"
    ON flashcards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
    ON flashcards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
    ON flashcards FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own test attempts"
    ON user_test_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test attempts"
    ON user_test_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- PART 4: ACADEMIC LIBRARY (OPTIONAL)
-- ========================================

-- Add academic fields to books table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='books' AND column_name='academic_subject') THEN
        ALTER TABLE books ADD COLUMN academic_subject TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='books' AND column_name='is_textbook') THEN
        ALTER TABLE books ADD COLUMN is_textbook BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='books' AND column_name='edition') THEN
        ALTER TABLE books ADD COLUMN edition TEXT;
    END IF;
END $$;

-- Indexes for Academic Library
CREATE INDEX IF NOT EXISTS idx_books_academic_subject ON books(academic_subject);
CREATE INDEX IF NOT EXISTS idx_books_is_textbook ON books(is_textbook);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- All tables, indexes, and policies have been created successfully!
-- You can now use all student features:
-- - Student Verification (/verify-student)
-- - Smart Notes (/notes)
-- - Exam Preparation (/exam-prep)
-- - Academic Library (/academic)
-- - Citation Generator (/citations)
