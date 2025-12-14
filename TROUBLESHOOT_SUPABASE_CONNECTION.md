# Troubleshooting: "Failed to fetch (api.supabase.com)" Error

## Common Causes

1. **Environment variables not loaded** - Next.js needs restart after .env changes
2. **Network/CORS issue** - Browser blocking the request
3. **Supabase project paused** - Free tier projects pause after inactivity
4. **Wrong URL format** - Should be project-specific URL, not api.supabase.com

## Quick Fixes

### 1. Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 2. Verify Environment Variables
Check that `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://nciylpeweuubguvmflym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Check Supabase Project Status
1. Go to https://supabase.com/dashboard
2. Check if your project is active (not paused)
3. If paused, click "Restore" to wake it up

### 4. Verify Supabase URL
The URL should be:
- ✅ Correct: `https://nciylpeweuubguvmflym.supabase.co`
- ❌ Wrong: `https://api.supabase.com`

### 5. Check Browser Console
Open browser DevTools (F12) → Console tab
Look for:
- CORS errors
- Network errors
- Specific error messages

### 6. Test Connection Directly
Run this in browser console:
```javascript
fetch('https://nciylpeweuubguvmflym.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => console.log('Connected!', r))
.catch(e => console.error('Error:', e))
```

## Advanced Troubleshooting

### Check if Environment Variables are Loaded
Add this temporarily to your component:
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Check Network Tab
1. Open DevTools → Network tab
2. Try the action that fails
3. Look for the failed request
4. Check:
   - Request URL (should be your project URL)
   - Status code
   - Error message

## Common Solutions

### Solution 1: Project Paused (Most Common)
If your Supabase project is on free tier and was inactive:
1. Go to Supabase Dashboard
2. Find your project
3. Click "Restore" or "Resume"
4. Wait 1-2 minutes
5. Try again

### Solution 2: Environment Variables Not Loading
1. Make sure `.env.local` is in the project root
2. Restart dev server after changing .env.local
3. Variables must start with `NEXT_PUBLIC_` to be available in browser

### Solution 3: CORS Issue
If you see CORS errors:
1. Check Supabase Dashboard → Settings → API
2. Verify CORS settings allow your domain
3. For localhost, should allow: `http://localhost:3000`

### Solution 4: Network/Firewall
- Check if firewall is blocking
- Try different network
- Check if VPN is interfering

## Verify Connection

Run this SQL in Supabase SQL Editor to test:
```sql
SELECT 'Connection OK' as status;
```

If this works, Supabase is fine - the issue is with the client connection.

## Still Not Working?

1. Check Supabase status: https://status.supabase.com
2. Check your project logs in Supabase Dashboard
3. Verify your API keys are correct
4. Try creating a new Supabase client instance

