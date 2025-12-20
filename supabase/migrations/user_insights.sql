-- Advanced User Insights Database Schema
-- Run this migration to add user activity tracking and admin actions

-- 1. User Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_data JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast querying
CREATE INDEX idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_action_type ON user_activity_log(action_type);

-- 2. User Bans Table
CREATE TABLE IF NOT EXISTS user_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    banned_by UUID REFERENCES profiles(id),
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- Index for checking active bans
CREATE INDEX idx_user_bans_user_id_active ON user_bans(user_id, is_active);
CREATE INDEX idx_user_bans_expires_at ON user_bans(expires_at);

-- 3. Add engagement score to profiles (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- 4. Login History Table
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT
);

-- Index for fast querying
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_at ON login_history(login_at DESC);

-- 5. RLS Policies

-- User Activity Log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
    ON user_activity_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
    ON user_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert activity"
    ON user_activity_log FOR INSERT
    WITH CHECK (true);

-- User Bans
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bans"
    ON user_bans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage bans"
    ON user_bans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Login History  
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
    ON login_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history"
    ON login_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert login history"
    ON login_history FOR INSERT
    WITH CHECK (true);

-- 6. Functions

-- Function to update engagement score
CREATE OR REPLACE FUNCTION update_engagement_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_activity_count INTEGER;
    v_login_count INTEGER;
BEGIN
    -- Count recent activities (last 30 days)
    SELECT COUNT(*)
    INTO v_activity_count
    FROM user_activity_log
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- Get login count
    SELECT login_count
    INTO v_login_count
    FROM profiles
    WHERE id = p_user_id;
    
    -- Calculate score
    v_score := (v_activity_count * 10) + (COALESCE(v_login_count, 0) * 5);
    
    -- Update profile
    UPDATE profiles
    SET engagement_score = v_score
    WHERE id = p_user_id;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action_type TEXT,
    p_action_data JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO user_activity_log (
        user_id,
        action_type,
        action_data,
        ip_address,
        user_agent
    )
    VALUES (
        p_user_id,
        p_action_type,
        p_action_data,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_log_id;
    
    -- Update engagement score asynchronously
    PERFORM update_engagement_score(p_user_id);
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE user_activity_log IS 'Tracks all user actions for analytics and admin insights';
COMMENT ON TABLE user_bans IS 'Manages user bans and suspensions';
COMMENT ON TABLE login_history IS 'Tracks login attempts for security monitoring';
COMMENT ON FUNCTION update_engagement_score IS 'Calculates user engagement score based on activity';
COMMENT ON FUNCTION log_user_activity IS 'Logs a user activity and updates engagement score';
