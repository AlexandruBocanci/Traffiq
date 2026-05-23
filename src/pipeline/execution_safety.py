from src.config.settings import DB_CONFIG


RDS_HOST_SUFFIX = ".rds.amazonaws.com"


def is_rds_target(db_host):
    return db_host.strip().lower().endswith(RDS_HOST_SUFFIX)


def validate_destructive_pipeline_target(db_host, allow_cloud_reset=False):
    if is_rds_target(db_host) and not allow_cloud_reset:
        raise RuntimeError(
            "RDS pipeline reset blocked. Run with --confirm-cloud-reset only when "
            "you intend to replace the cloud analytical dataset."
        )


def validate_configured_pipeline_target(allow_cloud_reset=False):
    validate_destructive_pipeline_target(DB_CONFIG["host"], allow_cloud_reset)

    print(
        "Pipeline database target:",
        f"host={DB_CONFIG['host']}",
        f"database={DB_CONFIG['dbname']}",
        f"user={DB_CONFIG['user']}",
        f"port={DB_CONFIG['port']}",
    )
