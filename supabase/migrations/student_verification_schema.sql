-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Student Verification Requests Table
CREATE TABLE IF NOT EXISTS public.student_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    university_name TEXT NOT NULL,
    student_email TEXT, -- For email verification
    document_url TEXT, -- For ID card upload
    verification_type TEXT CHECK (verification_type IN ('email', 'document', 'hybrid')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent errors on re-run
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.student_verifications;
DROP POLICY IF EXISTS "Users can insert their own verifications" ON public.student_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.student_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.student_verifications;

CREATE POLICY "Users can view their own verifications"
    ON public.student_verifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications"
    ON public.student_verifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
    ON public.student_verifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update verifications"
    ON public.student_verifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_student_verifications_modtime ON public.student_verifications;
CREATE TRIGGER update_student_verifications_modtime
    BEFORE UPDATE ON public.student_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to handle real-time simulation (Auto-verify .edu emails)
CREATE OR REPLACE FUNCTION public.auto_verify_student_email()
RETURNS TRIGGER AS $$
BEGIN
    -- If email verification and email ends with .edu (simulation of google-like verification)
    IF NEW.verification_type = 'email' OR NEW.verification_type = 'hybrid' THEN
        IF NEW.student_email LIKE '%.edu' OR NEW.student_email LIKE '%.ac.%' THEN
            NEW.status := 'verified';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_verify_student ON public.student_verifications;
CREATE TRIGGER trigger_auto_verify_student
    BEFORE INSERT ON public.student_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_verify_student_email();
