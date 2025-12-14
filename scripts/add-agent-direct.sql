-- ============================================
-- Add Agent Directly to Database
-- ============================================
-- 
-- IMPORTANT: You MUST create the user in Authentication first!
-- 
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
--    - Email: hashanthawic@gmail.com
--    - Password: hashantha@2025
--    - Auto Confirm: ✅ Yes
-- 3. Copy the User ID (UUID) from the created user
-- 4. Replace 'YOUR_USER_ID_HERE' below with that UUID
-- 5. Run this SQL script
-- ============================================

-- First, let's check if user exists in auth.users
-- (This is just for verification, you can't insert directly into auth.users)
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'hashanthawic@gmail.com';

-- If the above query returns a user, copy the ID and use it below
-- If it returns nothing, you need to create the user in Authentication first!

-- ============================================
-- INSERT AGENT INTO AGENTS TABLE
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from auth.users

INSERT INTO agents (
  id,
  name,
  email,
  role,
  expertise,
  whatsapp_numbers,
  max_tickets,
  current_load,
  is_active,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE with UUID from auth.users
  'hashantha',
  'hashanthawic@gmail.com',
  'admin',
  '{}',  -- Empty array
  ARRAY['0769212943'],  -- Phone number as array
  10,
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  whatsapp_numbers = EXCLUDED.whatsapp_numbers,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- VERIFY THE AGENT WAS CREATED
-- ============================================
SELECT 
  a.id,
  a.name,
  a.email,
  a.role,
  a.whatsapp_numbers,
  a.is_active,
  a.created_at,
  u.email as auth_email,
  u.email_confirmed_at
FROM agents a
LEFT JOIN auth.users u ON a.id = u.id
WHERE a.email = 'hashanthawic@gmail.com';

-- ============================================
-- IF USER DOESN'T EXIST IN AUTH, YOU'LL GET AN ERROR
-- ============================================
-- Error: insert or update on table "agents" violates foreign key constraint
-- 
-- Solution: Create the user in Authentication Dashboard first!

