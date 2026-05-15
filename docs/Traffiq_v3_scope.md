# Traffiq v3 Scope

## Status

Traffiq v3 is scoped as a Suceava-only traffic intelligence proof-of-concept.

The goal is to make the project more realistic and deployable without pretending to be a production navigation platform.

## Product Positioning

Use this positioning:

```text
Traffiq is a Suceava-focused traffic intelligence data engineering application.
```

Do not use this positioning:

```text
Traffiq is a real-time Waze clone.
```

The project value is the end-to-end data system:

- data ingestion
- PostgreSQL analytical layers
- route and weather-aware analytics
- FastAPI serving layer
- React Native mobile app
- AWS deployment path

## Geographic Scope

Traffiq v3 targets only Suceava city.

Included:

- routes inside Suceava city
- Suceava street and route seed data
- Suceava weather context
- Suceava traffic alerts based on controlled or seeded data
- Suceava map viewport and route previews

Excluded:

- Suceava county-wide routing
- Romania-wide coverage
- multi-city support
- international routing
- national real-time traffic coverage

This keeps the project realistic for a license and portfolio version.

## Included In v3

Traffiq v3 includes:

- public Map / Drive experience
- route preview for Suceava routes
- real map component centered on Suceava
- route geometry through a low-cost or free routing API
- Open-Meteo weather context for Suceava
- route condition summary combining route, weather, and existing traffic analytics
- traffic alerts based on controlled Suceava event data
- general reports available without login
- AWS-hosted FastAPI backend
- Amazon RDS PostgreSQL database
- Amazon ECR for the backend Docker image
- AWS App Runner for the public API
- Amazon Cognito for authentication
- mobile app connected to the public API URL

## Guest Features

Guest users can use public product features without logging in.

Guest-accessible features:

- Map / Drive
- route preview
- weather context
- traffic alerts
- general reports
- route condition summary

Guest users should not be blocked from understanding traffic conditions in Suceava.

## Authenticated Features

Authentication is required only for personal features.

Authenticated features:

- saved routes
- personal ride history
- saved destinations
- user preferences
- account settings

The authentication layer exists to protect user-specific data, not to block the public traffic experience.

## Explicit Non-Goals

Traffiq v3 will not include:

- Waze-like real-time traffic
- user-generated traffic reports
- push notifications
- multi-city support
- enterprise-grade infrastructure
- Kubernetes
- NAT Gateway
- always-on production operation
- paid traffic API dependency
- full turn-by-turn navigation engine

## Accepted Limitations

The following limitations are accepted for v3:

- traffic data can remain controlled or seeded if reliable free traffic APIs are not available
- event data can be seeded with realistic Suceava examples
- route generation can use a free or low-cost routing API
- the backend does not need to run 24/7
- AWS resources can be stopped or deleted outside demos to control cost
- the app is a serious proof-of-concept, not a production mobility platform

## AWS Scope

AWS is required for v3, but the deployment must stay low-cost.

Target architecture:

```text
Mobile app -> AWS App Runner FastAPI -> Amazon RDS PostgreSQL
Docker image -> Amazon ECR
Auth -> Amazon Cognito
Pipeline -> cloud database
```

Cost rules:

- target monthly cost: `0-10 EUR`
- maximum acceptable development/demo cost: around `20 EUR`
- avoid always-on infrastructure when not testing or presenting
- avoid NAT Gateway
- avoid Kubernetes
- use the smallest viable RDS configuration

## Future Work

The following items are outside v3 and can be discussed later:

- real-time traffic provider integration
- user-generated event reports
- push notifications
- multi-city expansion
- production-grade monitoring stack
- advanced route optimization
- public app store release

## Definition Of Done For Scope

The v3 scope is accepted when:

- the app is clearly limited to Suceava city
- guest and authenticated features are separated
- AWS is part of the target delivery
- cost expectations are documented
- real-time Waze-like traffic is explicitly excluded
- future work is separated from v3 delivery
