CREATE TABLE IF NOT EXISTS descriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_name TEXT NOT NULL,
  image_type TEXT NOT NULL,
  description_details TEXT,
  priority INTEGER DEFAULT 0,
  created_on INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS image_urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_on INTEGER NOT NULL,
  FOREIGN KEY (description_id) REFERENCES descriptions(id) ON DELETE CASCADE
);
