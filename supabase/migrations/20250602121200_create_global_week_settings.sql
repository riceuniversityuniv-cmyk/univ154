-- Create global_week_settings table to manage week availability for all users
CREATE TABLE IF NOT EXISTS global_week_settings (
    id SERIAL PRIMARY KEY,
    week_id TEXT NOT NULL UNIQUE,
    is_globally_available BOOLEAN DEFAULT FALSE,
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_global_week_settings_week_id ON global_week_settings(week_id);

-- Insert default data - only week 1 is available by default
INSERT INTO global_week_settings (week_id, is_globally_available, release_date) VALUES
    ('week-1', true, NOW()),
    ('week-2', false, NULL),
    ('week-3', false, NULL),
    ('week-4', false, NULL),
    ('week-5', false, NULL),
    ('week-6', false, NULL),
    ('week-7', false, NULL),
    ('week-8', false, NULL),
    ('week-9', false, NULL),
    ('week-10', false, NULL)
ON CONFLICT (week_id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE global_week_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can view global week settings
CREATE POLICY "Everyone can view global week settings" ON global_week_settings
    FOR SELECT USING (true);

-- Only admins can update global week settings
CREATE POLICY "Admins can manage global week settings" ON global_week_settings
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'riceuniversityuniv@gmail.com'
        )
    );