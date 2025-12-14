# Create Admin User: Hashantha

## User Details
- **Name**: hashantha
- **Email**: hashanthawic@gmail.com
- **Password**: hashantha@2025
- **Role**: admin
- **Phone Number**: 0769212943

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Create User in Authentication
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `nciylpeweuubguvmflym`
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Fill in the form:
   - **Email**: `hashanthawic@gmail.com`
   - **Password**: `hashantha@2025`
   - **Auto Confirm User**: ✅ **Check this box** (important!)
6. Click **"Create user"**
7. **Copy the User ID** (UUID) - you'll need it in the next step

### Step 2: Add User to Agents Table
1. In Supabase Dashboard, go to **Table Editor**
2. Select the **`agents`** table
3. Click **"Insert"** → **"Insert row"**
4. Fill in the fields:
   - **id**: Paste the User ID from Step 1
   - **name**: `hashantha`
   - **email**: `hashanthawic@gmail.com`
   - **role**: `admin`
   - **expertise**: Leave empty or `{}`
   - **whatsapp_numbers**: `["0769212943"]` (array with phone number)
   - **max_tickets**: `10`
   - **current_load**: `0`
   - **is_active**: `true` (toggle on)
5. Click **"Save"**

### ✅ Done!
You can now login at `http://localhost:3000/login` with:
- Email: `hashanthawic@gmail.com`
- Password: `hashantha@2025`

---

## Method 2: Using SQL Script

### Step 1: Create User in Authentication
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Create user: `hashanthawic@gmail.com` / `hashantha@2025`
3. Copy the User ID (UUID)

### Step 2: Run SQL Script
1. Open `scripts/create-admin-hashantha.sql`
2. Replace `YOUR_USER_ID_HERE` with the actual UUID from Step 1
3. Go to Supabase Dashboard → **SQL Editor**
4. Paste the modified SQL
5. Click **Run**

---

## Method 3: Using the Setup Page

1. Make sure your dev server is running: `npm run dev`
2. Visit: `http://localhost:3000/setup`
3. Click **"Setup User Account"**
4. Note: This method requires the service role key to be set

---

## Method 4: Using Register Page

1. Make sure your dev server is running: `npm run dev`
2. Visit: `http://localhost:3000/register`
3. Fill in the form:
   - **Full Name**: `hashantha`
   - **Email**: `hashanthawic@gmail.com`
   - **Password**: `hashantha@2025`
   - **Role**: `admin`
   - **Expertise**: (leave empty)
   - **WhatsApp Numbers**: `0769212943`
   - **Max Tickets**: `10`
4. Click **"Register"**
5. Note: You may need to confirm your email if auto-confirm is not enabled

---

## Troubleshooting

### "Email already exists" Error
- The user already exists in Supabase Auth
- You can:
  - Reset the password in Authentication → Users
  - Or just update the agents table manually

### "Table does not exist" Error
- Make sure you've run the SQL schema first
- Go to SQL Editor and run `supabase_schema.sql`

### Phone Number Format
- The phone number is stored in the `whatsapp_numbers` array
- Format: `["0769212943"]` (array with one string)
- You can add multiple numbers: `["0769212943", "+94769212943"]`

---

## Verify Setup

After creating the user, verify it works:

1. Go to Supabase Dashboard → **Table Editor** → **agents**
2. Find the row with email `hashanthawic@gmail.com`
3. Verify:
   - ✅ name: `hashantha`
   - ✅ role: `admin`
   - ✅ whatsapp_numbers: `["0769212943"]`
   - ✅ is_active: `true`

4. Try logging in at `http://localhost:3000/login`

---

## Quick SQL Verification

Run this in SQL Editor to verify the user:

```sql
SELECT 
  id,
  name,
  email,
  role,
  whatsapp_numbers,
  is_active
FROM agents 
WHERE email = 'hashanthawic@gmail.com';
```

You should see the user with all the correct details.

