CREATE OR REPLACE VIEW detailed_classes AS
SELECT
    c.id,
    c.name,
    c.modality_id,
    COALESCE(SUM(dg.student_count), 0) AS total_students
FROM
    classes c
    LEFT JOIN group_class_junction gcj ON c.id = gcj.class_id
    LEFT JOIN detailed_groups dg ON gcj.group_id = dg.id
GROUP BY
    c.id, c.name, c.modality_id;
