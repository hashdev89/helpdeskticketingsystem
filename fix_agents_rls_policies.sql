-- ============================================
-- Fix RLS Policies for Agents Table
-- ============================================
-- Run this to allow adding agents without authentication
-- ============================================

-- Drop existing restrictive policies for agents
DROP POLICY IF EXISTS "Agents are viewable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are insertable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are updatable by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents are deletable by authenticated users" ON agents;

-- Create new policies that allow public access (since auth is bypassed)
-- Anyone can view agents
CREATE POLICY "Agents are viewable by everyone"
    ON agents FOR SELECT
    USING (true);

-- Anyone can insert agents (for adding new agents)
CREATE POLICY "Agents are insertable by everyone"
    ON agents FOR INSERT
    WITH CHECK (true);

-- Anyone can update agents
CREATE POLICY "Agents are updatable by everyone"
    ON agents FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Anyone can delete agents
CREATE POLICY "Agents are deletable by everyone"
    ON agents FOR DELETE
    USING (true);

-- ============================================
-- Also fix other tables that might need public access
-- ============================================

-- WhatsApp Numbers
DROP POLICY IF EXISTS "WhatsApp numbers are viewable by authenticated users" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are insertable by authenticated users" ON whatsapp_numbers;
DROP POLICY IF EXISTS "WhatsApp numbers are updatable by authenticated users" ON whatsapp_numbers;

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

-- Tickets (view and update - already allow insert from chat fix)
DROP POLICY IF EXISTS "Tickets are viewable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are updatable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are deletable by authenticated users" ON tickets;

CREATE POLICY "Tickets are viewable by everyone"
    ON tickets FOR SELECT
    USING (true);

CREATE POLICY "Tickets are updatable by everyone"
    ON tickets FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Tickets are deletable by everyone"
    ON tickets FOR DELETE
    USING (true);

-- Status History
DROP POLICY IF EXISTS "Status history is viewable by authenticated users" ON status_history;
DROP POLICY IF EXISTS "Status history is insertable by authenticated users" ON status_history;

CREATE POLICY "Status history is viewable by everyone"
    ON status_history FOR SELECT
    USING (true);

CREATE POLICY "Status history is insertable by everyone"
    ON status_history FOR INSERT
    WITH CHECK (true);

-- WhatsApp Messages
DROP POLICY IF EXISTS "WhatsApp messages are viewable by authenticated users" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are insertable by authenticated users" ON whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages are updatable by authenticated users" ON whatsapp_messages;

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

-- Promotions
DROP POLICY IF EXISTS "Promotions are viewable by everyone" ON promotions;
DROP POLICY IF EXISTS "Promotions are insertable by authenticated users" ON promotions;
DROP POLICY IF EXISTS "Promotions are updatable by authenticated users" ON promotions;

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
-- Verify policies
-- ============================================
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual = 'true' OR with_check = 'true' THEN '✅ Public access'
        ELSE '❌ Restricted'
    END as status
FROM pg_policies
WHERE tablename IN ('agents', 'whatsapp_numbers', 'tickets', 'status_history', 'whatsapp_messages', 'promotions')
ORDER BY tablename, cmd;

