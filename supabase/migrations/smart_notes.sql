-- ========================================
-- STEP 1: Create Tables First
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

-- ========================================
-- STEP 2: Create Indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_note_id ON highlights(note_id);

-- ========================================
-- STEP 3: Enable Row Level Security
-- ========================================

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Create Policies
-- ========================================

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
