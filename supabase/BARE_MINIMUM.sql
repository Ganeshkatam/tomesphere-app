-- ULTRA SIMPLE - Just create 3 tables
-- Copy this ENTIRE file and paste into a NEW query

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    book_id UUID,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID,
    text_content TEXT NOT NULL,
    page_number INTEGER,
    color TEXT DEFAULT 'yellow',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    book_id UUID,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT,
    created_by UUID,
    time_limit_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID,
    question_text TEXT NOT NULL,
    question_type TEXT,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    test_id UUID,
    score DECIMAL(5,2),
    answers JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Done! Tables created.' AS message;
