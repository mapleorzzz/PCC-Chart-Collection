# PCC private scheduled-post storage

Scheduled charts and drafts are stored in Supabase instead of the public GitHub repository.

## 1. Create the table

In the Supabase project SQL Editor, run the SQL in `supabase/scheduled-posts.sql`.

## 2. Configure Vercel environment variables

Add these variables to the PCC Vercel project for Production (and Preview if you use it):

- `SUPABASE_URL`: Project URL from Supabase Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY`: the server-side `service_role` key from Project Settings → API Keys.

Keep the service-role key private. Do not prefix it with `NEXT_PUBLIC_`, do not put it in GitHub, and do not share it in chat.

Redeploy the Vercel project after adding the variables.

## 3. Existing scheduled posts

The public `src/data/scheduled-charts.json` was empty when this migration was prepared. New drafts and scheduled posts will be saved only in Supabase. The cron endpoint publishes due charts to the public chart data in GitHub, then removes them from the private store.
