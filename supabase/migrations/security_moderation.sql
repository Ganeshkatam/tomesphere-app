-- Security & Moderation Database Schema
-- Flagged Content, Security Logs, IP Bans

-- 1. Flagged Content Table
CREATE TABLE IF NOT EXISTS flagged_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL, -- 'review', 'comment', 'book', 'user'
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    reported_by UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flagged_content_status ON flagged_content(status);
CREATE INDEX idx_flagged_content_type ON flagged_content(content_type, content_id);
CREATE INDEX idx_flagged_content_created_at ON flagged_content(created_at DESC);

-- 2. Security Logs Table
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- 'failed_login', 'suspicious_activity', 'rate_limit', etc.
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    ip_address TEXT,
    user_id UUID REFERENCES profiles(id),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_logs_severity ON security_logs(severity, created_at DESC);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);

-- 3. IP Bans Table
CREATE TABLE IF NOT EXISTS ip_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address TEXT UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    banned_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_bans_ip_active ON ip_bans(ip_address, is_active);
CREATE INDEX idx_ip_bans_expires_at ON ip_bans(expires_at);

-- 4. Failed Login Attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    attempt_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_failed_logins_ip ON failed_login_attempts(ip_address, attempt_at DESC);
CREATE INDEX idx_failed_logins_email ON failed_login_attempts(email, attempt_at DESC);

-- 5. RLS Policies

ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag content"
    ON flagged_content FOR INSERT
    WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view own flags"
    ON flagged_content FOR SELECT
    USING (auth.uid() = reported_by);

CREATE POLICY "Admins can manage flagged content"
    ON flagged_content FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
    ON security_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert security logs"
    ON security_logs FOR INSERT
    WITH CHECK (true);

ALTER TABLE ip_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage IP bans"
    ON ip_bans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can log failed logins" ON failed_login_attempts;
CREATE POLICY "System can log failed logins"
    ON failed_login_attempts FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view failed logins" ON failed_login_attempts;
CREATE POLICY "Admins can view failed logins"
    ON failed_login_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. Functions

-- Check if IP is banned
CREATE OR REPLACE FUNCTION is_ip_banned(p_ip_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM ip_bans
        WHERE ip_address = p_ip_address
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log security event
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_logs (
        event_type, severity, ip_address, user_id, description, metadata
    )
    VALUES (
        p_event_type, p_severity, p_ip_address, p_user_id, p_description, p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-ban based on failed attempts
CREATE OR REPLACE FUNCTION check_auto_ban()
RETURNS TRIGGER AS $$
DECLARE
    v_attempt_count INTEGER;
BEGIN
    -- Count failed attempts from this IP in last hour
    SELECT COUNT(*)
    INTO v_attempt_count
    FROM failed_login_attempts
    WHERE ip_address = NEW.ip_address
    AND attempt_at > NOW() - INTERVAL '1 hour';
    
    -- If more than 10 attempts, auto-ban for 24 hours
    IF v_attempt_count > 10 THEN
        INSERT INTO ip_bans (ip_address, reason, expires_at)
        VALUES (
            NEW.ip_address,
            'Auto-banned: Too many failed login attempts',
            NOW() + INTERVAL '24 hours'
        )
        ON CONFLICT (ip_address) DO UPDATE
        SET is_active = true,
            expires_at = NOW() + INTERVAL '24 hours';
        
        -- Log security event
        PERFORM log_security_event(
            'auto_ban',
            'high',
            NEW.ip_address,
            NULL,
            'IP auto-banned after ' || v_attempt_count || ' failed login attempts'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_auto_ban
    AFTER INSERT ON failed_login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION check_auto_ban();

COMMENT ON TABLE flagged_content IS 'User-reported content for moderation';
COMMENT ON TABLE security_logs IS 'Security events and incidents';
COMMENT ON TABLE ip_bans IS 'Banned IP addresses';
COMMENT ON TABLE failed_login_attempts IS 'Failed login tracking for security';
