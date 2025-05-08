CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    modality_id INTEGER REFERENCES modalities (id)
);
