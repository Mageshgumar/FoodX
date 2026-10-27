pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Docker') {
            steps {
                bat '''
                    @echo off
                    docker info >nul 2>&1
                    if errorlevel 1 (
                        echo Docker is not available to Jenkins. Start Docker Desktop and ensure the Jenkins service can access the Docker engine.
                        exit /b 1
                    )
                    docker buildx version >nul 2>&1
                    if errorlevel 1 (
                        echo Docker Buildx is required by Docker Compose builds but is not available to Jenkins.
                        exit /b 1
                    )
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker-compose build'
            }
        }

        stage('Start FoodX') {
            steps {
                bat 'docker-compose up -d'
            }
        }

        stage('Wait for Services') {
            steps {
                sleep 15
            }
        }

        stage('Health Check') {
            steps {
                bat 'powershell -NoProfile -Command "$response = Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing; if ($response.StatusCode -ne 200) { exit 1 }"'
            }
        }
    }

    post {
        success {
            echo 'FoodX was built and started successfully.'
        }

        failure {
            bat '''
                @echo off
                docker info >nul 2>&1
                if errorlevel 1 (
                    echo Skipping Docker logs because the Docker daemon is unavailable.
                    exit /b 0
                )
                docker-compose logs --no-color
                exit /b 0
            '''
        }
    }
}