-- Create auto_reply_rules table for automated agent responses
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  response TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  category TEXT DEFAULT 'custom' CHECK (category IN ('greeting', 'support', 'sales', 'billing', 'custom')),
  media_url TEXT,
  whatsapp_number_id UUID REFERENCES whatsapp_numbers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster keyword searches
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_keywords ON auto_reply_rules USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_enabled ON auto_reply_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_category ON auto_reply_rules(category);
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_priority ON auto_reply_rules(priority DESC);

-- Enable RLS
ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
CREATE POLICY "Allow all operations for authenticated users" ON auto_reply_rules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE auto_reply_rules IS 'Stores automated reply rules for WhatsApp messages';

