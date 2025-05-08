CREATE
OR REPLACE VIEW detailed_groups AS
SELECT
    g.*,
    COUNT(sgj.student_id) AS student_count
FROM
    groups g
    LEFT JOIN student_group_junction sgj ON g.id = sgj.group_id
GROUP BY
    g.id,
    g.name,
    g.modality_id;
