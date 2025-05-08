CREATE TABLE IF NOT EXISTS selectors (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES rules (id),
    name TEXT NOT NULL,
    generator TEXT NOT NULL,
    filter TEXT NOT NULL
);
