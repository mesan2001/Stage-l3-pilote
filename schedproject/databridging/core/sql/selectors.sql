CREATE TABLE IF NOT EXISTS selectors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    operation JSONB NOT NULL DEFAULT '[]'::jsonb
);
