-- ADD SECURITY POLICIES TO STUDENT FEATURE TABLES
-- Run this after BARE_MINIMUM.sql succeeds
-- This ensures users can only access their own data

-- Enable Row Level Security on all tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes"
    ON notes FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
CREATE POLICY "Users can insert their own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ============================================
-- HIGHLIGHTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view highlights from their notes" ON highlights;
CREATE POLICY "Users can view highlights from their notes"
    ON highlights FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id::text = highlights.note_id::text 
            AND notes.user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can insert highlights to their notes" ON highlights;
CREATE POLICY "Users can insert highlights to their notes"
    ON highlights FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id::text = highlights.note_id::text 
            AND notes.user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update highlights from their notes" ON highlights;
CREATE POLICY "Users can update highlights from their notes"
    ON highlights FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id::text = highlights.note_id::text 
            AND notes.user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete highlights from their notes" ON highlights;
CREATE POLICY "Users can delete highlights from their notes"
    ON highlights FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id::text = highlights.note_id::text 
            AND notes.user_id::text = auth.uid()::text
        )
    );

-- ============================================
-- FLASHCARDS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own flashcards" ON flashcards;
CREATE POLICY "Users can view their own flashcards"
    ON flashcards FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own flashcards" ON flashcards;
CREATE POLICY "Users can insert their own flashcards"
    ON flashcards FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own flashcards" ON flashcards;
CREATE POLICY "Users can update their own flashcards"
    ON flashcards FOR UPDATE
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own flashcards" ON flashcards;
CREATE POLICY "Users can delete their own flashcards"
    ON flashcards FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ============================================
-- PRACTICE TESTS POLICIES (Public Read)
-- ============================================

DROP POLICY IF EXISTS "Anyone can view practice tests" ON practice_tests;
CREATE POLICY "Anyone can view practice tests"
    ON practice_tests FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create practice tests" ON practice_tests;
CREATE POLICY "Authenticated users can create practice tests"
    ON practice_tests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TEST QUESTIONS POLICIES (Public Read)
-- ============================================

DROP POLICY IF EXISTS "Anyone can view test questions" ON test_questions;
CREATE POLICY "Anyone can view test questions"
    ON test_questions FOR SELECT
    USING (true);

-- ============================================
-- USER TEST ATTEMPTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own test attempts" ON user_test_attempts;
CREATE POLICY "Users can view their own test attempts"
    ON user_test_attempts FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own test attempts" ON user_test_attempts;
CREATE POLICY "Users can insert their own test attempts"
    ON user_test_attempts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Success!
SELECT 'Security policies added successfully!' AS message;
