CREATE TABLE IF NOT EXISTS steps (
    id SERIAL PRIMARY KEY,
    formation_id TEXT REFERENCES formations (id),
    period_id INTEGER REFERENCES periods (id)
);
