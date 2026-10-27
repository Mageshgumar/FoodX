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
                    docker-compose version >nul 2>&1
                    if errorlevel 1 (
                        echo Docker Compose is not available to Jenkins.
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

        stage('Show Service Status') {
            steps {
                bat 'docker-compose ps'
            }
        }

        stage('Health Check') {
            steps {
                bat '''
                    powershell -NoProfile -Command "$ErrorActionPreference = 'Stop'; $url = 'http://localhost:5000/api/health'; for ($attempt = 1; $attempt -le 12; $attempt++) { try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host ('Health check passed on attempt ' + $attempt); exit 0 } } catch { Write-Host ('Health check attempt ' + $attempt + ' failed: ' + $_.Exception.Message) }; Start-Sleep -Seconds 5 }; Write-Error ('Health check failed after ' + $attempt + ' attempts'); docker-compose logs --no-color backend; exit 1"
                '''
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