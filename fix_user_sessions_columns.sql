-- ============================================
-- Fix user_sessions table - Add missing columns
-- ============================================
-- Run this if you get: "Could not find the 'channel' column"
-- ============================================

-- Add channel column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'channel'
    ) THEN
        ALTER TABLE user_sessions 
        ADD COLUMN channel VARCHAR(50) DEFAULT 'web-chat' 
        CHECK (channel IN ('web-chat', 'whatsapp', 'email', 'phone'));
        
        RAISE NOTICE 'Added channel column to user_sessions';
    ELSE
        RAISE NOTICE 'channel column already exists';
    END IF;
END $$;

-- Add is_anonymous column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE user_sessions 
        ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added is_anonymous column to user_sessions';
    ELSE
        RAISE NOTICE 'is_anonymous column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_sessions'
    AND column_name IN ('channel', 'is_anonymous')
ORDER BY column_name;

-- Update existing rows to have default values if needed
UPDATE user_sessions 
SET channel = 'web-chat' 
WHERE channel IS NULL;

UPDATE user_sessions 
SET is_anonymous = false 
WHERE is_anonymous IS NULL;

