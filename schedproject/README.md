# SchedProject

## Installation Process

1. Clone the repository with submodules:

    ```
    git clone --recursive https://github.com/your-repo/SchedProject.git
    cd SchedProject
    ```

2. Ensure Docker and Docker Compose are installed on your system.

3. Obtain the API key file and place it in the `conf` folder of the project.

4. Run the Docker Compose file:

    ```
    docker-compose up
    ```

5. Access the application at http://localhost:8080

6. In the Utils endpoint category:
   a. Click on the "Populate Database" endpoint (this process takes about 10 minutes, you can look into the terminal iuf the process is going correctly)
   b. Once completed, click on the "Data Transformation" endpoint (takes about 10 seconds)

7. After these steps, the different Utils endpoints should work correctly.

## Architecture

![Architecture Diagram](ressources/architecture_diagram.png)
