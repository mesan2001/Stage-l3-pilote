CREATE TABLE IF NOT EXISTS student_group_junction (
    student_id BIGINT REFERENCES students (id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups (id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, group_id)
);
