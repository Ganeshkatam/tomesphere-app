-- PHASE 3B: TEXTBOOK EXCHANGE DATABASE SCHEMA
-- Creates tables for student marketplace

-- Textbook Listings Table
CREATE TABLE IF NOT EXISTS textbook_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID,
    book_id UUID,
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    edition TEXT,
    condition TEXT,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    images TEXT[],
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Textbook Offers Table
CREATE TABLE IF NOT EXISTS textbook_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID,
    buyer_id UUID,
    offered_price DECIMAL(10,2),
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Listings Table
CREATE TABLE IF NOT EXISTS saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    listing_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_textbook_listings_seller ON textbook_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_textbook_listings_status ON textbook_listings(status);
CREATE INDEX IF NOT EXISTS idx_textbook_offers_listing ON textbook_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_textbook_offers_buyer ON textbook_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_user ON saved_listings(user_id);

-- Enable RLS
ALTER TABLE textbook_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Policies for textbook_listings
DROP POLICY IF EXISTS "Anyone can view available listings" ON textbook_listings;
CREATE POLICY "Anyone can view available listings"
    ON textbook_listings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can create their listings" ON textbook_listings;
CREATE POLICY "Users can create their listings"
    ON textbook_listings FOR INSERT
    WITH CHECK (auth.uid()::text = seller_id::text);

DROP POLICY IF EXISTS "Sellers can update their listings" ON textbook_listings;
CREATE POLICY "Sellers can update their listings"
    ON textbook_listings FOR UPDATE
    USING (auth.uid()::text = seller_id::text);

DROP POLICY IF EXISTS "Sellers can delete their listings" ON textbook_listings;
CREATE POLICY "Sellers can delete their listings"
    ON textbook_listings FOR DELETE
    USING (auth.uid()::text = seller_id::text);

-- Policies for textbook_offers
DROP POLICY IF EXISTS "Users can view relevant offers" ON textbook_offers;
CREATE POLICY "Users can view relevant offers"
    ON textbook_offers FOR SELECT
    USING (
        auth.uid()::text = buyer_id::text OR
        EXISTS (SELECT 1 FROM textbook_listings WHERE textbook_listings.id::text = textbook_offers.listing_id::text AND textbook_listings.seller_id::text = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Buyers can make offers" ON textbook_offers;
CREATE POLICY "Buyers can make offers"
    ON textbook_offers FOR INSERT
    WITH CHECK (auth.uid()::text = buyer_id::text);

-- Policies for saved_listings
DROP POLICY IF EXISTS "Users can view their saved listings" ON saved_listings;
CREATE POLICY "Users can view their saved listings"
    ON saved_listings FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can save listings" ON saved_listings;
CREATE POLICY "Users can save listings"
    ON saved_listings FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can unsave listings" ON saved_listings;
CREATE POLICY "Users can unsave listings"
    ON saved_listings FOR DELETE
    USING (auth.uid()::text = user_id::text);

SELECT 'Textbook Exchange schema created!' AS message;
