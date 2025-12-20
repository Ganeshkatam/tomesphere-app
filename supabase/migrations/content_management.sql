-- Content Management System Database Schema
-- Announcements, Maintenance Mode, and Site Configuration

-- 1. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'error', 'maintenance')) DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    target_audience TEXT[] DEFAULT ARRAY['all']::TEXT[], -- 'all', 'students', 'admins', 'verified'
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- 2. Site Configuration Table
CREATE TABLE IF NOT EXISTS site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO site_config (key, value, description) VALUES
('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back soon."}'::jsonb, 'Maintenance mode settings'),
('featured_book_limit', '10'::jsonb, 'Number of featured books on homepage'),
('signup_enabled', 'true'::jsonb, 'Allow new user signups'),
('email_verification_required', 'true'::jsonb, 'Require email verification')
ON CONFLICT (key) DO NOTHING;

-- 3. Newsletters Table
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,
    segment JSONB DEFAULT '{}'::jsonb, -- User segmentation criteria
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipients_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled_at ON newsletters(scheduled_at);

-- 4. RLS Policies

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active announcements" ON announcements;
CREATE POLICY "Everyone can view active announcements"
    ON announcements FOR SELECT
    USING (
        is_active = true
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
    );

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
    ON announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Site Config
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view site config" ON site_config;
CREATE POLICY "Everyone can view site config"
    ON site_config FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can update site config" ON site_config;
CREATE POLICY "Admins can update site config"
    ON site_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Newsletters
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage newsletters" ON newsletters;
CREATE POLICY "Admins can manage newsletters"
    ON newsletters FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Functions

-- Get active announcement for user
CREATE OR REPLACE FUNCTION get_active_announcements(p_user_role TEXT DEFAULT 'user')
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.type,
        a.starts_at,
        a.ends_at
    FROM announcements a
    WHERE a.is_active = true
    AND (a.starts_at IS NULL OR a.starts_at <= NOW())
    AND (a.ends_at IS NULL OR a.ends_at >= NOW())
    AND ('all' = ANY(a.target_audience) OR p_user_role = ANY(a.target_audience))
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle maintenance mode
CREATE OR REPLACE FUNCTION toggle_maintenance_mode(p_enabled BOOLEAN, p_message TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_config JSONB;
BEGIN
    -- Build config
    v_config := jsonb_build_object(
        'enabled', p_enabled,
        'message', COALESCE(p_message, 'We are currently performing maintenance. Please check back soon.')
    );
    
    -- Update or insert
    INSERT INTO site_config (key, value, updated_by)
    VALUES ('maintenance_mode', v_config, auth.uid())
    ON CONFLICT (key) DO UPDATE
    SET value = v_config,
        updated_by = auth.uid(),
        updated_at = NOW();
    
    RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE announcements IS 'Site-wide announcements and banners';
COMMENT ON TABLE site_config IS 'Global site configuration';
COMMENT ON TABLE newsletters IS 'Email newsletters and campaigns';
