pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
            bat 'docker-compose logs --no-color'
        }
    }
}