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

CREATE TABLE IF NOT EXISTS etl_meta.data_quality_checks (
    check_id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES etl_meta.pipeline_runs(run_id),
    check_name VARCHAR(100) NOT NULL,
    check_status VARCHAR(50) NOT NULL,
    affected_records INTEGER DEFAULT 0,
    details TEXT
);
