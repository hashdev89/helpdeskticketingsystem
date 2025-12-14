# Quick Add Agent to Database

## Problem: "Invalid login credentials"

This happens when:
- User exists in `agents` table but NOT in `auth.users` (Authentication)
- OR user exists in `auth.users` but NOT in `agents` table
- OR password is incorrect

## Solution: Complete Setup

### Step 1: Create User in Authentication (REQUIRED)

**You MUST do this first!** You cannot add users to `auth.users` via SQL for security reasons.

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `nciylpeweuubguvmflym`
3. Go to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Fill in:
   - **Email**: `hashanthawic@gmail.com`
   - **Password**: `hashantha@2025`
   - **Auto Confirm User**: ✅ **Check this** (very important!)
6. Click **"Create user"**
7. **Copy the User ID** (UUID) - looks like: `123e4567-e89b-12d3-a456-426614174000`

### Step 2: Add Agent to Database

#### Option A: Using SQL Script (Recommended)

1. Open `scripts/add-agent-direct.sql`
2. Find the line with `'YOUR_USER_ID_HERE'`
3. Replace it with the UUID you copied in Step 1
4. Go to Supabase Dashboard → **SQL Editor**
5. Paste the modified SQL
6. Click **Run**

#### Option B: Using Table Editor

1. Go to Supabase Dashboard → **Table Editor** → **agents**
2. Click **"Insert"** → **"Insert row"**
3. Fill in:
   - **id**: (paste the UUID from Step 1)
   - **name**: `hashantha`
   - **email**: `hashanthawic@gmail.com`
   - **role**: `admin`
   - **whatsapp_numbers**: `["0769212943"]` (must be array format!)
   - **max_tickets**: `10`
   - **current_load**: `0`
   - **is_active**: `true`
   - **expertise**: `{}` (empty array)
4. Click **"Save"**

#### Option C: Using Auto-Detection Script

1. Make sure user exists in Authentication (Step 1)
2. Go to SQL Editor
3. Run `scripts/create-user-and-agent-complete.sql`
4. This script will automatically find the user ID and create the agent

### Step 3: Verify Setup

Run this query in SQL Editor to verify:

```sql
SELECT 
  a.id,
  a.name,
  a.email,
  a.role,
  a.whatsapp_numbers,
  a.is_active,
  u.email as auth_email,
  u.email_confirmed_at
FROM agents a
LEFT JOIN auth.users u ON a.id = u.id
WHERE a.email = 'hashanthawic@gmail.com';
```

You should see:
- ✅ User exists in both tables
- ✅ Email is confirmed (`email_confirmed_at` is not null)
- ✅ `is_active` is true

### Step 4: Test Login

1. Go to: `http://localhost:3000/login`
2. Enter:
   - Email: `hashanthawic@gmail.com`
   - Password: `hashantha@2025`
3. Click **Login**

---

## Troubleshooting

### Error: "insert or update violates foreign key constraint"
- **Cause**: User doesn't exist in `auth.users`
- **Fix**: Complete Step 1 first (create user in Authentication)

### Error: "Invalid login credentials"
- **Cause 1**: User not in `auth.users` → Create user in Authentication
- **Cause 2**: User not in `agents` table → Add to agents table
- **Cause 3**: Wrong password → Reset password in Authentication
- **Cause 4**: Email not confirmed → Check "Auto Confirm" when creating user

### Error: "User not found or not an agent"
- **Cause**: User exists in `auth.users` but not in `agents` table
- **Fix**: Complete Step 2 (add to agents table)

### Phone Number Format
- Must be array: `["0769212943"]`
- Not string: `"0769212943"` ❌
- Multiple numbers: `["0769212943", "+94769212943"]`

---

## Quick SQL to Check Everything

```sql
-- Check if user exists in auth
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'hashanthawic@gmail.com';

-- Check if agent exists
SELECT id, name, email, role, is_active 
FROM agents 
WHERE email = 'hashanthawic@gmail.com';

-- Check both together
SELECT 
  a.id,
  a.name,
  a.email,
  a.role,
  a.is_active,
  CASE 
    WHEN u.id IS NULL THEN '❌ Not in auth.users'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
    ELSE '✅ OK'
  END as status
FROM agents a
LEFT JOIN auth.users u ON a.id = u.id
WHERE a.email = 'hashanthawic@gmail.com';
```

---

## Summary

**You need BOTH:**
1. ✅ User in `auth.users` (created via Authentication Dashboard)
2. ✅ Agent in `agents` table (created via SQL or Table Editor)

**Then you can login!** 🎉

