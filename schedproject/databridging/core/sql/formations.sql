CREATE TABLE IF NOT EXISTS formations (
    id TEXT PRIMARY KEY,
    name TEXT,
    year TEXT,
    calendar_id INTEGER REFERENCES calendars (id)
);
