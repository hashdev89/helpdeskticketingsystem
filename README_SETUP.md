# Supabase Setup Instructions

## ✅ Configuration Updated

Your Supabase configuration has been updated with:
- **Project URL**: `https://nciylpeweuubguvmflym.supabase.co`
- **API Key**: Updated in `.env.local`

## 📋 Next Steps

### 1. Create Database Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `nciylpeweuubguvmflym`
3. Navigate to **SQL Editor**
4. Open the file `supabase_schema.sql` in this project
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** to execute

This will create all required tables:
- ✅ `agents` - Support agents/users
- ✅ `tickets` - Support tickets
- ✅ `whatsapp_numbers` - WhatsApp phone numbers
- ✅ `whatsapp_messages` - WhatsApp message history
- ✅ `status_history` - Ticket status change history
- ✅ `user_sessions` - Web chat sessions
- ✅ `chat_messages` - Web chat messages
- ✅ `promotions` - Promotional content

### 2. Set Up Your First User

After creating the tables, set up your admin user:

**Option A: Use the Setup Page**
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/setup`
3. Click "Setup User Account"
4. This will create user: `hashanthawic@gmail.com` with password `Hashdev@2025`

**Option B: Use Supabase Dashboard**
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" > "Create new user"
3. Enter:
   - Email: `hashanthawic@gmail.com`
   - Password: `Hashdev@2025`
   - Auto-confirm email: ✅ Yes
4. Copy the User ID (UUID)
5. Go to Table Editor > `agents` table
6. Insert a new row:
   - `id`: (paste the User ID)
   - `name`: Hashantha
   - `email`: hashanthawic@gmail.com
   - `role`: admin
   - `is_active`: true
   - `max_tickets`: 10
   - `current_load`: 0

**Option C: Use the API Route**
```bash
curl -X POST http://localhost:3000/api/setup-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hashanthawic@gmail.com",
    "password": "Hashdev@2025",
    "name": "Hashantha",
    "role": "admin"
  }'
```

### 3. Verify Setup

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/login`
3. Login with:
   - Email: `hashanthawic@gmail.com`
   - Password: `Hashdev@2025`

## 🔐 Security Note

The `.env.local` file contains your API keys. Make sure:
- ✅ It's in `.gitignore` (should not be committed to git)
- ✅ Never share these keys publicly
- ✅ For production, use environment variables in your hosting platform

## 📝 Additional Configuration

If you need to use WhatsApp API features, add these to `.env.local`:
```
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_token
```

For admin operations (like user setup), you can add:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
Get this from: Supabase Dashboard > Settings > API > service_role key

## ✅ You're All Set!

Once the tables are created and your user is set up, you can start using the application.

