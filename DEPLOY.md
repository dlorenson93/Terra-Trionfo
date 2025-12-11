# 🚀 Deploy Terra Trionfo - Step by Step

## Step 1: Push to GitHub (DO THIS FIRST)

```bash
git push origin main
```

If you get an error, make sure you have your GitHub credentials set up.

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (EASIEST - 5 minutes)

1. **Go to [vercel.com/new](https://vercel.com/new)**
2. **Sign in with GitHub**
3. **Import Repository**
   - Find `dlorenson93/Terra-Trionfo`
   - Click "Import"
4. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Leave everything else as default
5. **DON'T DEPLOY YET** - Click "Environment Variables" first

---

## Step 3: Set Up Database (Neon - Free)

1. **Go to [neon.tech](https://neon.tech)**
2. **Sign up** (free account)
3. **Create a new project**
   - Name: `terra-trionfo`
   - Region: Choose closest to you
4. **Copy your connection string**
   - It looks like: `postgresql://user:password@host/database?sslmode=require`

---

## Step 4: Add Environment Variables in Vercel

In your Vercel project setup, add these three variables:

### Variable 1: DATABASE_URL
```
Name: DATABASE_URL
Value: [paste your Neon connection string]
```

### Variable 2: NEXTAUTH_URL
```
Name: NEXTAUTH_URL
Value: https://terra-trionfo.vercel.app
```
(Vercel will show you the actual URL, use that)

### Variable 3: NEXTAUTH_SECRET
Generate a secret by running this in terminal:
```bash
openssl rand -base64 32
```
Then:
```
Name: NEXTAUTH_SECRET
Value: [paste the generated secret]
```

---

## Step 5: Deploy!

1. Click **"Deploy"** in Vercel
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://terra-trionfo.vercel.app`

---

## Step 6: Set Up Database Tables

After deployment succeeds:

1. **In your terminal:**
```bash
# Pull environment variables from Vercel
npx vercel env pull .env.production

# Use production env
export $(cat .env.production | xargs)

# Run migrations
npx prisma migrate deploy

# Seed with sample data
npx prisma db seed
```

**OR** use Vercel CLI:
```bash
npm i -g vercel
vercel env pull
npx prisma migrate deploy
npx prisma db seed
```

---

## Step 7: Test Your Live Site! 🎉

Visit your Vercel URL and test:
- ✅ Sign in with: `admin@terratrionfo.com` / `password123`
- ✅ Browse products
- ✅ Try all features

---

## 🔥 Quick Alternative: One-Click Deploy

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dlorenson93/Terra-Trionfo)

Then just:
1. Add environment variables (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
2. Run migrations
3. Done!

---

## 🐛 Troubleshooting

### Build fails?
- Check that all environment variables are set
- Make sure DATABASE_URL is from Neon (with `?sslmode=require`)

### Database errors?
- Run migrations: `npx prisma migrate deploy`
- Check connection string format

### Can't access admin?
- Run seed script: `npx prisma db seed`
- Or manually create admin user

---

## 📱 Share Your Site

Once deployed, share this URL:
```
https://terra-trionfo.vercel.app
```

Your app is now live and fully operational! 🌾

---

**Need help?** The deployment should take about 5-10 minutes total.
