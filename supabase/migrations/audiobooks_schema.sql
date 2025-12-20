-- Audiobooks Feature Database Schema

-- Audiobooks table
CREATE TABLE IF NOT EXISTS audiobooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    narrator VARCHAR(255),
    duration_seconds INTEGER,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    file_size_mb DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio progress tracking
CREATE TABLE IF NOT EXISTS audio_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audiobook_id UUID NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
    current_position_seconds INTEGER DEFAULT 0,
    playback_speed DECIMAL(3,2) DEFAULT 1.0,
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, audiobook_id)
);

-- Audio bookmarks
CREATE TABLE IF NOT EXISTS audio_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audiobook_id UUID NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
    position_seconds INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audiobooks_book_id ON audiobooks(book_id);
CREATE INDEX IF NOT EXISTS idx_audio_progress_user_id ON audio_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_progress_audiobook_id ON audio_progress(audiobook_id);
CREATE INDEX IF NOT EXISTS idx_audio_bookmarks_user_audiobook ON audio_bookmarks(user_id, audiobook_id);

-- RLS Policies
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audiobooks" ON audiobooks FOR SELECT USING (true);
CREATE POLICY "Users can view own progress" ON audio_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON audio_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own bookmarks" ON audio_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON audio_bookmarks FOR ALL USING (auth.uid() = user_id);
