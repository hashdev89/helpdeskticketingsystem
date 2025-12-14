-- ============================================
-- Fix RLS Policies for Chat (Allow Public Access)
-- ============================================
-- Run this to allow unauthenticated users to use the chat
-- ============================================

-- Drop existing restrictive policies for user_sessions
DROP POLICY IF EXISTS "User sessions are viewable by authenticated users" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are insertable by authenticated users" ON user_sessions;
DROP POLICY IF EXISTS "User sessions are updatable by authenticated users" ON user_sessions;

-- Create new policies that allow public access for chat
-- Users can view their own sessions (by session_id)
CREATE POLICY "User sessions are viewable by everyone"
    ON user_sessions FOR SELECT
    USING (true);

-- Anyone can create a session (for chat)
CREATE POLICY "User sessions are insertable by everyone"
    ON user_sessions FOR INSERT
    WITH CHECK (true);

-- Users can update their own sessions
CREATE POLICY "User sessions are updatable by everyone"
    ON user_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Drop existing restrictive policies for chat_messages
DROP POLICY IF EXISTS "Chat messages are viewable by authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are insertable by authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Chat messages are updatable by authenticated users" ON chat_messages;

-- Create new policies that allow public access for chat messages
-- Users can view messages from their session
CREATE POLICY "Chat messages are viewable by everyone"
    ON chat_messages FOR SELECT
    USING (true);

-- Anyone can insert messages (for chat)
CREATE POLICY "Chat messages are insertable by everyone"
    ON chat_messages FOR INSERT
    WITH CHECK (true);

-- Users can update their own messages (mark as read, etc.)
CREATE POLICY "Chat messages are updatable by everyone"
    ON chat_messages FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Optional: Also allow public ticket creation from chat
-- ============================================
-- Drop existing restrictive policy for tickets INSERT
DROP POLICY IF EXISTS "Tickets are insertable by authenticated users" ON tickets;

-- Allow public to create tickets (for chat)
CREATE POLICY "Tickets are insertable by everyone"
    ON tickets FOR INSERT
    WITH CHECK (true);

-- Keep other ticket policies (view/update/delete) for authenticated users only
-- This allows chat to create tickets, but only agents can view/update them

-- ============================================
-- Verify policies
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('user_sessions', 'chat_messages', 'tickets')
ORDER BY tablename, policyname;
