DO $$
DECLARE
    var_calendar_id integer;
BEGIN
    SELECT id INTO var_calendar_id FROM calendars WHERE name = 'Academic Calendar 2024-2025';
    UPDATE formations
    SET
        calendar_id = var_calendar_id
    WHERE
        calendar_id IS NULL;
END $$;


UPDATE steps s
SET
    period_id = p.id
FROM
    periods p, formations f
WHERE
    s.periodname = p.name
AND
    s.formation_id = f.id
AND
    f.calendar_id = p.calendar_id
;
