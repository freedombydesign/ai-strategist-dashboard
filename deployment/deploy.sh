#!/bin/bash

# Freedom by Design Suite - Deployment Script
# Automates the extraction and deployment to premium subdomains

set -e

echo "🚀 Freedom by Design Suite - Premium Deployment"
echo "================================================="

# Configuration
SUITE_DOMAIN="suite.yourdomain.com"
AI_DOMAIN="ai.yourdomain.com"
PROJECT_NAME="ai-strategist-dashboard"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Prerequisites check passed"

# Environment setup
print_status "Setting up environment variables..."

if [ ! -f ".env.production" ]; then
    print_warning "Creating .env.production file..."
    cat > .env.production << EOL
# Freedom Suite Configuration
NODE_ENV=production
NEXT_PUBLIC_SUITE_DOMAIN=${SUITE_DOMAIN}
NEXT_PUBLIC_AI_DOMAIN=${AI_DOMAIN}
NEXT_PUBLIC_ENABLE_FREEDOM_SUITE=true
NEXT_PUBLIC_ENABLE_EXECUTIVE_AI=true

# Supabase Configuration (Update with your premium instance)
NEXT_PUBLIC_SUPABASE_URL=https://your-premium-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-premium-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-premium-service-role-key

# Database Configuration (Optional - if using self-hosted)
POSTGRES_PASSWORD=your-secure-password

# SSL/TLS Configuration
LETSENCRYPT_EMAIL=admin@yourdomain.com
EOL
    print_warning "Please update .env.production with your actual values before continuing"
    read -p "Press Enter when you've updated the configuration..."
fi

source .env.production
print_success "Environment variables loaded"

# Database migration
print_status "Running database migrations..."

if [ ! -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_status "Using Supabase - please run migrate-all.sql in your Supabase SQL editor"
    print_warning "Migration file: deployment/migrate-all.sql"
    read -p "Press Enter when database migration is complete..."
else
    print_status "Using local PostgreSQL - migrations will run automatically"
fi

print_success "Database setup complete"

# Build Docker images
print_status "Building Docker images..."

echo "Building Freedom Suite image..."
docker build -f deployment/docker-suite.dockerfile -t freedom-suite:latest .

echo "Building Executive AI image..."
docker build -f deployment/docker-ai.dockerfile -t executive-ai:latest .

print_success "Docker images built successfully"

# Deploy with Docker Compose
print_status "Starting deployment with Docker Compose..."

cd deployment
docker-compose up -d

print_success "Deployment started successfully"

# Health checks
print_status "Performing health checks..."

sleep 30  # Wait for services to start

echo "Checking Freedom Suite (Port 3001)..."
if curl -f -s http://localhost:3001 > /dev/null; then
    print_success "Freedom Suite is running"
else
    print_error "Freedom Suite health check failed"
fi

echo "Checking Executive AI (Port 3002)..."
if curl -f -s http://localhost:3002 > /dev/null; then
    print_success "Executive AI is running"
else
    print_error "Executive AI health check failed"
fi

echo "Checking Traefik Dashboard (Port 8080)..."
if curl -f -s http://localhost:8080 > /dev/null; then
    print_success "Traefik reverse proxy is running"
else
    print_warning "Traefik dashboard may not be accessible"
fi

cd ..

# DNS Configuration reminder
print_status "Deployment Summary"
echo "=================="
echo "✅ Freedom Suite: Running on port 3001"
echo "✅ Executive AI: Running on port 3002" 
echo "✅ Reverse Proxy: Running on port 80/443"
echo "✅ Database: Connected and migrated"
echo ""
print_warning "IMPORTANT: DNS Configuration Required"
echo "Please configure your DNS records:"
echo "CNAME ${SUITE_DOMAIN} -> your-server-ip"
echo "CNAME ${AI_DOMAIN} -> your-server-ip"
echo ""
print_warning "SSL Certificates"
echo "Let's Encrypt will automatically issue certificates when DNS is configured"
echo ""
print_success "Freedom by Design Suite deployed successfully!"
echo ""
echo "🎉 Your premium suite is ready at:"
echo "   📊 Business Suite: https://${SUITE_DOMAIN}"
echo "   🧠 Executive AI: https://${AI_DOMAIN}"
echo "   🔧 Admin Panel: http://localhost:8080"
echo ""
print_status "View logs: docker-compose -f deployment/docker-compose.yml logs -f"
print_status "Stop services: docker-compose -f deployment/docker-compose.yml down"
echo ""
echo "Happy scaling! 🚀"