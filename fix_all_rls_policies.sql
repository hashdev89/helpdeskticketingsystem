-- ============================================
-- FIX ALL RLS POLICIES - Complete Fix
-- ============================================
-- Run this to fix ALL RLS policies for the entire application
-- This allows public access since authentication is bypassed
-- ============================================

-- ============================================
-- 1. USER_SESSIONS (for chat)
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "User sessions are viewable by authenticated users" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are insertable by authenticated users" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are updatable by authenticated users" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are viewable by everyone" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are insertable by everyone" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are updatable by everyone" ON user_sessions;

CREATE POLICY "User sessions are viewable by everyone"
    ON user_sessions FOR SELECT
    USING (true);

CREATE POLICY "User sessions are insertable by everyone"
    ON user_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "User sessions are updatable by everyone"
    ON user_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 2. CHAT_MESSAGES (for chat)
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "Chat messages are viewable by authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are insertable by authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are updatable by authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are insertable by everyone" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are updatable by everyone" ON chat_messages;

CREATE POLICY "Chat messages are viewable by everyone"
    ON chat_messages FOR SELECT
    USING (true);

CREATE POLICY "Chat messages are insertable by everyone"
    ON chat_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Chat messages are updatable by everyone"
    ON chat_messages FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 3. AGENTS
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "Agents are viewable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are insertable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are updatable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are deletable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are viewable by everyone" ON agents;
DROP POLICY IF EXISTS "Agents are insertable by everyone" ON agents;
DROP POLICY IF EXISTS "Agents are updatable by everyone" ON agents;
DROP POLICY IF EXISTS "Agents are deletable by everyone" ON agents;

CREATE POLICY "Agents are viewable by everyone"
    ON agents FOR SELECT
    USING (true);

CREATE POLICY "Agents are insertable by everyone"
    ON agents FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Agents are updatable by everyone"
    ON agents FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Agents are deletable by everyone"
    ON agents FOR DELETE
    USING (true);

-- ============================================
-- 4. TICKETS
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "Tickets are viewable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are insertable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are insertable by everyone" ON tickets;
DROP POLICY IF EXISTS "Tickets are updatable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are deletable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are viewable by everyone" ON tickets;
DROP POLICY IF EXISTS "Tickets are updatable by everyone" ON tickets;
DROP POLICY IF EXISTS "Tickets are deletable by everyone" ON tickets;

CREATE POLICY "Tickets are viewable by everyone"
    ON tickets FOR SELECT
    USING (true);

CREATE POLICY "Tickets are insertable by everyone"
    ON tickets FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Tickets are updatable by everyone"
    ON tickets FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Tickets are deletable by everyone"
    ON tickets FOR DELETE
    USING (true);

-- ============================================
-- 5. WHATSAPP_NUMBERS
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "WhatsApp numbers are viewable by authenticated users" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are insertable by authenticated users" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are updatable by authenticated users" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are viewable by everyone" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are insertable by everyone" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are updatable by everyone" ON whatsapp_numbers;

CREATE POLICY "WhatsApp numbers are viewable by everyone"
    ON whatsapp_numbers FOR SELECT
    USING (true);

CREATE POLICY "WhatsApp numbers are insertable by everyone"
    ON whatsapp_numbers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "WhatsApp numbers are updatable by everyone"
    ON whatsapp_numbers FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 6. STATUS_HISTORY
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "Status history is viewable by authenticated users" ON status_history;
DROP POLICY IF EXISTS "Status history is insertable by authenticated users" ON status_history;
DROP POLICY IF EXISTS "Status history is viewable by everyone" ON status_history;
DROP POLICY IF EXISTS "Status history is insertable by everyone" ON status_history;

CREATE POLICY "Status history is viewable by everyone"
    ON status_history FOR SELECT
    USING (true);

CREATE POLICY "Status history is insertable by everyone"
    ON status_history FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 7. WHATSAPP_MESSAGES
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "WhatsApp messages are viewable by authenticated users" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are insertable by authenticated users" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are updatable by authenticated users" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are viewable by everyone" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are insertable by everyone" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are updatable by everyone" ON whatsapp_messages;

CREATE POLICY "WhatsApp messages are viewable by everyone"
    ON whatsapp_messages FOR SELECT
    USING (true);

CREATE POLICY "WhatsApp messages are insertable by everyone"
    ON whatsapp_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "WhatsApp messages are updatable by everyone"
    ON whatsapp_messages FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 8. PROMOTIONS
-- ============================================
-- Drop ALL existing policies (both old and new ones)
DROP POLICY IF EXISTS "Promotions are viewable by everyone" ON promotions;
DROP POLICY IF EXISTS "Promotions are insertable by authenticated users" ON promotions;
DROP POLICY IF EXISTS "Promotions are updatable by authenticated users" ON promotions;
DROP POLICY IF EXISTS "Promotions are insertable by everyone" ON promotions;
DROP POLICY IF EXISTS "Promotions are updatable by everyone" ON promotions;

CREATE POLICY "Promotions are viewable by everyone"
    ON promotions FOR SELECT
    USING (true);

CREATE POLICY "Promotions are insertable by everyone"
    ON promotions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Promotions are updatable by everyone"
    ON promotions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFY ALL POLICIES
-- ============================================
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual = 'true' OR with_check = 'true' THEN '✅ Public'
        ELSE '❌ Restricted'
    END as status
FROM pg_policies
WHERE tablename IN (
    'user_sessions', 
    'chat_messages', 
    'agents', 
    'tickets', 
    'whatsapp_numbers', 
    'status_history', 
    'whatsapp_messages', 
    'promotions'
)
ORDER BY tablename, cmd;

-- ============================================
-- DONE! All RLS policies are now set to public access
-- ============================================

