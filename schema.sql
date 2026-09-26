-- Anonymous events only. Never store message text, links, phone or account numbers here.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL,          -- 'check' | 'feedback'
  level TEXT,                  -- 'danger' | 'caution' | 'unclear'
  category TEXT,               -- e.g. 'job', 'bank', 'family'
  lang TEXT,                   -- 'en' | 'pcm'
  source TEXT,                 -- 'text' | 'image' | 'share'
  rules TEXT,                  -- comma-separated rule ids that fired
  helpful TEXT,                -- feedback: 'yes' | 'no'
  first_time TEXT              -- feedback: 'yes' | 'no'
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events (created_at);
