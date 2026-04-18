# Local Setup

## Purpose

This file explains everything required to run Traffiq on a new device.

It must be updated whenever the project gains:

- a new dependency
- a new environment variable
- a new database object
- a new startup command
- a new required local tool

## 1. Required Software

Install these on every device:

- Git
- Python
- Node.js
- PostgreSQL
- Visual Studio Code
- Expo Go on your Android phone

Optional later:

- Android Studio

## 2. Clone the Repository

```powershell
git clone https://github.com/AlexandruBocanci/Traffiq.git
cd Traffiq
```

## 3. Bootstrap Local Dependencies

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_local.ps1
```

This script will:

- create `.venv` if missing
- install backend Python dependencies from `requirements.txt`
- install mobile dependencies inside `mobile/`
- check whether core local tools are available

## 4. Python Backend Dependencies

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

Install project packages:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Current core packages expected by the project:

- pandas
- psycopg
- fastapi
- uvicorn
- requests
- python-dotenv

## 5. PostgreSQL Setup

PostgreSQL must be installed locally.

Create the project database:

```sql
CREATE DATABASE traffiq;
```

Run DDL from the repository root:

```powershell
psql -U postgres -d traffiq -f sql/ddl/create_all.sql
```

## 6. Environment Configuration

The current project still uses hardcoded DB settings in:

- `src/config/settings.py`

Later this should move to a `.env` file.

Expected variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Recommended values for local setup:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=traffiq`

## 7. Running the Backend API

From the repository root:

```powershell
uvicorn src.api.main:app --reload --host 0.0.0.0
```

## 8. Running the Mobile App

Go into the mobile workspace:

```powershell
cd mobile
npm.cmd start
```

Then:

- open Expo Go on your Android phone
- scan the QR code
- make sure the phone and the PC are on the same Wi-Fi network

## 9. Current Database Notes

- tutorial database `traffic_learning` is not the project database
- the real project database is `traffiq`
- all new project work must target `traffiq`

## 10. What Will Not Sync Through Git

Git does not sync:

- installed Node.js
- installed Expo Go
- installed PostgreSQL server
- local PostgreSQL databases
- Python packages installed globally
- environment variables
- passwords
- local secrets

That means a second device must always:

1. install the tools
2. clone the repo
3. run the bootstrap script or install backend/mobile dependencies manually
4. create the PostgreSQL database
5. run the SQL DDL scripts
6. configure environment variables later when the project moves to `.env`

## 11. Recommended Setup Workflow On a New Device

1. Clone the repo
2. Run `setup_local.ps1`
3. Create database `traffiq`
4. Run `sql/ddl/create_all.sql`
5. Start the API
6. Start the mobile app

## 12. Maintenance Rule

Whenever the project changes in a way that affects setup, update this file in the same branch before merging to `main`.
