# AWS RDS PostgreSQL

## Purpose

This document records the Traffiq v3 Amazon RDS PostgreSQL database setup.

The goal of this task is to move Traffiq from a local/Docker-only PostgreSQL database toward a cloud database that can be used by:

- the FastAPI backend
- the ETL pipeline
- future App Runner deployment
- future scheduled pipeline jobs

## Current RDS Instance

Non-secret configuration:

| Setting | Value |
| --- | --- |
| AWS region | `eu-central-1` |
| Availability Zone | `eu-central-1a` |
| DB identifier | `traffiq-db` |
| Engine | `PostgreSQL` |
| Instance class | `db.t4g.micro` |
| Database name | `traffiq` |
| Master username | `traffiq_admin` |
| Endpoint | `traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com` |
| Port | `5432` |
| Public access | `Yes` |
| Security group source | Project owner's IP with `/32` |

Secret value not stored in Git:

```text
DB_PASSWORD
```

Do not commit the RDS password or any full connection string containing the password.

## Cost-Safe Configuration

The RDS instance was created with the v3 cost guardrails in mind:

- PostgreSQL, not Aurora
- Single-AZ deployment
- `db.t4g.micro`
- 20 GiB storage
- storage autoscaling disabled
- backup retention set to 1 day
- Performance Insights disabled
- Enhanced Monitoring disabled
- CloudWatch log exports disabled
- backup replication disabled
- deletion protection disabled for demo cleanup

Cost guardrails are documented in:

- `docs/AWS_COST_GUARDRAILS.md`

## Security Group Rule

The RDS instance is publicly reachable only for local development validation, but access is restricted by security group.

Required inbound rule:

```text
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: project owner IP /32
```

Do not use:

```text
0.0.0.0/0
```

If the local public IP changes, update the security group source before connecting again.

## Local Environment Configuration

Use a local Git-ignored `.env` file.

For RDS validation, local `.env` should contain:

```text
DB_HOST=traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com
DB_NAME=traffiq
DB_USER=traffiq_admin
DB_PASSWORD=<local-secret-rds-password>
DB_PORT=5432
```

Rules:

- `.env` must remain ignored by Git
- never paste the password into chat
- never commit the password
- keep `.env.example` generic

## Connectivity Validation

Network-level validation from the local machine:

```powershell
Test-NetConnection traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com -Port 5432
```

Expected result:

```text
TcpTestSucceeded: True
```

Validated result:

```text
TcpTestSucceeded: True
```

PostgreSQL client validation:

```powershell
psql -h traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com -p 5432 -U traffiq_admin -d traffiq
```

Expected result:

```text
psql opens a PostgreSQL session after the local password is entered.
```

## Python Configuration Validation

After `.env` points to RDS, validate the backend configuration:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -c "from src.config.settings import DB_CONFIG; print(DB_CONFIG['host'], DB_CONFIG['dbname'], DB_CONFIG['user'], DB_CONFIG['port'])"
```

Expected output:

```text
traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com traffiq traffiq_admin 5432
```

Do not print `DB_PASSWORD`.

Validated result:

```text
traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com traffiq traffiq_admin 5432
```

Database connection validation through the project utility:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -c "from src.utils.db_utils import get_db_connection; conn=get_db_connection(); print('RDS connection test passed.' if conn is not None else 'RDS connection test failed.'); conn.close() if conn is not None else None"
```

Validated result:

```text
Connected to the database.
RDS connection test passed.
```

## What Is Not Done Yet

This task creates the cloud PostgreSQL database.

The following work belongs to later tasks:

- applying `sql/ddl/create_all.sql` to RDS
- loading Bronze/Silver/Gold/Serving objects into RDS
- running the ETL pipeline against RDS
- connecting App Runner to RDS
- configuring mobile app to use the cloud API URL

## Stop Rule

When the database is not needed for development or demo, stop the RDS instance to control cost:

```powershell
aws rds stop-db-instance --db-instance-identifier traffiq-db --region eu-central-1
```

Start it again before validation or demo:

```powershell
aws rds start-db-instance --db-instance-identifier traffiq-db --region eu-central-1
```

AWS can restart stopped RDS instances after 7 consecutive days, so Billing should still be checked regularly.

## Official References

- Amazon RDS PostgreSQL getting started: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html
- Amazon RDS security groups: https://docs.aws.amazon.com/AmazonRDS/latest/gettingstartedguide/security-groups.html
- Amazon RDS stop/start: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_StopInstance.html
