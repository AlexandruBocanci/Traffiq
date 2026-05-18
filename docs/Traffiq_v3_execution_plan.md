# Traffiq v3 Execution Plan

## Purpose

Traffiq v3 turns the v2 portfolio foundation into a more realistic Suceava-focused application.

Final v3 target:

```text
cloud backend + AWS database + guest/public app flow + auth for personal features + real map/routing for Suceava
```

Scope decisions:

- UI language: English
- geography: Suceava city only
- public features work without login
- personal features require login
- AWS is required
- cost should stay as low as possible

Final v3 scope document:

- `docs/Traffiq_v3_scope.md`

## Cost Rules

- target monthly cost: `0-10 EUR`
- maximum acceptable cost during development/demo: around `20 EUR`
- run cloud services only when testing or presenting
- avoid NAT Gateway
- avoid Kubernetes
- avoid complex ECS + load balancer setup unless App Runner fails
- use the smallest viable RDS instance
- stop/delete resources after demo if needed

---

## Epic 1 - Final Product Scope

### Task 1. Define final Suceava-only product scope

Goal:

- lock the app scope to Suceava city
- avoid national or real-time Waze-level claims

Deliverables:

- final scope document
- clear list of included and excluded features
- accepted limitations

Scope document:

- `docs/Traffiq_v3_scope.md`

Definition of done:

- the project can be explained as a Suceava traffic intelligence proof-of-concept
- no task depends on country-wide traffic data

### Task 2. Define guest vs authenticated user flow

Goal:

- allow public traffic features without login
- require login for personal features

Flow document:

- `docs/Traffiq_v3_guest_auth_flow.md`

Guest features:

- Map / Drive
- route preview
- weather context
- traffic alerts
- general reports

Authenticated features:

- ride history
- saved routes
- saved destinations
- preferences
- account settings

Definition of done:

- every screen is classified as public or authenticated
- protected features have clear fallback UI for guest users
- public endpoints remain accessible without authentication
- protected endpoint categories are documented before Cognito implementation

### Task 3. Define final app navigation flow

Goal:

- make the app feel like a coherent product

Navigation document:

- `docs/Traffiq_v3_navigation_flow.md`

Final screens:

- Map / Drive
- Reports
- History
- Account
- Admin / Pipeline Status

Definition of done:

- navigation structure is documented
- Pipeline is no longer treated as a normal user tab
- Map / Drive is documented as the default app entry screen
- guest and authenticated navigation states are documented

---

## Epic 2 - AWS Cloud Foundation

### Task 4. Create AWS cost guardrails

Goal:

- prevent unexpected AWS costs

Cost guardrails document:

- `docs/AWS_COST_GUARDRAILS.md`

Deliverables:

- AWS Budget alert
- cost notes in docs
- list of services used

Definition of done:

- budget alert is configured
- project docs explain how to stop cloud resources
- allowed and disallowed AWS services are documented
- cost target and maximum accepted demo cost are documented

### Task 5. Create AWS RDS PostgreSQL database

Goal:

- move the project database from local/Docker-only PostgreSQL to AWS RDS

RDS document:

- `docs/AWS_RDS_POSTGRESQL.md`

Deliverables:

- RDS PostgreSQL instance
- database named `traffiq`
- security group configured for backend access
- environment values documented

Definition of done:

- schema can be created on RDS
- local or deployed backend can connect to RDS
- RDS endpoint and non-secret configuration are documented
- security group allows PostgreSQL only from the project owner IP

### Task 6. Apply database schema to RDS

Goal:

- create all project schemas and tables in cloud PostgreSQL

Schema application document:

- `docs/AWS_RDS_SCHEMA.md`

Deliverables:

- Bronze tables
- Silver tables
- Gold tables
- Serving views
- ETL metadata tables
- indexes

Definition of done:

- `sql/ddl/create_all.sql` runs successfully against RDS
- Bronze, Silver, Gold, Serving, and ETL metadata schemas exist on RDS
- endpoint-supporting indexes exist on RDS

### Task 7. Push backend Docker image to Amazon ECR

Goal:

- prepare the FastAPI backend image for AWS deployment

ECR image document:

- `docs/AWS_ECR_BACKEND_IMAGE.md`

Deliverables:

- ECR repository
- tagged backend image
- pushed image

Definition of done:

- image exists in ECR
- image tag `latest` is available in repository `traffiq-api`
- image digest is documented

### Task 8. Deploy FastAPI backend to AWS App Runner

Goal:

- make the backend available through a public URL

App Runner document:

- `docs/AWS_APP_RUNNER_BACKEND.md`

Deliverables:

- App Runner service
- public backend URL
- environment variables configured
- backend connected to RDS

Definition of done:

- `GET /health` works through the public URL
- `GET /mobile/drive-overview` works through the public URL
- App Runner can reach RDS through controlled security group access
- the public API URL is documented

### Task 9. Configure mobile app to use cloud API URL

Goal:

- remove dependency on localhost for mobile demo usage

Deliverables:

- mobile API config supports public backend URL
- local development still remains possible

Definition of done:

- phone can open the app and load backend data without the backend running on the PC

---

## Epic 3 - AWS Cognito Auth

### Task 10. Create Cognito User Pool

Goal:

- support email/password authentication through AWS

Deliverables:

- Cognito User Pool
- app client
- email verification or reset settings

Definition of done:

- users can be created in Cognito

### Task 11. Add mobile auth screens

Goal:

- add user-facing authentication UI

Screens:

- Login
- Register
- Forgot Password
- Reset Password
- Account

Definition of done:

- user can register
- user can log in
- user can log out
- user can request password reset

### Task 12. Add backend JWT validation

Goal:

- allow FastAPI to protect personal endpoints

Deliverables:

- Cognito JWT validation utility
- optional auth dependency for protected routes
- clear error response for unauthenticated requests

Definition of done:

- public endpoints work without token
- protected endpoints reject missing/invalid token

### Task 13. Protect personal features only

Goal:

- keep public features accessible to guests
- require login for personal data

Protected features:

- saved routes
- ride history
- preferences

Definition of done:

- guest users can still use Map and Reports
- personal screens prompt for login

---

## Epic 4 - Real Map And Routing For Suceava

### Task 14. Add real map component

Goal:

- replace static map-like presentation with a real map interface

Deliverables:

- map screen centered on Suceava
- current location support if permission is granted
- default Suceava viewport if permission is denied

Definition of done:

- app displays a real map for Suceava

### Task 15. Add route input flow

Goal:

- allow user to choose a destination

Deliverables:

- destination input
- bottom sheet or modal
- route search action

Definition of done:

- user can start route preview flow from the map

### Task 16. Integrate routing API

Goal:

- generate real route geometry for Suceava

Recommended option:

- OpenRouteService if free tier is enough

Deliverables:

- backend route service
- route geometry response
- distance
- estimated duration

Definition of done:

- backend can return route geometry between two Suceava points

### Task 17. Render route polyline and markers

Goal:

- show the calculated route visually on the map

Deliverables:

- origin marker
- destination marker
- route polyline
- route summary bottom sheet

Definition of done:

- selected route appears on map with distance and duration

### Task 18. Add Suceava route condition summary

Goal:

- combine route, weather, and existing traffic analytics into a useful summary

Deliverables:

- route condition label
- estimated duration
- weather context
- congestion score
- alerts if available

Definition of done:

- route preview feels like a traffic intelligence feature, not just a map line

---

## Epic 5 - Data Realism For Suceava

### Task 19. Define Suceava route and street seed dataset

Goal:

- replace generic demo routes with Suceava-specific routes

Deliverables:

- known Suceava streets/routes
- origin/destination examples
- route metadata

Definition of done:

- app data references Suceava locations only

### Task 20. Update ETL pipeline for cloud database

Goal:

- make pipeline write to RDS, not only local DB

Deliverables:

- cloud environment config
- pipeline validation against RDS
- updated docs

Definition of done:

- pipeline can load data into RDS

### Task 21. Keep Open-Meteo weather ingestion for Suceava

Goal:

- keep weather data real and free

Deliverables:

- Suceava latitude/longitude config
- weather extract still works
- weather data loads to RDS

Definition of done:

- cloud DB receives fresh weather records for Suceava

### Task 22. Improve events data for Suceava

Goal:

- make events feel local and realistic

Deliverables:

- Suceava-specific event seed data or free event source
- event markers on map
- event API preserved

Definition of done:

- map shows realistic Suceava traffic alerts

---

## Epic 6 - Product Features

### Task 23. Add saved routes

Goal:

- allow authenticated users to save routes

Deliverables:

- database table
- backend endpoints
- mobile save button
- saved routes list

Definition of done:

- logged-in user can save and view routes

### Task 24. Add ride history per user

Goal:

- make ride history personal

Deliverables:

- user-linked ride history table
- protected endpoint
- mobile History screen

Definition of done:

- guest sees login prompt
- logged-in user sees personal ride history

### Task 25. Add user preferences

Goal:

- make Account screen useful

Preferences:

- distance unit
- preferred route type
- theme mode if needed

Definition of done:

- logged-in user can view or update basic preferences

### Task 26. Add pipeline status endpoint

Goal:

- expose operational status through the backend

Endpoint:

```text
GET /pipeline/status
```

Definition of done:

- API returns latest run status
- API returns records extracted/loaded
- API returns latest data quality checks

### Task 27. Add Admin / Pipeline screen

Goal:

- keep pipeline visibility for demo and license discussion

Deliverables:

- latest pipeline status
- last successful run
- data quality summary

Definition of done:

- app can show pipeline health from backend data
