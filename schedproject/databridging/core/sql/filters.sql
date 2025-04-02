CREATE TABLE IF NOT EXISTS filters (
    id SERIAL PRIMARY KEY,
    selector_id INTEGER REFERENCES selectors(id) ON DELETE CASCADE,
    resource_type TEXT,
    label_key TEXT,
    label_value TEXT,
    rank JSONB DEFAULT '[]'::jsonb
);
