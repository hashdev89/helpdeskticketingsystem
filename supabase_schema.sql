-- ============================================
-- WhatsApp Ticket System - Complete Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor to create all required tables
-- Project URL: https://nciylpeweuubguvmflym.supabase.co

-- ============================================
-- 1. AGENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'agent' CHECK (role IN ('agent', 'supervisor', 'admin')),
    expertise TEXT[] DEFAULT '{}',
    whatsapp_numbers TEXT[] DEFAULT '{}',
    max_tickets INTEGER DEFAULT 10,
    current_load INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. WHATSAPP_NUMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    assigned_agent UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT whatsapp_numbers_assigned_agent_fkey 
        FOREIGN KEY (assigned_agent) REFERENCES agents(id) ON DELETE SET NULL
);

-- ============================================
-- 3. TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed', 'reopened')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'support' CHECK (category IN ('support', 'billing', 'technical', 'sales')),
    assigned_agent_id UUID,
    channel VARCHAR(50) DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'web-chat', 'email', 'phone')),
    whatsapp_number VARCHAR(20),
    session_id VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT tickets_assigned_agent_fkey 
        FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    CONSTRAINT tickets_whatsapp_number_fkey 
        FOREIGN KEY (whatsapp_number) REFERENCES whatsapp_numbers(phone_number) ON DELETE SET NULL
);

-- ============================================
-- 4. STATUS_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    updated_by_agent_id UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT status_history_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT status_history_updated_by_agent_fkey 
        FOREIGN KEY (updated_by_agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- ============================================
-- 5. WHATSAPP_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id VARCHAR(255) PRIMARY KEY,
    whatsapp_message_id VARCHAR(255),
    ticket_id VARCHAR(50),
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    body TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location')),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'received')),
    is_status_update BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT whatsapp_messages_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- ============================================
-- 6. USER_SESSIONS TABLE (for web chat)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    channel VARCHAR(50) DEFAULT 'web-chat' CHECK (channel IN ('web-chat', 'whatsapp', 'email', 'phone')),
    is_anonymous BOOLEAN DEFAULT false,
    assigned_agent_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    CONSTRAINT user_sessions_assigned_agent_fkey 
        FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- ============================================
-- 7. CHAT_MESSAGES TABLE (for web chat)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    ticket_id VARCHAR(50),
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
    sender_name VARCHAR(255),
    sender_id UUID,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chat_messages_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT chat_messages_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
    CONSTRAINT chat_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- ============================================
-- 8. PROMOTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for better performance
-- ============================================

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_agent_id ON tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone ON tickets(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel);
CREATE INDEX IF NOT EXISTS idx_tickets_session_id ON tickets(session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Status History indexes
CREATE INDEX IF NOT EXISTS idx_status_history_ticket_id ON status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON status_history(created_at);

-- WhatsApp Messages indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_ticket_id ON whatsapp_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- User Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_assigned_agent_id ON user_sessions(assigned_agent_id);

-- Chat Messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_numbers_updated_at
    BEFORE UPDATE ON whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Agents policies (Allow public access since auth is bypassed)
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

-- Tickets policies (Allow public access since auth is bypassed)
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

-- WhatsApp Numbers policies (Allow public access since auth is bypassed)
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

-- Status History policies (Allow public access since auth is bypassed)
CREATE POLICY "Status history is viewable by everyone"
    ON status_history FOR SELECT
    USING (true);

CREATE POLICY "Status history is insertable by everyone"
    ON status_history FOR INSERT
    WITH CHECK (true);

-- WhatsApp Messages policies (Allow public access since auth is bypassed)
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

-- User Sessions policies (Allow public access for chat)
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

-- Chat Messages policies (Allow public access for chat)
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

-- Promotions policies
CREATE POLICY "Promotions are viewable by everyone"
    ON promotions FOR SELECT
    USING (true);

CREATE POLICY "Promotions are insertable by authenticated users"
    ON promotions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Promotions are updatable by authenticated users"
    ON promotions FOR UPDATE
    USING (auth.role() = 'authenticated');

-- ============================================
-- COMPLETED
-- ============================================
-- All tables, indexes, triggers, and RLS policies have been created.
-- You can now use the application with your new Supabase project.

