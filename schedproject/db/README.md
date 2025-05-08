# Database Management and Transformation System (ETLDBMS)

## Project Overview

This project is database management and transformation system built with Python, Flask, and PostgreSQL. It provides an API for creating tables, inserting data, and performing data transformations between raw data sources and data warehouses.

## Key Features

- RESTful API for database operations
- Dynamic table creation from JSON data
- Data insertion with structure validation
- Complex data transformations using staging configurations
- Support for CSV, TSV, and SQL file processing
- View and table associations for efficient data access
- Query execution across raw and warehouse databases

## Project Structure

```
db/
├── core/
│   ├── controller/
│   │   ├── api_extension.py
│   │   ├── controller.py
│   │   └── postgresql_controller.py
│   ├── dbconnector.py
│   ├── staging.py
│   └── utils.py
├── staging/
├── Dockerfile
├── README.md
├── app.py
├── docker-compose.yml
├── requirements.txt
└── staging_order.lp
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.12+

### Installation

1. Clone the repository:

    ```
    git clone https://github.com/owrel/ETLDBMS
    cd ETLDBMS
    ```

2. Build and run the Docker containers:

    ```
    docker-compose up --build
    ```

3. The API will be available at `http://localhost:5000`

## Usage

### API Endpoints

- `/create_table/fromjson/<table_name>` (POST): Create a new table from JSON data
- `/insert/fromjson/<table_name>` (POST): Insert data into an existing table
- `/data_transformation` (GET): Perform data transformations based on staging configurations
- `/query/<database>` (POST): Execute custom SQL queries on raw or warehouse databases

### Example: Creating a Table

```bash
curl -X POST http://localhost:5000/create_table/fromjson/users \
     -H "Content-Type: application/json" \
     -d '[{"name": "John Doe", "age": 30}, {"name": "Jane Smith", "age": 25}]'
```

## Configuration

### Staging Configuration

Data transformations are defined using TOML configuration files in the `staging/` directory. These files specify the data sources, transformation steps, and target data marts.

Example `staging/user_transform.toml`:

```toml
[MAIN]
name = "user_transform"
version = "0.0.1"
workdir = "./staging"

[DATASOURCES]
tables = ["raw_users"]
views = []

[STAGING]
files = ["user_cleanup.sql", "user_enrich.csv"]

[DATAMARTS]
views = ["clean_users", "enriched_users"]
```
