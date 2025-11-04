#!/bin/bash

# Production Deployment Script for HR Software
# This script handles deployment to production environment

set -euo pipefail

# Configuration
PROJECT_NAME="hr-software"
DOCKER_REGISTRY="your-registry.com" # Update with your registry
VERSION_FILE="./VERSION"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if required files exist
    if [[ ! -f "docker-compose.yml" ]]; then
        error "docker-compose.yml not found"
    fi
    
    if [[ ! -f ".env.production" ]]; then
        warning ".env.production not found, make sure environment variables are set"
    fi
    
    success "Prerequisites check completed"
}

# Get version
get_version() {
    if [[ -f "$VERSION_FILE" ]]; then
        VERSION=$(cat "$VERSION_FILE")
    else
        VERSION="1.0.0"
        echo "$VERSION" > "$VERSION_FILE"
    fi
    
    # Add timestamp for unique builds
    BUILD_NUMBER=$(date +%Y%m%d%H%M%S)
    FULL_VERSION="${VERSION}-${BUILD_NUMBER}"
    
    info "Deployment version: $FULL_VERSION"
}

# Backup current deployment
backup_deployment() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if using local PostgreSQL
    if docker ps | grep -q postgres; then
        BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec postgres_container pg_dump -U postgres hr_software > "$BACKUP_FILE"
        success "Database backup created: $BACKUP_FILE"
    fi
    
    # Backup current docker-compose state
    if docker-compose ps | grep -q Up; then
        docker-compose config > "$BACKUP_DIR/docker-compose-backup-$(date +%Y%m%d_%H%M%S).yml"
        success "Docker Compose configuration backed up"
    fi
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Set build arguments
    export DOCKER_BUILDKIT=1
    
    # Build backend image
    info "Building backend image..."
    docker build \
        --tag "${PROJECT_NAME}-backend:${FULL_VERSION}" \
        --tag "${PROJECT_NAME}-backend:latest" \
        --build-arg VERSION="$FULL_VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        ./backend
    
    # Build frontend image
    info "Building frontend image..."
    docker build \
        --tag "${PROJECT_NAME}-frontend:${FULL_VERSION}" \
        --tag "${PROJECT_NAME}-frontend:latest" \
        --build-arg VERSION="$FULL_VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        ./frontend
    
    success "Docker images built successfully"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    if [[ -d "./backend/tests" ]]; then
        info "Running backend tests..."
        docker run --rm \
            -v "$(pwd)/backend:/app" \
            "${PROJECT_NAME}-backend:latest" \
            npm test
    fi
    
    # Frontend tests (if any)
    if [[ -f "./frontend/package.json" ]] && grep -q '"test"' ./frontend/package.json; then
        info "Running frontend tests..."
        docker run --rm \
            -v "$(pwd)/frontend:/app" \
            "${PROJECT_NAME}-frontend:latest" \
            npm test
    fi
    
    success "Tests completed successfully"
}

# Security scan
security_scan() {
    log "Running security scans..."
    
    # Scan Docker images for vulnerabilities (if trivy is available)
    if command -v trivy &> /dev/null; then
        info "Scanning backend image for vulnerabilities..."
        trivy image "${PROJECT_NAME}-backend:latest"
        
        info "Scanning frontend image for vulnerabilities..."
        trivy image "${PROJECT_NAME}-frontend:latest"
    else
        warning "Trivy not installed, skipping vulnerability scan"
    fi
    
    success "Security scan completed"
}

# Deploy application
deploy() {
    log "Starting deployment..."
    
    # Load production environment
    if [[ -f ".env.production" ]]; then
        set -a
        source .env.production
        set +a
        info "Production environment loaded"
    fi
    
    # Stop current deployment gracefully
    if docker-compose ps | grep -q Up; then
        info "Stopping current deployment..."
        docker-compose down --timeout 30
    fi
    
    # Start new deployment
    info "Starting new deployment..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check backend health
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health &> /dev/null; then
            success "Backend service is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "Backend service failed to start"
        fi
        sleep 2
    done
    
    # Check frontend health
    for i in {1..30}; do
        if curl -f http://localhost/health &> /dev/null; then
            success "Frontend service is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "Frontend service failed to start"
        fi
        sleep 2
    done
    
    success "Deployment completed successfully"
}

# Run database migrations (if any)
run_migrations() {
    log "Running database migrations..."
    
    if [[ -d "./database/migrations" ]]; then
        # Run migrations using the backend container
        docker-compose exec backend npm run migrate
        success "Database migrations completed"
    else
        info "No migrations to run"
    fi
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove old images (keep last 3 versions)
    docker images "${PROJECT_NAME}-backend" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi
    
    docker images "${PROJECT_NAME}-frontend" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi
    
    # Remove unused volumes and networks
    docker system prune -f --volumes
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Find the latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/docker-compose-backup-*.yml | head -n1)
    
    if [[ -f "$LATEST_BACKUP" ]]; then
        info "Rolling back to: $LATEST_BACKUP"
        docker-compose -f "$LATEST_BACKUP" up -d
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Check all services are running
    if ! docker-compose ps | grep -q "Up"; then
        error "Some services are not running"
    fi
    
    # Run basic API tests
    if curl -f http://localhost:3001/api/health | grep -q "OK"; then
        success "Backend API is responding"
    else
        error "Backend API is not responding correctly"
    fi
    
    # Check frontend
    if curl -f http://localhost/ | grep -q "DOCTYPE html"; then
        success "Frontend is serving correctly"
    else
        error "Frontend is not serving correctly"
    fi
    
    success "Deployment verification completed"
}

# Send notifications
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification (if webhook is configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 HR Software Deployment\\n*Status:* $status\\n*Message:* $message\\n*Version:* $FULL_VERSION\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Email notification (if configured)
    if command -v mail &> /dev/null && [[ -n "${NOTIFY_EMAIL:-}" ]]; then
        echo "$message" | mail -s "HR Software Deployment: $status" "$NOTIFY_EMAIL"
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log "Starting HR Software deployment process"
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            get_version
            backup_deployment
            build_images
            run_tests
            security_scan
            deploy
            run_migrations
            verify_deployment
            cleanup
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            success "Deployment completed successfully in ${duration} seconds"
            send_notification "SUCCESS" "Deployment completed successfully in ${duration} seconds"
            ;;
            
        "rollback")
            rollback
            verify_deployment
            send_notification "ROLLBACK" "Rollback completed successfully"
            ;;
            
        "backup")
            backup_deployment
            ;;
            
        "build")
            get_version
            build_images
            ;;
            
        "test")
            run_tests
            ;;
            
        *)
            echo "Usage: $0 {deploy|rollback|backup|build|test}"
            echo "  deploy   - Full deployment process (default)"
            echo "  rollback - Rollback to previous deployment"
            echo "  backup   - Create backup only"
            echo "  build    - Build images only"
            echo "  test     - Run tests only"
            exit 1
            ;;
    esac
}

# Trap errors and send failure notification
trap 'send_notification "FAILED" "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"