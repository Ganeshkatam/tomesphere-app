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
    options JSONB, -- For multiple choice: ["option1", "option2", ...]
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
    answers JSONB, -- {question_id: user_answer}
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_tests_subject ON practice_tests(subject);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_user_id ON user_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_test_id ON user_test_attempts(test_id);

-- Row Level Security
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_attempts ENABLE ROW LEVEL SECURITY;

-- Practice Tests Policies (Public read, creator write)
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
