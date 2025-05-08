CREATE TABLE IF NOT EXISTS rule_step_junction (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES rules (id),
    step_id INTEGER REFERENCES steps (id)
)
