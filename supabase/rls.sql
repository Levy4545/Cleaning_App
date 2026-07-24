-- Row Level Security policies for Cleaning App
-- Run these in Supabase SQL Editor or via migration after tables exist.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Users can update their own record
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON profiles
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
