# Core Components

This directory contains the core functionality of the database management system.

## Structure

-   `controller/`: Contains the main controller classes for the API and database operations
    -   `api_extension.py`: Implements the Flask API routes
    -   `controller.py`: Defines the abstract base class for controllers
    -   `postgresql_controller.py`: Implements PostgreSQL-specific operations
-   `dbconnector.py`: Handles database connections and query execution
-   `staging.py`: Manages the staging and transformation configurations
-   `utils.py`: Utility functions for data processing and validation

## Key Components

### PostgreSQLController

The main controller class that implements database operations such as table creation, data insertion, and query execution.

### APIExtension

Extends the PostgreSQLController with RESTful API endpoints using Flask.

### DBConnector

Abstracts database connection and query execution, with a specific implementation for PostgreSQL.

### StageConfiguration

Represents and processes staging configurations for data transformations.

## Extending the System

To add support for new databases or features:

1. Implement a new controller class inheriting from `AbstractController`
2. Create a new connector class inheriting from `DBConnector`
3. Update the API extension to include new endpoints if necessary

Refer to the existing implementations as examples.
