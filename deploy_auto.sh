#!/bin/bash
# Automated Google Cloud Deployment Script (Auto-generated)
# For tuempresainternacional.com

set -e  # Exit on error

echo "🚀 Starting AUTOMATED Google Cloud Deployment for TEI MLM"
echo "=========================================================="
echo ""

# Configuration
PROJECT_ID="tei-mlm-prod"
REGION="southamerica-east1"
DB_INSTANCE="mlm-db"
DB_NAME="tiendavirtual"
BACKEND_SERVICE="mlm-backend"
FRONTEND_BUCKET="tuempresainternacional-frontend"
DB_PASSWORD="AdminPostgres2025" # Injected Password

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating/Configuring Google Cloud Project${NC}"
# Added -q for quiet mode
gcloud projects create $PROJECT_ID --name="TEI MLM Production" -q || echo "Project may already exist"
gcloud config set project $PROJECT_ID -q
echo -e "${GREEN}✓ Project configured${NC}"
echo ""

echo -e "${YELLOW}Step 2: Enabling Required APIs${NC}"
gcloud services enable run.googleapis.com -q
gcloud services enable sql-component.googleapis.com -q
gcloud services enable sqladmin.googleapis.com -q
gcloud services enable storage.googleapis.com -q
gcloud services enable cloudresourcemanager.googleapis.com -q
echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

echo -e "${YELLOW}Step 3: Creating Cloud SQL Database${NC}"
echo "Using provided database password..."
echo ""

gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=$DB_PASSWORD \
  -q || echo "Instance may already exist. NOTE: Password update skipped if instance exists."

gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE -q || echo "Database may already exist"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
echo -e "${GREEN}✓ Database created${NC}"
echo "Connection name: $CONNECTION_NAME"
echo ""

echo -e "${YELLOW}Step 4: Deploying Backend to Cloud Run${NC}"
cd backend

gcloud run deploy $BACKEND_SERVICE \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="CLOUD_SQL_CONNECTION_NAME=$CONNECTION_NAME" \
  --set-env-vars="DB_USER=postgres" \
  --set-env-vars="DB_PASS=$DB_PASSWORD" \
  --set-env-vars="DB_NAME=$DB_NAME" \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --port=8000 \
  -q

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
echo -e "${GREEN}✓ Backend deployed${NC}"
echo "Backend URL: $BACKEND_URL"
echo ""

cd ..

echo -e "${YELLOW}Step 5: Building and Deploying Frontend${NC}"
cd frontend

# Create production env file
echo "VITE_API_BASE=$BACKEND_URL" > .env.production

# Build
echo "Building frontend..."
npm run build

# Create bucket
gsutil mb -l $REGION gs://$FRONTEND_BUCKET || echo "Bucket may already exist"

# Make public
gsutil iam ch allUsers:objectViewer gs://$FRONTEND_BUCKET

# Upload files
# gsutil rsync doesn't have a -q equivalent that works exactly the same in all versions, but default is usually fine.
# Adding -q to gsutil commands where supported/needed.
gsutil -m rsync -r dist/ gs://$FRONTEND_BUCKET

# Configure website
gsutil web set -m index.html -e index.html gs://$FRONTEND_BUCKET

# Set CORS
echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://$FRONTEND_BUCKET
rm cors.json

echo -e "${GREEN}✓ Frontend deployed${NC}"
echo "Frontend URL: https://storage.googleapis.com/$FRONTEND_BUCKET/index.html"
echo ""

cd ..

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================================"
