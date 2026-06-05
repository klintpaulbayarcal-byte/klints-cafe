-- ============================================================
--  KLINT'S CAFE - CRITICAL FIX
--  Run this FIRST in Supabase SQL Editor → New Query
-- ============================================================

-- 1. DISABLE ROW LEVEL SECURITY (most important fix!)
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE products       DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports  DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        DISABLE ROW LEVEL SECURITY;

-- 2. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. FIX PASSWORDS
-- admin password = "admin123"
UPDATE users 
SET password = '$2b$10$7fHoCDRR1Xoxs.odZPCDLueUFLRcJ4ciyjNxt8cm0X4QYnfydfEBC'
WHERE username = 'admin';

-- staff password = "staff123"
UPDATE users
SET password = '$2b$10$lh3gztiFpeqU6J.6gNWhQ.OVnV9ZWAUPzavOtoM453mM8Ghm4ccbu'
WHERE username = 'staff';

-- 4. VERIFY
SELECT id, username, role FROM users;

-- ============================================================
-- After running this:
-- Admin login:  admin / admin123
-- Staff login:  staff / staff123
-- ============================================================
