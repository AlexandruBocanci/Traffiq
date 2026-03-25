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
- PostgreSQL
- Visual Studio Code

## 2. Clone the Repository

```powershell
git clone https://github.com/AlexandruBocanci/Trafiq.git
cd Trafiq
```

## 3. Python Dependencies

Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install project packages after `requirements.txt` exists:

```powershell
python -m pip install -r requirements.txt
```

Current core packages expected by the project:

- pandas
- psycopg
- fastapi
- uvicorn
- requests
- python-dotenv

## 4. PostgreSQL Setup

PostgreSQL must be installed locally.

Create the project database:

```sql
CREATE DATABASE traffiq;
```

Run DDL from the repository root:

```powershell
psql -U postgres -d traffiq -f sql/ddl/create_all.sql
```

## 5. Environment Configuration

Later this project should use a `.env` file.

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

## 6. Current Database Notes

- tutorial database `traffic_learning` is not the project database
- the real project database is `traffiq`
- all new project work must target `traffiq`

## 7. Running the Project

These commands will be updated as the project grows.

### Run DDL

```powershell
psql -U postgres -d traffiq -f sql/ddl/create_all.sql
```

### Run FastAPI

From the directory that contains `main.py`:

```powershell
uvicorn main:app --reload
```

This command will be updated later to match the final project structure.

## 8. What Will Not Sync Through Git

Git does not sync:

- installed PostgreSQL server
- local PostgreSQL databases
- Python packages installed globally
- environment variables
- passwords
- local secrets

That means a second device must always:

1. install the tools
2. clone the repo
3. install Python dependencies
4. create the PostgreSQL database
5. run the SQL DDL scripts
6. configure environment variables

## 9. Recommended Setup Workflow On a New Device

1. Clone the repo
2. Create and activate virtual environment
3. Install Python dependencies
4. Install PostgreSQL if missing
5. Create database `traffiq`
6. Run `sql/ddl/create_all.sql`
7. Configure environment variables
8. Start the pipeline or API

## 10. Maintenance Rule

Whenever the project changes in a way that affects setup, update this file in the same branch before merging to `main`.
