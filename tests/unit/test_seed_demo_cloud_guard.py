import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from src.pipeline.execution_safety import is_rds_target
from src.pipeline.execution_safety import validate_destructive_pipeline_target


def test_local_database_does_not_require_cloud_confirmation():
    validate_destructive_pipeline_target("localhost")
    return True


def test_rds_database_requires_cloud_confirmation():
    try:
        validate_destructive_pipeline_target(
            "traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com"
        )
    except RuntimeError:
        return True

    print("FAILED: Amazon RDS reset should require explicit confirmation.")
    return False


def test_rds_database_accepts_explicit_cloud_confirmation():
    validate_destructive_pipeline_target(
        "traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com",
        allow_cloud_reset=True,
    )
    return True


def test_rds_target_detection():
    if not is_rds_target("traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com"):
        print("FAILED: Amazon RDS endpoint should be detected as a cloud target.")
        return False

    if is_rds_target("localhost"):
        print("FAILED: localhost should not be detected as an RDS target.")
        return False

    return True


print(test_local_database_does_not_require_cloud_confirmation())
print(test_rds_database_requires_cloud_confirmation())
print(test_rds_database_accepts_explicit_cloud_confirmation())
print(test_rds_target_detection())
