-- Enable Supabase Realtime for the tables the app subscribes to.
-- Apply in the Supabase SQL Editor (production) after migrations + rls.sql.
--
-- Realtime reads the WAL, so it sees Drizzle writes made over DATABASE_URL.
-- RLS (see rls.sql) scopes delivery: each user only receives their own rows.
--
-- Safe to re-run: already-published tables are ignored.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- FULL replica identity so UPDATE/DELETE payloads carry row identity.
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
