-- ============================================
-- SIMPLE: Insert Agent to Database
-- ============================================
-- 
-- BEFORE RUNNING THIS:
-- 1. Create user in Authentication Dashboard first!
--    Authentication → Users → Add User
--    Email: hashanthawic@gmail.com
--    Password: hashantha@2025
--    Auto Confirm: ✅ Yes
--
-- 2. Get the User ID (UUID) from Authentication → Users
--
-- 3. Replace 'YOUR_USER_ID_HERE' below with that UUID
--
-- 4. Run this SQL
-- ============================================

-- Get the User ID first (run this to find it)
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'hashanthawic@gmail.com';

-- Copy the ID from above, then use it in the INSERT below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID

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
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with UUID from auth.users
  'hashantha',
  'hashanthawic@gmail.com',
  'admin',
  '{}',
  ARRAY['0769212943'],
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

-- Verify it worked
SELECT * FROM agents WHERE email = 'hashanthawic@gmail.com';

