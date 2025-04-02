CREATE TABLE IF NOT EXISTS group_class_junction (
    group_id INTEGER REFERENCES groups (id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES classes (id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, class_id)
);
