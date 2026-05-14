# Traffiq v2

## Status

Traffiq v2 is closed.

Final recap:

- `docs/Traffiq_v2_recap.md`

Next backlog:

- `docs/Traffiq_v3_backlog.md`

## 1. Goal

Traffiq v2 extends v1 toward a more complete and product-like version of the project.

Its purpose is to add:

- stronger backend architecture
- richer route intelligence
- better monitoring and orchestration
- more realistic app capabilities
- deployment readiness
- final portfolio-level maturity

## 2. What v2 Adds Over v1

### Product additions

- richer map experience
- route-focused reporting
- event visibility
- better ride history
- stronger product realism in the mobile app

### Data additions

- route-level analytics
- event ingestion layer
- stronger Gold metrics
- better metadata and monitoring
- serving-ready analytical outputs

### Platform additions

- cleaner configuration management
- better project structure
- stronger testing
- orchestration
- Docker and AWS preparation

## 3. v2 Product Experience

v2 should feel much closer to a real product than v1.

### v2 mobile app areas

1. `Reports`
2. `Routes`
3. `Map`
4. `History`
5. `Pipeline / Status`

### v2 area details

#### Reports

- richer analytical summaries
- route-level reporting
- stronger traffic and weather insights

#### Routes

- route report by origin and destination
- hourly route analysis
- route summary metrics

#### Map

- event visibility
- congestion highlights
- stronger route-focused analytical presentation

#### History

- previous analyzed rides or route checks
- reusable report-style summaries

#### Pipeline / Status

- better operational visibility
- richer metadata and run tracking

## 4. v2 Technical Additions

- environment-based configuration
- pipeline runner
- ETL metadata logging
- basic data quality checks logging
- route reference layer
- route Gold summaries
- events layer
- history layer
- stronger API structure
- stronger integration testing

## 5. v2 Likely Database Additions

- `etl_meta.pipeline_runs`
- `etl_meta.data_quality_checks`
- `silver.events_observations`
- `silver.route_reference`
- `gold.route_summary`
- `gold.top_congested_segments`
- serving-layer views if needed for API consumption

## 6. v2 API Additions

- `GET /routes/report`
- `GET /routes/hourly`
- `GET /rides/history`
- `GET /map/events`

Possible later additions inside v2 if still justified:

- `GET /routes/options`

## 7. v2 Infrastructure Direction

- Dockerization
- scheduled ETL direction
- deployment preparation to AWS
- configuration separation for local and deployable environments

## 8. v2 Success Criteria

v2 is successful if:

- the project feels like a real backend-driven product
- route reporting is significantly richer than v1
- the mobile app demonstrates clear product progress over v1
- the pipeline is more orchestrated and observable
- the project is ready for serious portfolio presentation and cloud deployment direction

## 9. v2 Commit Plan

### Configuration and Structure

- [x] Move configuration from hardcoded settings to `.env`
- [x] Add `.env.example` and local environment documentation update
- [x] Refactor backend project structure for cleaner API and pipeline organization

### Pipeline Orchestration and Monitoring

- [x] Create pipeline runner for end-to-end traffic and weather execution
- [x] Add ETL metadata logging for pipeline runs
- [x] Add basic data quality checks logging
- [x] Improve test structure with stronger DB and pipeline integration coverage

### Route Intelligence

- [x] Create route reference data model and load flow
- [x] Create route-level Gold summary module and validation
- [x] Create route hourly reporting module and validation
- [x] Create routes report API endpoint
- [x] Create routes hourly API endpoint

### Events and History

- [x] Create mock or initial traffic event ingestion layer
- [x] Create event load flow into Bronze and Silver
- [x] Create map events API endpoint
- [x] Create simplified ride history data model and load flow
- [x] Create ride history API endpoint

### Advanced Analytics

- [x] Create top congested segments Gold module and validation
- [x] Create richer route summary metrics for reports
- [x] Create serving-ready analytical outputs for app consumption

### Mobile App Expansion

- [x] Expand mobile app navigation for route-focused experience
- [x] Create Route Report screen connected to new route endpoints
- [x] Create Ride History screen connected to history endpoint
- [x] Add Events view to mobile app
- [x] Improve app UI for stronger product realism

### Deployment and Final Maturity

- [x] Add Docker support for backend services
- [x] Prepare AWS-oriented deployment structure and documentation
- [x] Define local vs deployable environment separation
- [x] Create serving-layer views optimized for frontend and API usage
- [x] Optimize analytical queries used by endpoints
- [x] Improve API response shaping for mobile consumption
- [x] Add scheduler strategy for recurring pipeline runs
- [x] Finalize deployable cloud workflow
- [x] Finalize secrets and config handling strategy
- [x] Create final architecture diagram and technical walkthrough
- [x] Create final recruiter/demo narrative for Traffiq
- [x] Finalize repository presentation, docs, and demo flow
