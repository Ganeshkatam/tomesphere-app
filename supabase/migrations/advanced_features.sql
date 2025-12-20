-- Quick migrations for remaining features

-- A/B Testing
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    variant_a JSONB,
    variant_b JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Notifications
CREATE TABLE IF NOT EXISTS push_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_to JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partners
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT, -- 'publisher', 'author', 'distributor'
    contact_email TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue Tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    amount DECIMAL(10,2),
    type TEXT, -- 'subscription', 'purchase', 'refund'
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID REFERENCES profiles(id),
    badge_id UUID REFERENCES badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS on all tables
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all
DROP POLICY IF EXISTS "Admins manage experiments" ON ab_experiments;
CREATE POLICY "Admins manage experiments" ON ab_experiments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins manage notifications" ON push_notifications;
CREATE POLICY "Admins manage notifications" ON push_notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins manage partners" ON partners;
CREATE POLICY "Admins manage partners" ON partners FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins view transactions" ON transactions;
CREATE POLICY "Admins view transactions" ON transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Everyone views badges" ON badges;
CREATE POLICY "Everyone views badges" ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own badges" ON user_badges;
CREATE POLICY "Users view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());
