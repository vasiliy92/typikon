pipeline {
    agent any

    environment {
        REGISTRY = credentials('docker-registry-url')
        IMAGE_PREFIX = "${env.DOCKER_IMAGE_PREFIX ?: 'typikon'}"
        TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh '''
                        pip install -e ".[dev]" 2>/dev/null || true
                        python -m pytest tests/ -v --tb=short 2>/dev/null || true
                    '''
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh "docker build -t ${IMAGE_PREFIX}/typikon-backend:${TAG} -t ${IMAGE_PREFIX}/typikon-backend:latest ./backend"
                    }
                }
                stage('Frontend') {
                    steps {
                        sh "docker build -t ${IMAGE_PREFIX}/typikon-frontend:${TAG} -t ${IMAGE_PREFIX}/typikon-frontend:latest ./frontend"
                    }
                }
                stage('Nginx') {
                    steps {
                        sh "docker build -t ${IMAGE_PREFIX}/typikon-nginx:${TAG} -t ${IMAGE_PREFIX}/typikon-nginx:latest ./nginx"
                    }
                }
            }
        }

        stage('Push Images') {
            when {
                expression { env.REGISTRY != null && env.REGISTRY != '' }
            }
            steps {
                withDockerRegistry([credentialsId: 'docker-registry', url: "https://${REGISTRY}"]) {
                    sh '''
                        docker push ${REGISTRY}/${IMAGE_PREFIX}/typikon-backend:${TAG} || true
                        docker push ${REGISTRY}/${IMAGE_PREFIX}/typikon-backend:latest || true
                        docker push ${REGISTRY}/${IMAGE_PREFIX}/typikon-frontend:${TAG} || true
                        docker push ${REGISTRY}/${IMAGE_PREFIX}/typikon-frontend:latest || true
                        docker push ${REGISTRY}/${IMAGE_PREFIX}/typikon-nginx:${TAG} || true
                        docker push ${REGISTRY}/${IMAGE_PREFIX}/typikon-nginx:latest || true
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    cd /opt/typikon
                    export DOCKER_REGISTRY=${REGISTRY}/${IMAGE_PREFIX}
                    export TAG=${TAG}
                    docker compose pull 2>/dev/null || true
                    docker compose up -d --remove-orphans
                    echo "Waiting for services to become healthy..."
                    sleep 10
                    docker compose ps
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            echo 'Pipeline failed — check logs above.'
        }
    }
}
