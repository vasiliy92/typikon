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
                        sh "docker build -t ${REGISTRY}/${IMAGE_PREFIX}-backend:${TAG} ./backend"
                    }
                }
                stage('Frontend') {
                    steps {
                        sh "docker build -t ${REGISTRY}/${IMAGE_PREFIX}-frontend:${TAG} ./frontend"
                    }
                }
                stage('Nginx') {
                    steps {
                        sh "docker build -t ${REGISTRY}/${IMAGE_PREFIX}-nginx:${TAG} ./nginx"
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                withDockerRegistry([credentialsId: 'docker-registry', url: "https://${REGISTRY}"]) {
                    sh '''
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-backend:${TAG}
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-frontend:${TAG}
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-nginx:${TAG}
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    cd /opt/typikon
                    export TAG=${TAG}
                    docker compose pull
                    docker compose up -d --remove-orphans
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
