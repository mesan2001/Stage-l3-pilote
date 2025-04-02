CREATE TABLE IF NOT EXISTS lecturer_assignments (
    id SERIAL PRIMARY KEY,
    lecturer_id BIGINT REFERENCES lecturers (id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses (id) ON DELETE CASCADE,
    modality_id BIGINT REFERENCES modalities (id) ON DELETE CASCADE,
    nb_groups INTEGER,
    computed_hours FLOAT,
    UNIQUE (lecturer_id, course_id, modality_id)
);
