# Klint's Cafe — Full-Stack Next.js App

Cinematic cafe ordering system. Vercel-ready. All features from the original PHP system.

---

## 🚀 Deploy to Vercel in 5 Steps

### Step 1 — Supabase Database (free)

1. Go to https://supabase.com → "New Project"
2. Name it `klints-cafe`, set a strong password
3. Once created: **SQL Editor → New Query**
4. Copy-paste the entire contents of `supabase-schema.sql` → Run
5. Save your credentials from **Settings → API**:
   - Project URL: `https://xxxx.supabase.co`
   - `anon public` key
   - `service_role` key (secret)

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Klint's Cafe"
git remote add origin https://github.com/YOUR_USERNAME/klints-cafe.git
git push -u origin main
```

### Step 3 — Deploy to Vercel

1. Go to https://vercel.com → "Add New Project"
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (will fail — that's OK, need env vars first)

### Step 4 — Set Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `JWT_SECRET` | Any random 32+ character string |

### Step 5 — Redeploy

Vercel → Deployments → click "..." on latest → **Redeploy**. Done! ✅

---

## 🔑 Default Credentials

After running the SQL schema:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `password` |
| Staff | `staff` | `password` |

> ⚠️ Change these immediately after first login via Admin → Staff tab.

---

## 📱 Pages

| URL | Description |
|-----|-------------|
| `/` | Cinematic cafe ordering page |
| `/track` | Track order by ID + name/phone |
| `/login` | Staff & Admin login |
| `/staff` | Staff dashboard (orders, report submission) |
| `/admin` | Admin dashboard (products, orders, staff, reports, reviews) |

---

## 🛠 Local Development

```bash
# 1. Copy env file
cp .env.example .env.local

# 2. Fill in your Supabase credentials in .env.local

# 3. Install & run
npm install
npm run dev

# Open http://localhost:3000
```

---

## 💡 Features

- ✅ Cinematic hero with Ken Burns + parallax
- ✅ Menu with category filter & search
- ✅ Cart with quantity controls
- ✅ Pickup & Delivery orders
- ✅ Tax, delivery fee, service fee calculation
- ✅ Real-time stock tracking
- ✅ Order tracking page
- ✅ Staff dashboard with auto-refresh (10s)
- ✅ Order status management
- ✅ Sales report submission
- ✅ Admin product CRUD
- ✅ Admin orders queue with filters
- ✅ Staff account management
- ✅ Revenue charts
- ✅ Payment breakdown reports
- ✅ Customer reviews
- ✅ Role permissions (admin / staff / user)
- ✅ JWT auth with httpOnly cookies
- ✅ 100% Vercel-compatible

---

## 🗄 Tech Stack

- **Frontend**: Next.js 14, React 18, Custom CSS (no UI library)
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT in httpOnly cookies + bcrypt
- **Hosting**: Vercel (free tier works)
