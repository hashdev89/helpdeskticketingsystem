-- ============================================
-- Create Admin User: Hashantha
-- ============================================
-- 
-- Steps to use this script:
-- 1. First, create the user in Supabase Authentication:
--    - Go to Authentication → Users → Add User
--    - Email: hashanthawic@gmail.com
--    - Password: hashantha@2025
--    - Auto Confirm: ✅ Yes
--    - Copy the User ID (UUID)
--
-- 2. Replace 'YOUR_USER_ID_HERE' below with the actual UUID
--
-- 3. Run this SQL in Supabase SQL Editor
-- ============================================

-- Insert or update admin user in agents table
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
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with the User ID from Authentication → Users
  'hashantha',
  'hashanthawic@gmail.com',
  'admin',
  '{}',  -- Empty array for expertise
  ARRAY['0769212943'],  -- Phone number in whatsapp_numbers array
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

-- Verify the user was created
SELECT 
  id,
  name,
  email,
  role,
  whatsapp_numbers,
  is_active,
  created_at
FROM agents 
WHERE email = 'hashanthawic@gmail.com';

