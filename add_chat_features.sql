-- ============================================
-- Chat Features: Chat Notes Table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(255),
    note_text TEXT NOT NULL,
    created_by UUID,
    created_by_name VARCHAR(255),
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chat_notes_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT chat_notes_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES agents(id) ON DELETE SET NULL
);

-- Indexes for chat_notes
CREATE INDEX IF NOT EXISTS idx_chat_notes_ticket_id ON chat_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_notes_session_id ON chat_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_notes_created_at ON chat_notes(created_at DESC);

-- RLS Policies for chat_notes
ALTER TABLE chat_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat notes are viewable by everyone"
    ON chat_notes FOR SELECT
    USING (true);

CREATE POLICY "Chat notes are insertable by everyone"
    ON chat_notes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Chat notes are updatable by everyone"
    ON chat_notes FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Chat notes are deletable by everyone"
    ON chat_notes FOR DELETE
    USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_chat_notes_updated_at
    BEFORE UPDATE ON chat_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

