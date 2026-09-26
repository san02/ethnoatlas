CREATE TABLE datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    citation TEXT
);

CREATE TABLE societies (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES datasets(id),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    glottocode TEXT,
    year TEXT,
    region TEXT,
    geometry geometry(Point, 4326)
);

CREATE TABLE society_names (
    id BIGSERIAL PRIMARY KEY,
    society_id TEXT NOT NULL REFERENCES societies(id),
    name TEXT NOT NULL
);

CREATE TABLE variables (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES datasets(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    unit TEXT
);

CREATE TABLE codes (
    id TEXT PRIMARY KEY,
    variable_id TEXT NOT NULL REFERENCES variables(id),
    name TEXT NOT NULL,
    description TEXT,
    ord INTEGER
);

CREATE TABLE "values" (
    id Text PRIMARY KEY,
    society_id TEXT NOT NULL REFERENCES societies(id),
    variable_id TEXT NOT NULL REFERENCES variables(id),
    code_id TEXT REFERENCES codes(id),
    value TEXT,
    comment TEXT,
    source TEXT,
    year TEXT,
    sub_case TEXT,
    source_coded_data TEXT,
    admin_comment TEXT
);

CREATE INDEX idx_societies_geometry
    ON societies USING GIST (geometry);