# 🚀 Supabase Setup Instructions for FieldLink Pro

Your Supabase project URL: `https://sikjocyjouraynbcappz.supabase.co`

## ⚠️ IMPORTANT: Complete These Steps

### Step 1: Update Database Password in .env.local

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sikjocyjouraynbcappz
2. Navigate to **Settings → Database**
3. Find your **Database Password** (the one you set when creating the project)
4. Edit `.env.local` and replace `[YOUR-PASSWORD]` with your actual password in both DATABASE_URL and DIRECT_URL

### Step 2: Get Your Anon Key (Optional but Recommended)

1. In Supabase Dashboard, go to **Settings → API**
2. Copy the `anon` `public` key
3. In `.env.local`, uncomment and update:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

### Step 3: Push Database Schema to Supabase

Once you've updated the password, run:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Optional: Seed with sample data
npm run db:seed
```

### Step 4: Test Locally

```bash
# Start the development server
npm run dev
```

Visit http://localhost:3000 and test the application with your Supabase database.

## 📦 Deployment to Vercel

### Step 5: Prepare for Production

1. Create `.env.production` with your production values:
   ```bash
   cp .env.local .env.production
   ```

2. Update `NEXTAUTH_URL` in `.env.production`:
   ```
   NEXTAUTH_URL="https://your-app-name.vercel.app"
   ```

### Step 6: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/new)
2. Import your GitHub repository: `Steel-tech/XTEAM-LINKX`
3. Add these environment variables in Vercel's dashboard:
   - `DATABASE_URL` (with your password)
   - `DIRECT_URL` (with your password)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if using)

4. Deploy!

## 🔐 Remove Demo Mode

After setting up authentication, remove demo mode:

```bash
npm run remove:demo
git add .
git commit -m "Remove demo authentication"
git push
```

## 🛠️ Troubleshooting

### Database Connection Issues
- Make sure your password doesn't contain special characters that need URL encoding
- Verify Supabase project is not paused (free tier pauses after 1 week of inactivity)
- Check that connection pooler is enabled in Supabase

### Schema Push Errors
- If you get errors about existing tables, you may need to reset:
  ```bash
  npx prisma migrate reset --skip-seed
  npx prisma db push
  ```

### Authentication Issues
- Ensure NEXTAUTH_SECRET is the same in both local and production
- For OAuth providers, configure callback URLs in provider dashboards

## ✅ Success Indicators

You'll know everything is working when:
1. `npx prisma db push` completes without errors
2. Prisma Studio shows your tables: `npx prisma studio`
3. The app loads at http://localhost:3000
4. You can create jobs and navigate between features

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Prisma + Supabase: https://www.prisma.io/docs/guides/database/supabase
- Your Supabase Dashboard: https://supabase.com/dashboard/project/sikjocyjouraynbcappz