-- Drop existing table (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS admissions CASCADE;

-- Create admissions table for online enrollment applications
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_id_card TEXT,
    birth_date DATE,
    gender TEXT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    address TEXT,
    previous_school TEXT,
    grade_applying TEXT NOT NULL,
    program_applying TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

-- Allow public full access to admissions (simplified for admin panel to work)
-- In production, you should use proper authentication
CREATE POLICY "Allow public full access for admissions"
ON admissions FOR ALL
USING (true)
WITH CHECK (true);
