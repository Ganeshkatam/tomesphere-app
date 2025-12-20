-- PHASE 3A: STUDY GROUPS DATABASE SCHEMA
-- Creates tables for collaborative study groups

-- Study Groups Table
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    created_by UUID,
    max_members INTEGER DEFAULT 50,
    is_private BOOLEAN DEFAULT false,
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID,
    user_id UUID,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Messages Table
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID,
    user_id UUID,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Files Table
CREATE TABLE IF NOT EXISTS group_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID,
    uploaded_by UUID,
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_files_group_id ON group_files(group_id);

-- Enable RLS
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_files ENABLE ROW LEVEL SECURITY;

-- Policies for study_groups
DROP POLICY IF EXISTS "Anyone can view public groups" ON study_groups;
CREATE POLICY "Anyone can view public groups"
    ON study_groups FOR SELECT
    USING (is_private = false OR created_by::text = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON study_groups;
CREATE POLICY "Authenticated users can create groups"
    ON study_groups FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Creators can update their groups" ON study_groups;
CREATE POLICY "Creators can update their groups"
    ON study_groups FOR UPDATE
    USING (created_by::text = auth.uid()::text);

-- Policies for group_members
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
CREATE POLICY "Users can view group members"
    ON group_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Policies for group_messages
DROP POLICY IF EXISTS "Members can view messages" ON group_messages;
CREATE POLICY "Members can view messages"
    ON group_messages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Members can post messages" ON group_messages;
CREATE POLICY "Members can post messages"
    ON group_messages FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Policies for group_files
DROP POLICY IF EXISTS "Members can view files" ON group_files;
CREATE POLICY "Members can view files"
    ON group_files FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Members can upload files" ON group_files;
CREATE POLICY "Members can upload files"
    ON group_files FOR INSERT
    WITH CHECK (auth.uid()::text = uploaded_by::text);

SELECT 'Study Groups schema created!' AS message;
