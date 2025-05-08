CREATE TABLE IF NOT EXISTS student_course_junction (
    student_id INTEGER REFERENCES students (id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses (id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, course_id)
);
