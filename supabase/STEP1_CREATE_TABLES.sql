-- STEP 1: CREATE TABLES ONLY
-- Run this file FIRST, then run the other files

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

CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    page_number INTEGER,
    color TEXT DEFAULT 'yellow',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
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
    created_by UUID REFERENCES profiles(id),
    time_limit_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS user_test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    answers JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_note_id ON highlights(note_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_attempts ENABLE ROW LEVEL SECURITY;

SELECT 'Tables created successfully!' AS result;
