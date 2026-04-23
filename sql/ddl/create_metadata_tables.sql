CREATE TABLE IF NOT EXISTS etl_meta.pipeline_runs (
    run_id SERIAL PRIMARY KEY,
    pipeline_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    records_extracted INTEGER DEFAULT 0,
    records_loaded INTEGER DEFAULT 0,
    error_message TEXT
);
