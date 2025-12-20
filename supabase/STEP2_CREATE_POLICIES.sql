-- STEP 2: CREATE POLICIES
-- Run this file AFTER step 1 succeeds

DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes" ON notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
CREATE POLICY "Users can insert their own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view highlights from their notes" ON highlights;
CREATE POLICY "Users can view highlights from their notes" ON highlights FOR SELECT 
USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert highlights to their notes" ON highlights;
CREATE POLICY "Users can insert highlights to their notes" ON highlights FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = highlights.note_id AND notes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their own flashcards" ON flashcards;
CREATE POLICY "Users can view their own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flashcards" ON flashcards;
CREATE POLICY "Users can insert their own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own flashcards" ON flashcards;
CREATE POLICY "Users can update their own flashcards" ON flashcards FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own flashcards" ON flashcards;
CREATE POLICY "Users can delete their own flashcards" ON flashcards FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own test attempts" ON user_test_attempts;
CREATE POLICY "Users can view their own test attempts" ON user_test_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own test attempts" ON user_test_attempts;
CREATE POLICY "Users can insert their own test attempts" ON user_test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view practice tests" ON practice_tests;
CREATE POLICY "Anyone can view practice tests" ON practice_tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view test questions" ON test_questions;
CREATE POLICY "Anyone can view test questions" ON test_questions FOR SELECT USING (true);

SELECT 'Policies created successfully!' AS result;
