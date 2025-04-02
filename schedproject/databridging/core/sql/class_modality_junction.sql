CREATE TABLE IF NOT EXISTS class_modality_junction (
    class_id INTEGER REFERENCES classes (id) ON DELETE CASCADE,
    modality_id INTEGER REFERENCES modalities (id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, modality_id)
);
