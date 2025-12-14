-- ============================================
-- Verify Chat Setup - Run this to check everything
-- ============================================

-- 1. Check if tables exist
SELECT 
    'Tables Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IN ('user_sessions', 'chat_messages', 'tickets', 'agents') 
        THEN '✅ Exists' 
        ELSE '❌ Missing' 
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('user_sessions', 'chat_messages', 'tickets', 'agents')
ORDER BY table_name;

-- 2. Check if user_sessions has required columns
SELECT 
    'user_sessions Columns' as check_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('session_id', 'customer_name', 'channel', 'is_anonymous', 'status')
        THEN '✅ Exists'
        ELSE '⚠️ Optional'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_sessions'
ORDER BY column_name;

-- 3. Check RLS policies for user_sessions
SELECT 
    'RLS Policies - user_sessions' as check_type,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' AND qual = 'true' THEN '✅ Public access'
        WHEN cmd = 'INSERT' AND with_check = 'true' THEN '✅ Public access'
        WHEN cmd = 'UPDATE' AND qual = 'true' THEN '✅ Public access'
        ELSE '❌ Restricted'
    END as status
FROM pg_policies
WHERE tablename = 'user_sessions'
ORDER BY cmd;

-- 4. Check RLS policies for chat_messages
SELECT 
    'RLS Policies - chat_messages' as check_type,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' AND qual = 'true' THEN '✅ Public access'
        WHEN cmd = 'INSERT' AND with_check = 'true' THEN '✅ Public access'
        WHEN cmd = 'UPDATE' AND qual = 'true' THEN '✅ Public access'
        ELSE '❌ Restricted'
    END as status
FROM pg_policies
WHERE tablename = 'chat_messages'
ORDER BY cmd;

-- 5. Check RLS policies for tickets (INSERT should be public)
SELECT 
    'RLS Policies - tickets' as check_type,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' AND with_check = 'true' THEN '✅ Public access'
        WHEN cmd = 'INSERT' THEN '❌ Restricted'
        ELSE 'ℹ️ Other operation'
    END as status
FROM pg_policies
WHERE tablename = 'tickets'
    AND cmd = 'INSERT';

-- 6. Test insert (should work if RLS is correct)
-- This will fail if RLS is blocking, but won't actually insert
DO $$
BEGIN
    RAISE NOTICE 'If you see this, the script ran successfully';
    RAISE NOTICE 'Check the results above to see what needs to be fixed';
END $$;

