CREATE TABLE IF NOT EXISTS modalities (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses (id) ON DELETE CASCADE,
    modality TEXT NOT NULL,
    groups INTEGER,
    hours FLOAT,
    CONSTRAINT unique_modality UNIQUE (course_id, modality)
);
