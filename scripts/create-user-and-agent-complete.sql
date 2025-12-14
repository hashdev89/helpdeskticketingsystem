-- ============================================
-- COMPLETE SETUP: Create User and Agent
-- ============================================
-- 
-- This script provides a complete solution, but note:
-- You CANNOT create users in auth.users via SQL for security reasons
-- You MUST use Supabase Dashboard or API
--
-- This script will:
-- 1. Help you find existing user ID
-- 2. Create the agent record
-- 3. Verify everything is set up correctly
-- ============================================

-- ============================================
-- STEP 1: Find or Create User in Authentication
-- ============================================
-- You MUST do this manually in Supabase Dashboard:
-- 
-- Go to: Authentication → Users → Add User
-- Email: hashanthawic@gmail.com
-- Password: hashantha@2025
-- Auto Confirm: ✅ Yes
--
-- Then copy the User ID and use it below
-- ============================================

-- Check if user exists in auth.users
DO $$
DECLARE
    user_id UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'hashanthawic@gmail.com'
    LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User does not exist in auth.users! Please create the user first:
        1. Go to Supabase Dashboard → Authentication → Users
        2. Click "Add User" → "Create new user"
        3. Email: hashanthawic@gmail.com
        4. Password: hashantha@2025
        5. Auto Confirm: ✅ Yes
        6. Copy the User ID and run this script again with the ID';
    ELSE
        RAISE NOTICE 'User found! ID: %', user_id;
        
        -- Insert or update agent
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
          user_id,
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
        
        RAISE NOTICE 'Agent created/updated successfully!';
    END IF;
END $$;

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT 
  '✅ Setup Complete!' as status,
  a.id,
  a.name,
  a.email,
  a.role,
  a.whatsapp_numbers,
  a.is_active,
  u.email_confirmed_at as email_confirmed,
  CASE 
    WHEN u.id IS NULL THEN '❌ User not found in auth.users'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
    ELSE '✅ User exists and email confirmed'
  END as auth_status
FROM agents a
LEFT JOIN auth.users u ON a.id = u.id
WHERE a.email = 'hashanthawic@gmail.com';

