-- Row counts
SELECT 'datasets' AS table_name, COUNT(*) FROM datasets
UNION ALL
SELECT 'societies', COUNT(*) FROM societies
UNION ALL
SELECT 'society_names', COUNT(*) FROM society_names
UNION ALL
SELECT 'variables', COUNT(*) FROM variables
UNION ALL
SELECT 'codes', COUNT(*) FROM codes
UNION ALL
SELECT 'values', COUNT(*) FROM "values";


-- Orphan societies
SELECT COUNT(*) AS orphan_societies
FROM societies s
LEFT JOIN datasets d ON d.id = s.dataset_id
WHERE d.id IS NULL;


-- Orphan codes
SELECT COUNT(*) AS orphan_codes
FROM codes c
LEFT JOIN variables v ON v.id = c.variable_id
WHERE v.id IS NULL;


-- Orphan values: society
SELECT COUNT(*) AS orphan_value_societies
FROM "values" v
LEFT JOIN societies s ON s.id = v.society_id
WHERE s.id IS NULL;


-- Orphan values: variable
SELECT COUNT(*) AS orphan_value_variables
FROM "values" v
LEFT JOIN variables x ON x.id = v.variable_id
WHERE x.id IS NULL;


-- Orphan values: code
SELECT COUNT(*) AS orphan_value_codes
FROM "values" v
LEFT JOIN codes c ON c.id = v.code_id
WHERE v.code_id IS NOT NULL
  AND c.id IS NULL;