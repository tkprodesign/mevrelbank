CREATE TABLE IF NOT EXISTS waitlist_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'business')),
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_created_at
  ON waitlist_submissions(created_at DESC);
