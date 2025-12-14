-- ============================================
-- Fix Foreign Key Constraints
-- ============================================
-- Run this if you get "Could not find a relationship" errors
-- This script adds the proper foreign key constraints with explicit names
-- ============================================

-- Drop existing constraints if they exist (with auto-generated names)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop existing foreign key constraints
    FOR r IN (
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
        AND (
            table_name = 'tickets' AND constraint_name LIKE '%assigned_agent%'
            OR table_name = 'tickets' AND constraint_name LIKE '%whatsapp_number%'
            OR table_name = 'whatsapp_numbers' AND constraint_name LIKE '%assigned_agent%'
            OR table_name = 'status_history' AND constraint_name LIKE '%ticket%'
            OR table_name = 'status_history' AND constraint_name LIKE '%agent%'
            OR table_name = 'whatsapp_messages' AND constraint_name LIKE '%ticket%'
            OR table_name = 'user_sessions' AND constraint_name LIKE '%agent%'
            OR table_name = 'chat_messages' AND constraint_name LIKE '%session%'
            OR table_name = 'chat_messages' AND constraint_name LIKE '%ticket%'
            OR table_name = 'chat_messages' AND constraint_name LIKE '%sender%'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add properly named foreign key constraints

-- WhatsApp Numbers -> Agents
ALTER TABLE whatsapp_numbers
    DROP CONSTRAINT IF EXISTS whatsapp_numbers_assigned_agent_fkey,
    ADD CONSTRAINT whatsapp_numbers_assigned_agent_fkey 
        FOREIGN KEY (assigned_agent) REFERENCES agents(id) ON DELETE SET NULL;

-- Tickets -> Agents
ALTER TABLE tickets
    DROP CONSTRAINT IF EXISTS tickets_assigned_agent_fkey,
    ADD CONSTRAINT tickets_assigned_agent_fkey 
        FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Tickets -> WhatsApp Numbers
ALTER TABLE tickets
    DROP CONSTRAINT IF EXISTS tickets_whatsapp_number_fkey,
    ADD CONSTRAINT tickets_whatsapp_number_fkey 
        FOREIGN KEY (whatsapp_number) REFERENCES whatsapp_numbers(phone_number) ON DELETE SET NULL;

-- Status History -> Tickets
ALTER TABLE status_history
    DROP CONSTRAINT IF EXISTS status_history_ticket_id_fkey,
    ADD CONSTRAINT status_history_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

-- Status History -> Agents
ALTER TABLE status_history
    DROP CONSTRAINT IF EXISTS status_history_updated_by_agent_fkey,
    ADD CONSTRAINT status_history_updated_by_agent_fkey 
        FOREIGN KEY (updated_by_agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- WhatsApp Messages -> Tickets
ALTER TABLE whatsapp_messages
    DROP CONSTRAINT IF EXISTS whatsapp_messages_ticket_id_fkey,
    ADD CONSTRAINT whatsapp_messages_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

-- User Sessions -> Agents
ALTER TABLE user_sessions
    DROP CONSTRAINT IF EXISTS user_sessions_assigned_agent_fkey,
    ADD CONSTRAINT user_sessions_assigned_agent_fkey 
        FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Chat Messages -> User Sessions
ALTER TABLE chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey,
    ADD CONSTRAINT chat_messages_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE;

-- Chat Messages -> Tickets
ALTER TABLE chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_ticket_id_fkey,
    ADD CONSTRAINT chat_messages_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;

-- Chat Messages -> Agents
ALTER TABLE chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
    ADD CONSTRAINT chat_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Verify constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.constraint_name LIKE '%_fkey'
ORDER BY tc.table_name, tc.constraint_name;

