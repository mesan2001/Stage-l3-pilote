CREATE TABLE IF NOT EXISTS rule_selectors (
    rule_id INTEGER REFERENCES rules (id) ON DELETE CASCADE,
    selector_id INTEGER REFERENCES selectors (id) ON DELETE CASCADE,
    PRIMARY KEY (rule_id, selector_id)
);
