#!/bin/bash

# Health Check Script for HR Software
# Monitors application health and sends alerts if issues are detected

set -euo pipefail

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost"
LOG_FILE="/var/log/hr-software/health-check.log"
ALERT_THRESHOLD=3
STATE_FILE="/tmp/hr-software-health-state"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if service is responding
check_http_endpoint() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check database connectivity through backend API
check_database() {
    local response
    response=$(curl -s --max-time 10 "$BACKEND_URL/api/health" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "OK"; then
        return 0
    else
        return 1
    fi
}

# Check Docker containers
check_docker_containers() {
    local failed_containers=()
    
    # Check if containers are running
    while IFS= read -r container; do
        if [[ -n "$container" ]]; then
            if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "Up.*$container"; then
                failed_containers+=("$container")
            fi
        fi
    done <<< "$(docker-compose ps --services 2>/dev/null || echo "")"
    
    if [[ ${#failed_containers[@]} -eq 0 ]]; then
        return 0
    else
        error "Failed containers: ${failed_containers[*]}"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    local cpu_usage disk_usage memory_usage
    
    # CPU usage
    cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
    
    # Disk usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    # Memory usage
    memory_usage=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//' || echo "0")
    
    # Check thresholds
    if [[ ${cpu_usage%.*} -gt 80 ]]; then
        warning "High CPU usage: ${cpu_usage}%"
    fi
    
    if [[ $disk_usage -gt 85 ]]; then
        warning "High disk usage: ${disk_usage}%"
    fi
    
    log "System resources - CPU: ${cpu_usage}%, Disk: ${disk_usage}%, Memory info logged"
    return 0
}

# Check SSL certificate (if HTTPS is configured)
check_ssl_certificate() {
    local domain=${1:-"dmhcahrms.xyz"}
    
    if command -v openssl &> /dev/null; then
        local expiry_date
        expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | \
                     openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || echo "")
        
        if [[ -n "$expiry_date" ]]; then
            local expiry_epoch
            expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            local current_epoch
            current_epoch=$(date +%s)
            local days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [[ $days_left -lt 30 ]]; then
                warning "SSL certificate expires in $days_left days"
                return 1
            else
                log "SSL certificate valid for $days_left days"
                return 0
            fi
        else
            warning "Could not check SSL certificate for $domain"
            return 1
        fi
    else
        warning "OpenSSL not available, skipping SSL check"
        return 0
    fi
}

# Get failure count from state file
get_failure_count() {
    local service=$1
    if [[ -f "$STATE_FILE" ]]; then
        grep "^$service:" "$STATE_FILE" 2>/dev/null | cut -d: -f2 || echo "0"
    else
        echo "0"
    fi
}

# Update failure count in state file
update_failure_count() {
    local service=$1
    local count=$2
    
    # Create state file if it doesn't exist
    touch "$STATE_FILE"
    
    # Update or add the service count
    if grep -q "^$service:" "$STATE_FILE"; then
        sed -i "" "s/^$service:.*/$service:$count/" "$STATE_FILE"
    else
        echo "$service:$count" >> "$STATE_FILE"
    fi
}

# Send alert
send_alert() {
    local service=$1
    local message=$2
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 HR Software Alert\\n*Service:* $service\\n*Issue:* $message\\n*Time:* $(date)\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Email notification
    if command -v mail &> /dev/null && [[ -n "${ALERT_EMAIL:-}" ]]; then
        echo "$message" | mail -s "HR Software Alert: $service" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Log alert
    error "ALERT SENT: $service - $message"
}

# Check service with failure tracking
check_service_with_tracking() {
    local service=$1
    local check_function=$2
    shift 2
    local args=("$@")
    
    if $check_function "${args[@]}"; then
        success "$service is healthy"
        update_failure_count "$service" 0
        return 0
    else
        local failure_count
        failure_count=$(get_failure_count "$service")
        failure_count=$((failure_count + 1))
        update_failure_count "$service" "$failure_count"
        
        error "$service check failed (failure count: $failure_count)"
        
        if [[ $failure_count -ge $ALERT_THRESHOLD ]]; then
            send_alert "$service" "Service has failed $failure_count consecutive health checks"
        fi
        
        return 1
    fi
}

# Performance metrics collection
collect_metrics() {
    local metrics_file="/var/log/hr-software/metrics-$(date +%Y-%m-%d).log"
    mkdir -p "$(dirname "$metrics_file")"
    
    # Collect basic metrics
    {
        echo "timestamp=$(date +%s)"
        echo "cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")"
        echo "disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')"
        echo "memory_info=$(vm_stat | head -5 | tr '\n' ' ')"
        
        # Docker container stats if available
        if command -v docker &> /dev/null; then
            echo "docker_stats=$(docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' 2>/dev/null | tail -n +2 || echo 'N/A')"
        fi
        
        # Application-specific metrics
        if curl -s "$BACKEND_URL/api/health" | grep -q "OK"; then
            echo "backend_status=UP"
            
            # Get database connection count (if available through API)
            # echo "db_connections=$(curl -s "$BACKEND_URL/api/metrics/db" 2>/dev/null | jq '.connections' || echo 'N/A')"
        else
            echo "backend_status=DOWN"
        fi
        
        if curl -s "$FRONTEND_URL/health" | grep -q "healthy"; then
            echo "frontend_status=UP"
        else
            echo "frontend_status=DOWN"
        fi
        
    } >> "$metrics_file"
}

# Main health check function
main() {
    log "Starting health check"
    
    local overall_status=0
    
    # Check backend API
    if ! check_service_with_tracking "backend" check_http_endpoint "$BACKEND_URL/api/health" "Backend API"; then
        overall_status=1
    fi
    
    # Check frontend
    if ! check_service_with_tracking "frontend" check_http_endpoint "$FRONTEND_URL/health" "Frontend"; then
        overall_status=1
    fi
    
    # Check database connectivity
    if ! check_service_with_tracking "database" check_database; then
        overall_status=1
    fi
    
    # Check Docker containers
    if ! check_service_with_tracking "containers" check_docker_containers; then
        overall_status=1
    fi
    
    # Check system resources
    if ! check_system_resources; then
        overall_status=1
    fi
    
    # Check SSL certificate (optional)
    if [[ "${CHECK_SSL:-false}" == "true" ]]; then
        check_service_with_tracking "ssl" check_ssl_certificate
    fi
    
    # Collect performance metrics
    collect_metrics
    
    if [[ $overall_status -eq 0 ]]; then
        success "All health checks passed"
    else
        warning "Some health checks failed"
    fi
    
    log "Health check completed"
    return $overall_status
}

# Handle command line arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "metrics")
        collect_metrics
        echo "Metrics collected"
        ;;
    "reset")
        rm -f "$STATE_FILE"
        echo "Health check state reset"
        ;;
    "status")
        if [[ -f "$STATE_FILE" ]]; then
            echo "Current failure counts:"
            cat "$STATE_FILE"
        else
            echo "No health check state found"
        fi
        ;;
    *)
        echo "Usage: $0 {check|metrics|reset|status}"
        echo "  check   - Run health checks (default)"
        echo "  metrics - Collect performance metrics only"
        echo "  reset   - Reset failure counters"
        echo "  status  - Show current failure counts"
        exit 1
        ;;
esac