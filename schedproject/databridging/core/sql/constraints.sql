CREATE TABLE IF NOT EXISTS constraints (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb
);
