CREATE TABLE IF NOT EXISTS rules (
    id SERIAL PRIMARY KEY,
    name TEXT,
    author TEXT,
    description TEXT,
    constraint_name TEXT,
    parameters JSONB NOT NULL DEFAULT '[]'::jsonb
);
