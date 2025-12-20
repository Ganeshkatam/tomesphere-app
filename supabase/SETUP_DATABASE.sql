-- =======================================================
-- TOMESPHERE STUDENT FEATURES - COMPLETE DATABASE SETUP
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- =======================================================

-- Clean up any existing policies first to prevent conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing policies
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE tablename IN ('student_profiles', 'student_verification_tokens', 
                                 'notes', 'highlights', 'practice_tests', 'test_questions', 
                                 'flashcards', 'user_test_attempts'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- =======================================================
-- CREATE ALL TABLES
-- =======================================================

-- Student Profiles
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

-- Student Verification Tokens
CREATE TABLE IF NOT EXISTS student_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    edu_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
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

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    page_number INTEGER,
    color TEXT DEFAULT 'yellow',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice Tests
CREATE TABLE IF NOT EXISTS practice_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT,
    created_by UUID REFERENCES profiles(id),
    time_limit_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Questions
CREATE TABLE IF NOT EXISTS test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Test Attempts
CREATE TABLE IF NOT EXISTS user_test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    answers JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- ADD COLUMNS TO EXISTING TABLES
-- =======================================================

DO $$ 
BEGIN
    -- Add academic columns to books if they don't exist
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

-- =======================================================
-- CREATE INDEXES
-- =======================================================

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON student_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_note_id ON highlights(note_id);
CREATE INDEX IF NOT EXISTS idx_practice_tests_subject ON practice_tests(subject);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_user_id ON user_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_test_id ON user_test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_books_academic_subject ON books(academic_subject);
CREATE INDEX IF NOT EXISTS idx_books_is_textbook ON books(is_textbook);

-- =======================================================
-- ENABLE ROW LEVEL SECURITY
-- =======================================================

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_attempts ENABLE ROW LEVEL SECURITY;

-- =======================================================
-- CREATE POLICIES
-- =======================================================

-- Student Profiles Policies
CREATE POLICY "Users can view their own student profile"
    ON student_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student profile"
    ON student_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Verification Tokens Policies
CREATE POLICY "Users can view their own tokens"
    ON student_verification_tokens FOR SELECT
    USING (auth.uid() = user_id);

-- Notes Policies
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

-- Highlights Policies
CREATE POLICY "Users can view highlights from their notes"
    ON highlights FOR SELECT
    USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can insert highlights to their notes"
    ON highlights FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can update highlights from their notes"
    ON highlights FOR UPDATE
    USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can delete highlights from their notes"
    ON highlights FOR DELETE
    USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()));

-- Practice Tests Policies
CREATE POLICY "Anyone can view practice tests"
    ON practice_tests FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create practice tests"
    ON practice_tests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Test Questions Policies
CREATE POLICY "Anyone can view test questions"
    ON test_questions FOR SELECT
    USING (true);

-- Flashcards Policies
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

-- User Test Attempts Policies
CREATE POLICY "Users can view their own test attempts"
    ON user_test_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test attempts"
    ON user_test_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =======================================================
-- MIGRATION COMPLETE!
-- =======================================================
SELECT 'Database setup complete! All student features are ready.' AS status;
