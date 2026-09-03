-- Row Level Security policies for Cleaning App
-- Apply in Supabase SQL Editor after migrations.
-- App business writes mostly go through Drizzle + DATABASE_URL; these policies
-- protect any direct Supabase client access to customer-owned rows.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

-- Users / profiles -----------------------------------------------------------

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Addresses ------------------------------------------------------------------

CREATE POLICY "addresses_select_own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Appointments + related -----------------------------------------------------

CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = cleaner_id);

-- Admins receive Realtime appointment updates for the whole shop inbox.
CREATE POLICY "appointments_select_admin"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'ADMIN'
    )
  );

CREATE POLICY "appointments_insert_own"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "appointments_update_own"
  ON appointments FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "appointment_items_select_own"
  ON appointment_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
        AND (a.customer_id = auth.uid() OR a.cleaner_id = auth.uid())
    )
  );

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id AND a.customer_id = auth.uid()
    )
  );

CREATE POLICY "reviews_select_own"
  ON reviews FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Admins can receive Realtime for any booking thread (not only as recipient).
CREATE POLICY "messages_select_admin"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'ADMIN'
    )
  );

CREATE POLICY "messages_insert_as_sender"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "shop_members_select_own"
  ON shop_members FOR SELECT
  USING (auth.uid() = user_id);

-- Public catalog / availability (read-only for authenticated users) ----------

CREATE POLICY "shops_select_authenticated"
  ON shops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_categories_select_authenticated"
  ON service_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "services_select_authenticated"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "availability_slots_select_authenticated"
  ON availability_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "job_logs_select_own_appointment"
  ON job_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
        AND (a.customer_id = auth.uid() OR a.cleaner_id = auth.uid())
    )
  );
