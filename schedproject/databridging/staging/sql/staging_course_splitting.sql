DROP TABLE IF EXISTS formations CASCADE;

CREATE TABLE formations AS
SELECT DISTINCT
    step_id as id,
    name,
    stepstructurecode as formationstructurecode,
    stepstructurename as formationstructurename,
    year
FROM
    stage_course_1;

ALTER TABLE formations ADD PRIMARY KEY (id);

ALTER TABLE formations
ADD COLUMN calendar_id INTEGER;

ALTER TABLE formations ADD FOREIGN KEY (calendar_id) REFERENCES calendars (id);

DROP TABLE IF EXISTS steps CASCADE;

CREATE TABLE steps (
    id SERIAL PRIMARY KEY,
    formation_id TEXT,
    period_id INTEGER,
    periodcode TEXT,
    periodname TEXT
);

ALTER TABLE steps ADD FOREIGN KEY (period_id) REFERENCES periods (id);

INSERT INTO
    steps (formation_id, periodcode, periodname)
SELECT DISTINCT
    c.step_id,
    c.periodcode,
    c.periodname
FROM
    stage_course_1 c;

ALTER TABLE steps ADD FOREIGN KEY (formation_id) REFERENCES formations (id);

DROP TABLE IF EXISTS new_courses CASCADE;

CREATE TABLE new_courses (
    id SERIAL PRIMARY KEY,
    coursenumber TEXT,
    coursename TEXT,
    elpccode TEXT,
    elpname TEXT,
    cnucode TEXT,
    cnuname TEXT,
    CONSTRAINT unique_course UNIQUE (coursenumber)
);

INSERT INTO
    new_courses (
        coursenumber,
        coursename,
        elpccode,
        elpname,
        cnucode,
        cnuname
    )
SELECT DISTINCT
    c.elementnumber,
    c.elementname,
    c.elpccode,
    c.elpname,
    c.cnucode,
    c.cnuname
FROM
    stage_course_1 c;

DROP TABLE IF EXISTS step_course_junction CASCADE;

CREATE TABLE step_course_junction (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES steps (id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES new_courses (id) ON DELETE CASCADE
);

INSERT INTO
    step_course_junction (step_id, course_id)
SELECT DISTINCT
    s.id,
    c.id
FROM
    stage_course_1 o
    JOIN steps s ON o.step_id = s.formation_id
    AND o.periodcode = s.periodcode
    JOIN new_courses c ON c.coursenumber = o.elementnumber;

DROP TABLE IF EXISTS modalities CASCADE;

CREATE TABLE modalities (
    id SERIAL PRIMARY KEY,
    course_id INTEGER,
    modality TEXT,
    hours FLOAT
);

INSERT INTO
    modalities (course_id, modality, hours)
SELECT DISTINCT
    c.id,
    o.modality,
    o.hours
FROM
    stage_course_1 o
    JOIN new_courses c ON c.coursenumber = o.elementnumber;

ALTER TABLE modalities ADD CONSTRAINT unique_modality UNIQUE (course_id, modality);

ALTER TABLE modalities ADD FOREIGN KEY (course_id) REFERENCES new_courses (id);
