CREATE TABLE IF NOT EXISTS step_course_junction (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES steps (id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses (id) ON DELETE CASCADE
);
