# Setting Up Environment Variables in Vercel

Your build is failing because Supabase environment variables are not set in Vercel. Follow these steps to fix it:

## Required Environment Variables

You need to set these environment variables in your Vercel project:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://[project-ref].supabase.co`
   - Example: `https://nciylpeweuubguvmflym.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public` key

3. **SUPABASE_SERVICE_ROLE_KEY** (Optional but recommended)
   - Your Supabase service role key (for admin operations)
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret` key
   - ⚠️ **Keep this secret!** Never expose it in client-side code.

## How to Set Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (`helpdeskticketingsystem`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Click **Add New**
   - Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the value
   - Select environments: **Production**, **Preview**, and **Development** (or as needed)
   - Click **Save**
5. Repeat for all required variables

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

## After Setting Environment Variables

1. **Redeploy your project**:
   - Go to Vercel Dashboard → Your Project → **Deployments**
   - Click the **⋯** menu on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger a new deployment

2. **Verify the build succeeds**:
   - Check the build logs in Vercel
   - The error "Missing Supabase environment variables" should be gone

## Getting Your Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → Use for `SUPABASE_SERVICE_ROLE_KEY`

## Important Notes

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` should **NOT** start with `NEXT_PUBLIC_` (it's server-only)
- After adding environment variables, you **must redeploy** for them to take effect
- Environment variables are case-sensitive

## Troubleshooting

If the build still fails after setting variables:

1. **Check variable names**: Make sure they match exactly (case-sensitive)
2. **Check all environments**: Ensure variables are set for Production, Preview, and Development
3. **Redeploy**: Environment variables only apply to new deployments
4. **Check build logs**: Look for the exact error message

## Local Development

For local development, create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note**: Never commit `.env.local` to git! It's already in `.gitignore`.

