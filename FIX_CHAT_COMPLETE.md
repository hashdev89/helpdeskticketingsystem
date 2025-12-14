# Complete Chat Fix Guide

## Step 1: Verify Environment Variables ✅

Your `.env.local` should have:
```
NEXT_PUBLIC_SUPABASE_URL=https://nciylpeweuubguvmflym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaXlscGV3ZXV1Ymd1dm1mbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTYxNzgsImV4cCI6MjA4MTE3MjE3OH0.XGpqYTVBPo3EBMusxfm_xIfKZpUP_Fsr9kBmcdER6ik
```

**After updating .env.local, restart your dev server:**
```bash
npm run dev
```

## Step 2: Run Database Setup Scripts

Run these SQL scripts in Supabase Dashboard → SQL Editor (in order):

### 1. Create Tables (if not done)
- Run: `supabase_schema.sql`

### 2. Fix Foreign Keys (if needed)
- Run: `fix_foreign_keys.sql`

### 3. Add Missing Columns
- Run: `fix_user_sessions_columns.sql`

### 4. Fix RLS Policies (IMPORTANT for chat)
- Run: `fix_chat_rls_policies.sql`

## Step 3: Verify Setup

Run this to check everything:
- Run: `verify_chat_setup.sql`

This will show you:
- ✅ Which tables exist
- ✅ Which columns are present
- ✅ Which RLS policies are configured
- ❌ What needs to be fixed

## Step 4: Test the Chat

1. **Restart dev server** (important after .env changes)
   ```bash
   npm run dev
   ```

2. **Visit**: `http://localhost:3000/chat`

3. **Try to start a chat**:
   - Enter name (optional)
   - Enter phone (optional)
   - Type a message
   - Click "Start Chat"

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Solution**: 
- Restart dev server
- Check Supabase project is active (not paused)
- Verify .env.local has correct values

### Issue: "RLS policy violation"
**Solution**: 
- Run `fix_chat_rls_policies.sql` in Supabase SQL Editor

### Issue: "Column not found"
**Solution**: 
- Run `fix_user_sessions_columns.sql` in Supabase SQL Editor

### Issue: "Foreign key constraint"
**Solution**: 
- Run `fix_foreign_keys.sql` in Supabase SQL Editor

## Quick Checklist

- [ ] `.env.local` has correct Supabase URL and Key
- [ ] Dev server restarted after .env changes
- [ ] All tables created (`supabase_schema.sql`)
- [ ] Foreign keys fixed (`fix_foreign_keys.sql`)
- [ ] Missing columns added (`fix_user_sessions_columns.sql`)
- [ ] RLS policies fixed (`fix_chat_rls_policies.sql`)
- [ ] Supabase project is active (not paused)

## After All Steps

The chat should:
- ✅ Create sessions in `user_sessions` table
- ✅ Save messages in `chat_messages` table
- ✅ Auto-create tickets in `tickets` table
- ✅ Work without authentication

If you still have issues, check the browser console (F12) for specific error messages.

