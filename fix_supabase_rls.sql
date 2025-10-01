-- Fix Supabase Row Level Security (RLS) to allow access
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily for testing (you can re-enable later)
ALTER TABLE "Library" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Chats" DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled, create policies that allow all access:
-- ALTER TABLE "Library" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON "Library" FOR ALL USING (true) WITH CHECK (true);
-- 
-- ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON "Users" FOR ALL USING (true) WITH CHECK (true);
-- 
-- ALTER TABLE "Chats" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON "Chats" FOR ALL USING (true) WITH CHECK (true);
