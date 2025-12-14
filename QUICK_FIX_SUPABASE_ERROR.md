# Quick Fix: "Failed to fetch (api.supabase.com)" Error

## Most Common Solution (90% of cases)

### 1. Restart Your Dev Server
```bash
# Stop the server (Ctrl+C in terminal)
npm run dev
```

**Why?** Next.js caches environment variables. After changing `.env.local`, you MUST restart.

### 2. Check Supabase Project Status

1. Go to: https://supabase.com/dashboard
2. Find your project: `nciylpeweuubguvmflym`
3. Check if it shows "Paused" or "Inactive"
4. If paused, click **"Restore"** or **"Resume"**
5. Wait 1-2 minutes for it to wake up
6. Try your app again

**Why?** Free tier Supabase projects pause after 1 week of inactivity.

### 3. Verify Environment Variables

Check `.env.local` file exists and has:
```
NEXT_PUBLIC_SUPABASE_URL=https://nciylpeweuubguvmflym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Must be in project root (same folder as `package.json`)
- Must start with `NEXT_PUBLIC_` to work in browser
- No spaces around `=`

### 4. Clear Next.js Cache

```bash
rm -rf .next
npm run dev
```

## Still Not Working?

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Go to Network tab → find failed request → check the URL

### Test Connection
Open browser console and run:
```javascript
fetch('https://nciylpeweuubguvmflym.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  }
})
.then(r => console.log('✅ Connected!', r.status))
.catch(e => console.error('❌ Error:', e))
```

### Check Network Tab
1. DevTools → Network tab
2. Try the action that fails
3. Find the failed request
4. Check:
   - **Request URL** - Should be `https://nciylpeweuubguvmflym.supabase.co/...`
   - **Status Code** - What error code?
   - **Error Message** - What does it say?

## Common Error Messages

| Error | Solution |
|-------|----------|
| "Failed to fetch" | Restart dev server, check project status |
| "Network error" | Check internet, firewall, VPN |
| "CORS error" | Check Supabase CORS settings |
| "401 Unauthorized" | Check API key is correct |
| "404 Not Found" | Check URL is correct |
| "Project paused" | Restore project in dashboard |

## Verify Supabase is Working

1. Go to Supabase Dashboard
2. SQL Editor
3. Run: `SELECT 'OK' as test;`
4. If this works, Supabase is fine - issue is with client connection

## Still Stuck?

1. ✅ Restarted dev server?
2. ✅ Project is active (not paused)?
3. ✅ Environment variables correct?
4. ✅ Cleared `.next` cache?
5. ✅ Checked browser console for specific errors?

If all above are ✅, check:
- Supabase status: https://status.supabase.com
- Your project logs in Supabase Dashboard
- Try a different browser
- Check if VPN/firewall is blocking

