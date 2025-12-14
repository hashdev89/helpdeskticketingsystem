# Create Admin User Guide

## Method 1: Using Supabase Dashboard (Recommended - Easiest)

### Step 1: Create User in Authentication
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `nciylpeweuubguvmflym`
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Fill in the form:
   - **Email**: `hashanthawic@gmail.com`
   - **Password**: `Hashdev@2025`
   - **Auto Confirm User**: ✅ **Check this box** (important!)
6. Click **"Create user"**
7. **Copy the User ID** (UUID) - you'll need it in the next step

### Step 2: Add User to Agents Table
1. In Supabase Dashboard, go to **Table Editor**
2. Select the **`agents`** table
3. Click **"Insert"** → **"Insert row"**
4. Fill in the fields:
   - **id**: Paste the User ID from Step 1
   - **name**: `Hashantha`
   - **email**: `hashanthawic@gmail.com`
   - **role**: `admin`
   - **expertise**: Leave empty or `{}`
   - **whatsapp_numbers**: Leave empty or `{}`
   - **max_tickets**: `10`
   - **current_load**: `0`
   - **is_active**: `true` (toggle on)
5. Click **"Save"**

### ✅ Done!
You can now login at `http://localhost:3000/login` with:
- Email: `hashanthawic@gmail.com`
- Password: `Hashdev@2025`

---

## Method 2: Using Service Role Key (Advanced)

If you want to use the script, you need to add the service role key first:

### Step 1: Get Service Role Key
1. Go to Supabase Dashboard → **Settings** → **API**
2. Find **"service_role"** key (⚠️ Keep this secret!)
3. Copy the key

### Step 2: Add to .env.local
Open `.env.local` and add:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Run the Script
```bash
node scripts/create-admin.js
```

---

## Method 3: Using the Setup Page

1. Make sure your dev server is running: `npm run dev`
2. Visit: `http://localhost:3000/setup`
3. Click **"Setup User Account"**
4. Note: This method requires the service role key to be set

---

## Troubleshooting

### "User not allowed" Error
- You need the **service_role** key, not the **anon** key
- The service_role key has admin privileges
- Get it from: Supabase Dashboard → Settings → API → service_role

### "Table does not exist" Error
- Make sure you've run the SQL schema first
- Go to SQL Editor and run `supabase_schema.sql`

### "Email already exists" Error
- The user already exists in Supabase Auth
- You can:
  - Reset the password in Authentication → Users
  - Or just add the user to the agents table manually

---

## Quick SQL Alternative

If you prefer SQL, you can also run this in the SQL Editor (after creating the user in Authentication):

```sql
-- First, get the user ID from Authentication → Users
-- Then replace 'USER_ID_HERE' with the actual UUID

INSERT INTO agents (
  id,
  name,
  email,
  role,
  expertise,
  whatsapp_numbers,
  max_tickets,
  current_load,
  is_active
) VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID from auth.users
  'Hashantha',
  'hashanthawic@gmail.com',
  'admin',
  '{}',
  '{}',
  10,
  0,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = true;
```

