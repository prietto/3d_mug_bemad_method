# Story 8.3 Migration Instructions

## 🚀 Migration for AI Rate Limiting (Story 8.3)

**Status:** ⚠️ Manual execution required
**Date:** 2025-10-07
**Story:** 8.3 - Multi-Layer Rate Limiting & Production Readiness

---

## 📋 Quick Guide

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Sign in to your account

2. **Select Project**
   - Choose project: `vavyzbeqdjrlushuqzjk`
   - Navigate to **SQL Editor** in the left sidebar

3. **Execute Migration**
   - Copy the SQL content from: `supabase/migrations/003_ai_rate_limiting.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** to execute

4. **Verify Results**
   - Go to **Table Editor**
   - You should see: `ai_generation_limits` and `ai_generation_global_counter` tables

### Option 2: Command Line (if you have Supabase CLI)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vavyzbeqdjrlushuqzjk

# Run migration
supabase db push
```

---

## 🔍 Verification Steps

After running the migration, verify that the following objects exist:

### Tables Created:
- ✅ `ai_generation_limits` (IP tracking)
- ✅ `ai_generation_global_counter` (Global counter)

### Indexes Created:
- ✅ `idx_ai_limits_ip_date` on `ai_generation_limits(ip_address, date_key)`
- ✅ `idx_global_counter_date` on `ai_generation_global_counter(date_key)`

### Functions Created:
- ✅ `increment_ip_generation(p_ip_address TEXT, p_date_key TEXT)`
- ✅ `increment_global_generation(p_date_key TEXT)`

### Security:
- ✅ Row Level Security (RLS) enabled on both tables
- ✅ No public access (service role key required)

---

## 🎯 What This Migration Does

### Layer 2: IP-based Rate Limiting
- Tracks generation count per IP address per day
- Maximum: 15 generations per IP per day
- Automatic reset at UTC midnight

### Layer 3: Global Rate Limiting
- Tracks total generations across all users per day
- Maximum: 1,400 generations per day (100 token buffer below 1,500 limit)
- Prevents API quota exhaustion

### Database Functions
- `increment_ip_generation`: Atomically increments IP counter
- `increment_global_generation`: Atomically increments global counter
- Both handle race conditions safely

---

## 🚨 Important Notes

1. **Service Role Key**: The migration uses admin privileges via the service role key
2. **No Public Access**: Tables have RLS enabled with no public policies
3. **Atomic Operations**: Functions use `INSERT ON CONFLICT` to prevent race conditions
4. **Daily Reset**: Uses `date_key` (YYYY-MM-DD) for automatic daily resets

---

## ✅ Success Indicators

When migration is successful:

1. **No errors** in SQL execution
2. **Tables visible** in Supabase Table Editor
3. **Functions callable** via SQL:
   ```sql
   -- Test functions
   SELECT * FROM increment_ip_generation('192.168.1.1', '2025-10-07');
   SELECT * FROM increment_global_generation('2025-10-07');
   ```

4. **Story 8.3 ready** for deployment
5. **Rate limiting infrastructure** in place

---

## 🐛 Troubleshooting

### Permission Denied
- Ensure you're logged in as the project owner
- Check that you have admin privileges on the Supabase project

### Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct

### Table Already Exists
- Migration uses `IF NOT EXISTS` - safe to run multiple times
- Existing data will be preserved

---

## 📞 Support

If you encounter issues:

1. Check Supabase project status
2. Verify environment variables in `.env.local`
3. Review SQL syntax in the migration file
4. Contact development team with error details

---

## 🎉 Next Steps

After successful migration:

1. ✅ Story 8.3 is **deployment ready**
2. ✅ Rate limiting infrastructure is **active**
3. ✅ API routes can enforce **3-layer protection**
4. ✅ Admin monitoring is **available**
5. ✅ Manual upload **fallback** works as expected

**Ready for production deployment! 🚀**