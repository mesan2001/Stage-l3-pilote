CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    modality_id INTEGER REFERENCES modalities (id),
    name TEXT NOT NULL
);
