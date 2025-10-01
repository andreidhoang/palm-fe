-- Run this SQL in your Supabase Dashboard SQL Editor
-- Dashboard URL: https://supabase.com/dashboard/project/kleytyoogypuzciytiha/sql

-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Library table for storing search queries
CREATE TABLE IF NOT EXISTS "Library" (
    id SERIAL PRIMARY KEY,
    "libId" TEXT UNIQUE NOT NULL,
    "searchInput" TEXT NOT NULL,
    "userEmail" TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Chats table for storing AI responses
CREATE TABLE IF NOT EXISTS "Chats" (
    id SERIAL PRIMARY KEY,
    "libId" TEXT,
    "aiResp" TEXT,
    "userEmail" TEXT,
    "searchResult" JSONB,
    "userSearchInput" TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("libId") REFERENCES "Library"("libId") ON DELETE CASCADE
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Library" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chats" ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (for testing without auth)
CREATE POLICY "Allow all access to Users" ON "Users" FOR ALL USING (true);
CREATE POLICY "Allow all access to Library" ON "Library" FOR ALL USING (true);
CREATE POLICY "Allow all access to Chats" ON "Chats" FOR ALL USING (true);
