-- Enable Supabase Realtime for the tables the app subscribes to.
-- Apply in the Supabase SQL Editor (production) after migrations + rls.sql.
--
-- Realtime reads the WAL, so it sees Drizzle writes made over DATABASE_URL.
-- RLS (see rls.sql) scopes delivery: each user only receives their own rows.

-- Deliver in-app notifications and appointment status changes to the browser.
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- FULL replica identity so UPDATE/DELETE payloads carry the row the filters need.
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
