CREATE TABLE IF NOT EXISTS periods (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_hour TIME NOT NULL,
    end_hour TIME NOT NULL,
    weekdays JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb
);


INSERT INTO calendars (name, type, created_at)
VALUES ('Academic Calendar 2024-2025', 'global', CURRENT_TIMESTAMP);


DO $$
DECLARE
    calendar_id integer;
BEGIN
    SELECT id INTO calendar_id FROM calendars WHERE name = 'Academic Calendar 2024-2025';

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement du premier semestre',
        '2024-09-02',
        '2025-01-17',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"], ["2024-12-21", "2025-01-05"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement du second semestre',
        '2025-01-20',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-02-15", "2025-02-23"], ["2025-04-19", "2025-05-04"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement du troisième semestre',
        '2024-09-02',
        '2025-01-17',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"], ["2024-12-21", "2025-01-05"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement du quatrième semestre',
        '2025-01-20',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-02-15", "2025-02-23"], ["2025-04-19", "2025-05-04"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement du cinquième semestre',
        '2024-09-02',
        '2025-01-17',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"], ["2024-12-21", "2025-01-05"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement du sixième semestre',
        '2025-01-20',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-02-15", "2025-02-23"], ["2025-04-19", "2025-05-04"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Enseignement toute l''année',
        '2024-09-02',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"], ["2024-12-21", "2025-01-05"], ["2025-02-15", "2025-02-23"], ["2025-04-19", "2025-05-04"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Multi périodes',
        '2024-09-02',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"], ["2024-12-21", "2025-01-05"], ["2025-02-15", "2025-02-23"], ["2025-04-19", "2025-05-04"]]'::jsonb
    );


    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 1',
        '2024-09-02',
        '2024-10-11',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 2',
        '2024-10-14',
        '2024-11-22',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 3',
        '2024-11-25',
        '2025-01-17',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-12-21", "2025-01-05"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 4',
        '2025-01-20',
        '2025-03-21',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-02-15", "2025-02-23"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 5',
        '2025-03-24',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-04-19", "2025-05-04"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 6',
        '2024-09-02',
        '2024-10-11',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 7',
        '2024-10-14',
        '2024-11-22',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 8',
        '2024-11-25',
        '2025-01-17',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-12-21", "2025-01-05"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 9',
        '2025-01-20',
        '2025-03-21',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-02-15", "2025-02-23"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 10',
        '2025-03-24',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-04-19", "2025-05-04"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 11',
        '2024-09-02',
        '2024-10-11',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 12',
        '2024-10-14',
        '2024-11-22',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-10-26", "2024-11-03"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 13',
        '2024-11-25',
        '2025-01-17',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2024-12-21", "2025-01-05"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 14',
        '2025-01-20',
        '2025-03-21',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-02-15", "2025-02-23"]]'::jsonb
    );

    INSERT INTO periods (calendar_id, name, start_date, end_date, start_hour, end_hour, weekdays, exclusions)
    VALUES (
        calendar_id,
        'Période 15',
        '2025-03-24',
        '2025-06-06',
        '08:00:00',
        '18:00:00',
        '[1,2,3,4,5]'::jsonb,
        '[["2025-04-19", "2025-05-04"]]'::jsonb
    );

END $$;
