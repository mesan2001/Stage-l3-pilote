DROP VIEW IF EXISTS stage_course_filtering_flattening CASCADE;

CREATE VIEW stage_course_filtering_flattening AS
WITH filtering AS (
    SELECT
        *
    FROM
        raw_courses
    WHERE
        codeNatureElp = 'CHAR'
),
translation AS (
    SELECT
        annee AS year,
        codeStructureEtape AS stepStructureCode,
        libStructureEtape AS stepStructureName,
        codeEtape AS step_id,
        libEtape AS name,
        noElement AS elementNumber,
        libElement AS elementName,
        codeNatureElp AS ELPCcode,
        libNatureElp AS ELPName,
        codeCNU AS CNUCode,
        libCNU AS CNUName,
        codePeriode AS periodCode,
        libPeriode AS periodName,
        CAST(nbHeureCM AS float) AS hoursLecture,
        CAST(nbHeureTD AS float) AS hoursTutorial,
        CAST(nbHeureTP AS float) AS hoursPractical,
        CAST(nbHeureCMTD AS float) AS hoursLectureTutorial,
        CAST(nbGroupeCM AS integer) AS groupsLecture,
        CAST(nbGroupeTD AS integer) AS groupsTutorial,
        CAST(nbGroupeTP AS integer) AS groupsPractical,
        CAST(nbGroupeCMTD AS integer) AS groupsLectureTutorial,
        NULLIF(NULLIF(nbEtuInscritElpEtape, 'None'), '')::integer AS studentsRegisteredElpStep,
        NULLIF(NULLIF(nbEtuInscritElpTotal, 'None'), '')::integer AS studentsRegisteredElpTotal,
        NULLIF(NULLIF(volumeHoraireElpPondereEtape, 'None'), '')::float AS weightedHoursElpStep,
        NULLIF(NULLIF(volumeHoraireElpTotal, 'None'), '')::float AS totalHoursElp,
        NULLIF(NULLIF(nbEtuInscritPrevisionnelElpEtape, 'None'), '')::integer AS expectedStudentsElpStep,
        NULLIF(NULLIF(nbEtuInscritPrevisionnelElpTotal, 'None'), '')::integer AS expectedStudentsElpTotal,
    nbEtape AS stepsCount
FROM
    filtering
),
flattening AS (
    SELECT
        *,
        'lecture' AS modality,
        hoursLecture AS hours,
        groupsLecture AS groups
    FROM
        translation
    WHERE
        hoursLecture > 0
    UNION ALL
    SELECT
        *,
        'tutorial' AS modality,
        hoursTutorial AS hours,
        groupsTutorial AS groups
    FROM
        translation
    WHERE
        hoursTutorial > 0
    UNION ALL
    SELECT
        *,
        'practical' AS modality,
        hoursPractical AS hours,
        groupsPractical AS groups
    FROM
        translation
    WHERE
        hoursPractical > 0
    UNION ALL
    SELECT
        *,
        'lecture tutorial' AS modality,
        hoursLectureTutorial AS hours,
        groupsLectureTutorial AS groups
    FROM
        translation
    WHERE
        hoursLectureTutorial > 0
)
SELECT
    *
FROM
    flattening;
