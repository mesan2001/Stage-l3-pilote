CREATE TABLE IF NOT EXISTS modalities (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses (id) ON DELETE CASCADE,
    modality TEXT NOT NULL,
    hours FLOAT,
    session_length INTEGER,
    session_rooms TEXT,
    session_teacher TEXT,
    CONSTRAINT unique_modality UNIQUE (course_id, modality)
);
