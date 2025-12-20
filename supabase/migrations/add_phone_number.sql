-- Add phone_number column to profiles table
-- Allows users to sign up with phone number and manage it in profile

-- First, drop if exists with wrong type
ALTER TABLE profiles DROP COLUMN IF EXISTS phone_number;

-- Create with correct TEXT type
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Add unique constraint to prevent duplicate phone numbers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_phone_number'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);
    END IF;
END $$;

COMMENT ON COLUMN profiles.phone_number IS 'User phone number in international format (e.g., +918317527188). MUST be TEXT to preserve leading zeros and + symbol';
