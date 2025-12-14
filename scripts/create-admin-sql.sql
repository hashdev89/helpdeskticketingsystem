-- ============================================
-- SQL Script to Create Admin User
-- ============================================
-- Run this AFTER creating the user in Authentication → Users
-- 
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create user: hashanthawic@gmail.com / Hashdev@2025
-- 3. Copy the User ID (UUID)
-- 4. Replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- 5. Run this SQL in SQL Editor
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
  'Hashantha',
  'hashanthawic@gmail.com',
  'admin',
  '{}',
  '{}',
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
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the user was created
SELECT * FROM agents WHERE email = 'hashanthawic@gmail.com';

