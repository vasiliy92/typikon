pipeline {
    agent { label 'agent1' }

    environment {
        DOMAIN            = credentials('typikon-domain')
        ADMIN_API_KEY     = credentials('typikon-admin-api-key')
        DB_PASSWORD       = credentials('typikon-db-password')
        CORS_ORIGINS      = credentials('typikon-cors-origins')
        SUPERADMIN_EMAIL  = credentials('typikon-superadmin-email')
        SUPERADMIN_PASSWORD = credentials('typikon-superadmin-password')
        TRAEFIK_ENTRYPOINT = 'websecure'
        TAG               = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'docker build -t typikon-backend:latest -t typikon-backend:${TAG} ./backend'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker build -t typikon-frontend:latest -t typikon-frontend:${TAG} ./frontend'
                    }
                }
                stage('Nginx') {
                    steps {
                        sh 'docker build -t typikon-nginx:latest -t typikon-nginx:${TAG} ./nginx'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    export DOMAIN=${DOMAIN}
                    export ADMIN_API_KEY=${ADMIN_API_KEY}
                    export POSTGRES_PASSWORD=${DB_PASSWORD}
                    export CORS_ORIGINS=${CORS_ORIGINS}
                    export SUPERADMIN_EMAIL=${SUPERADMIN_EMAIL}
                    export SUPERADMIN_PASSWORD=${SUPERADMIN_PASSWORD}
                    export TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT}
                    export TAG=${TAG}
                    docker compose up -d --build --force-recreate
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    echo "Waiting for services to become healthy..."
                    MAX_WAIT=120
                    ELAPSED=0
                    while [ $ELAPSED -lt $MAX_WAIT ]; do
                        BACKEND=$(docker inspect --format="{{.State.Health.Status}}" typikon-backend-1 2>/dev/null || echo "missing")
                        NGINX=$(docker inspect --format="{{.State.Health.Status}}" typikon-nginx-1 2>/dev/null || echo "missing")
                        echo "  backend=$BACKEND nginx=$NGINX (${ELAPSED}s)"
                        if [ "$BACKEND" = "healthy" ] && [ "$NGINX" = "healthy" ]; then
                            echo "All services healthy!"
                            break
                        fi
                        sleep 5
                        ELAPSED=$((ELAPSED + 5))
                    done

                    if [ $ELAPSED -ge $MAX_WAIT ]; then
                        echo "ERROR: Services did not become healthy within ${MAX_WAIT}s"
                        docker compose logs --tail=50
                        exit 1
                    fi

                    echo "Running API health check..."
                    docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())" || true
                '''
            }
        }
    }

    post {
        always {
            script {
                def status = currentBuild.currentResult
                def emoji = status == 'SUCCESS' ? '✅' : status == 'FAILURE' ? '❌' : '⚠️'
                def duration = currentBuild.durationString.replace(' and counting', '')
                def buildInfo = """
${emoji} *Typikon* — #${currentBuild.number}
━━━━━━━━━━━━━━━━━━━━
📌 Status: *${status}*
🕐 Started: ${new Date(currentBuild.startTimeInMillis).format('dd.MM.yyyy HH:mm:ss')}
⏱ Duration: ${duration}
━━━━━━━━━━━━━━━━━━━━
🔗 [Open in Jenkins](${env.BUILD_URL})
                """.trim()
                telegramSend(message: buildInfo)
            }
        }
    }
}