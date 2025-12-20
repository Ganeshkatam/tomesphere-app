-- Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    edu_email TEXT UNIQUE NOT NULL,
    institution_name TEXT,
    student_id TEXT,
    graduation_year INTEGER,
    major TEXT,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_at TIMESTAMPTZ,
    discount_eligible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Tokens
CREATE TABLE IF NOT EXISTS student_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    edu_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_verification_status ON student_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON student_verification_tokens(token);

-- Row Level Security
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for student_profiles
CREATE POLICY "Users can view their own student profile"
    ON student_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student profile"
    ON student_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for verification tokens
CREATE POLICY "Users can view their own tokens"
    ON student_verification_tokens FOR SELECT
    USING (auth.uid() = user_id);
