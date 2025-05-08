CREATE TABLE IF NOT EXISTS lecturer_assignments (
    id SERIAL PRIMARY KEY,
    lecturer_id BIGINT REFERENCES lecturers (id) ON DELETE CASCADE,
    modality_id BIGINT REFERENCES modalities (id) ON DELETE CASCADE,
    nb_groups INTEGER,
    computed_hours FLOAT,
    UNIQUE (lecturer_id, modality_id)
);
