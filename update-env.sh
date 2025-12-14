#!/bin/bash

# Script to update Supabase configuration in .env.local

echo "Updating Supabase configuration..."

# Backup existing .env.local if it exists
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up existing .env.local to .env.local.backup"
fi

# Update or create .env.local with new Supabase credentials
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nciylpeweuubguvmflym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaXlscGV3ZXV1Ymd1dm1mbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTYxNzgsImV4cCI6MjA4MTE3MjE3OH0.XGpqYTVBPo3EBMusxfm_xIfKZpUP_Fsr9kBmcdER6ik

# Optional: Service Role Key (for admin operations like user setup)
# Get this from Supabase Dashboard > Settings > API > service_role key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# WhatsApp API Configuration (if needed)
# WHATSAPP_ACCESS_TOKEN=your_access_token
# WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
# WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_token
# NEXT_PUBLIC_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
EOF

echo "✅ Updated .env.local with new Supabase credentials"
echo ""
echo "New configuration:"
echo "  URL: https://nciylpeweuubguvmflym.supabase.co"
echo ""
echo "Next steps:"
echo "  1. Run the SQL schema in Supabase Dashboard (see supabase_schema.sql)"
echo "  2. Set up your user account (see README_SETUP.md)"

