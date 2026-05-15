pipeline {
    agent { label 'agent1' }

    environment {
        DOMAIN          = credentials('typikon-domain')
        ADMIN_API_KEY   = credentials('typikon-admin-api-key')
        DB_PASSWORD     = credentials('typikon-db-password')
        CORS_ORIGINS    = credentials('typikon-cors-origins')
        TRAEFIK_ENTRYPOINT = 'websecure'
        TAG             = "${env.BUILD_NUMBER}"
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
                    export TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT}
                    export TAG=${TAG}
                    docker compose up -d --build --force-recreate
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