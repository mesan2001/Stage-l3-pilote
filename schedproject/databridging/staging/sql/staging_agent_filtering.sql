DROP VIEW IF EXISTS stage_lecturer CASCADE;

CREATE VIEW stage_lecturer AS
SELECT
    *
FROM
    raw_agent
WHERE
    typeenseignant = 'E';

