CREATE TABLE IF NOT EXISTS custom_labels (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    label_key VARCHAR(50),
    label TEXT,
    origin VARCHAR(20) DEFAULT 'custom'
);
