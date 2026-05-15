# AWS Cost Guardrails

## Purpose

This document defines the cost guardrails for the Traffiq v3 AWS deployment.

The goal is to prevent accidental AWS spend while still deploying a credible portfolio architecture.

Target monthly cost:

```text
0-10 EUR
```

Maximum acceptable demo/development cost:

```text
around 20 EUR
```

## Required Rule Before Creating AWS Resources

Before creating RDS, App Runner, ECR, or Cognito resources, configure an AWS Budget alert.

Minimum required budget:

```text
Budget type: Cost budget
Budget period: Monthly
Budget amount: 10 EUR or equivalent in account currency
Alert threshold 1: 50%
Alert threshold 2: 80%
Alert threshold 3: 100%
Email recipient: project owner email
```

Recommended extra budget:

```text
Budget amount: 20 EUR or equivalent in account currency
Alert threshold: 100%
Purpose: hard warning before exceeding the maximum accepted demo cost
```

AWS Budgets should be configured from:

```text
AWS Console -> Billing and Cost Management -> Budgets
```

## Services Allowed For v3

Use only these AWS services for the first v3 deployment:

| Service | Purpose | Cost rule |
| --- | --- | --- |
| AWS App Runner | Public FastAPI backend | Pause when not testing or presenting |
| Amazon RDS PostgreSQL | Cloud PostgreSQL database | Smallest viable Single-AZ instance |
| Amazon ECR | Backend Docker image registry | Keep only required images |
| Amazon Cognito | User authentication | Use basic user pool only |
| AWS Budgets | Cost monitoring | Must be configured before deployment |
| Amazon CloudWatch | Logs created by managed services | Keep logs minimal |

## Services Not Allowed In v3

Do not use these services for v3 unless the architecture is explicitly redesigned:

- NAT Gateway
- Kubernetes / Amazon EKS
- Application Load Balancer
- Multi-AZ RDS
- large RDS instance classes
- EC2 always-on servers
- managed Redis / ElastiCache
- paid third-party traffic APIs
- complex VPC networking unless required by RDS/App Runner connectivity

These services can quickly make the project more expensive than necessary for a license and portfolio demo.

## Recommended Minimal AWS Architecture

Use this minimal architecture:

```text
Mobile app
  -> AWS App Runner FastAPI service
  -> Amazon RDS PostgreSQL

Docker image
  -> Amazon ECR

Authentication
  -> Amazon Cognito
```

Scheduled ETL can be added later:

```text
EventBridge Scheduler -> ECS Fargate task -> RDS PostgreSQL
```

Do not create the scheduled ETL infrastructure until the API and RDS deployment are validated.

## App Runner Cost Guardrails

App Runner charges for compute and memory while the service is running.

Rules:

- use the smallest viable CPU/memory configuration
- do not enable unnecessary automatic deployments
- pause the service when not testing or presenting
- keep only one Traffiq App Runner service
- set low max concurrency/scale settings where possible

Recommended development behavior:

```text
Resume App Runner before demo/testing.
Pause App Runner after demo/testing.
```

Useful AWS CLI command shape:

```powershell
aws apprunner pause-service --service-arn <app-runner-service-arn>
aws apprunner resume-service --service-arn <app-runner-service-arn>
```

## RDS Cost Guardrails

RDS is the main cost risk for Traffiq v3.

Rules:

- use PostgreSQL
- use Single-AZ
- use the smallest viable instance class
- avoid Multi-AZ
- avoid provisioned IOPS
- avoid large storage allocation
- set short backup retention for demo environments
- stop the DB instance when not testing or presenting

Important limitation:

```text
An RDS DB instance can be stopped temporarily, but AWS can restart it after 7 consecutive days.
```

Useful AWS CLI command shape:

```powershell
aws rds stop-db-instance --db-instance-identifier <db-instance-id>
aws rds start-db-instance --db-instance-identifier <db-instance-id>
```

## ECR Cost Guardrails

Rules:

- keep one private ECR repository for the backend image
- delete old image tags after successful deployment
- avoid storing many large images
- do not push mobile artifacts to ECR

Recommended repository:

```text
traffiq-api
```

## Cognito Cost Guardrails

Rules:

- use one User Pool
- use one app client for the mobile app
- do not enable advanced enterprise identity features
- do not add paid SMS flows
- prefer email-based account flow

Cognito should support:

- register
- login
- logout
- forgot password
- reset password

## CloudWatch Cost Guardrails

Rules:

- keep default service logs only
- do not add high-volume custom logs in v3
- set log retention if possible
- do not log secrets or full request payloads

## Stop Resources Checklist

After a demo or development session:

1. Pause App Runner.
2. Stop RDS temporarily.
3. Verify no ECS/Fargate task is running.
4. Verify no unwanted EC2 instance exists.
5. Verify only required ECR images remain.
6. Check Billing and Cost Management.

Minimum validation:

```text
App Runner service: Paused
RDS DB instance: Stopped
Unexpected EC2/ECS/EKS resources: None
AWS Budget: Active
```

## Delete Resources Checklist

If the cloud demo is no longer needed:

1. Export or snapshot the database only if needed.
2. Delete the App Runner service.
3. Delete the RDS DB instance.
4. Delete unused RDS snapshots if not needed.
5. Delete ECR images and repository if no longer needed.
6. Delete unused Cognito User Pool if no longer needed.
7. Confirm Billing and Cost Management shows no unexpected running services.

## Validation Before Task 5

Before creating the RDS PostgreSQL database in Task 5, verify:

- AWS Budget exists
- budget email alert is configured
- cost target is documented
- services allowed for v3 are documented
- stop-resource checklist is documented

## Portfolio Explanation

Use this explanation:

```text
Before deploying Traffiq to AWS, I defined cost guardrails because the project is a portfolio and license deployment, not a 24/7 production system. The AWS version uses a minimal architecture: App Runner for FastAPI, RDS PostgreSQL for the database, ECR for the backend image, and Cognito for authentication. Expensive services such as NAT Gateway, Kubernetes, Multi-AZ RDS, and always-on EC2 are explicitly excluded.
```

## Official References

- AWS Budgets: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-create.html
- AWS App Runner pause/resume: https://docs.aws.amazon.com/apprunner/latest/dg/manage-pause.html
- Amazon RDS stop/start: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_StopInstance.html
- AWS App Runner pricing: https://aws.amazon.com/apprunner/pricing/
- Amazon RDS Free Tier: https://aws.amazon.com/rds/free/
- Amazon ECR pricing: https://aws.amazon.com/ecr/pricing/
