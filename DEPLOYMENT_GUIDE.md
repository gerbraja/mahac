# Google Cloud Deployment Guide - tuempresainternacional.com

## Prerequisites Checklist
- [x] Google Cloud account with billing enabled
- [x] gcloud CLI installed
- [x] Domain: tuempresainternacional.com
- [x] Region selected: southamerica-east1 (São Paulo)

## Step 1: Initialize Google Cloud Project

```bash
# Set project ID
export PROJECT_ID="tei-mlm-prod"

# Create new project
gcloud projects create $PROJECT_ID --name="TEI MLM Production"

# Set as active project
gcloud config set project $PROJECT_ID

# Enable billing (do this in Cloud Console)
# https://console.cloud.google.com/billing

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

## Step 2: Create Cloud SQL Database

```bash
# Create PostgreSQL instance
gcloud sql instances create mlm-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=southamerica-east1 \
  --root-password=[CHOOSE_SECURE_PASSWORD]

# Create database
gcloud sql databases create tiendavirtual --instance=mlm-db

# Get connection name (save this!)
gcloud sql instances describe mlm-db --format='value(connectionName)'
# Output will be: PROJECT_ID:southamerica-east1:mlm-db
```

## Step 3: Deploy Backend to Cloud Run

```bash
# Navigate to backend directory
cd backend

# Deploy to Cloud Run
gcloud run deploy mlm-backend \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars="CLOUD_SQL_CONNECTION_NAME=PROJECT_ID:southamerica-east1:mlm-db" \
  --set-env-vars="DB_USER=postgres" \
  --set-env-vars="DB_PASS=[YOUR_DB_PASSWORD]" \
  --set-env-vars="DB_NAME=tiendavirtual" \
  --add-cloudsql-instances=PROJECT_ID:southamerica-east1:mlm-db \
  --port=8000

# Save the backend URL that's displayed
# Example: https://mlm-backend-xxxxx-rj.a.run.app
```

## Step 4: Run Database Migrations

```bash
# Install Cloud SQL Proxy
# Windows: Download from https://cloud.google.com/sql/docs/postgres/sql-proxy
# Or use: gcloud components install cloud-sql-proxy

# Start Cloud SQL Proxy (in a separate terminal)
cloud-sql-proxy PROJECT_ID:southamerica-east1:mlm-db

# In another terminal, run migrations
cd backend
export DATABASE_URL="postgresql://postgres:[PASSWORD]@127.0.0.1:5432/tiendavirtual"
alembic upgrade head

# Or if no alembic, create tables manually
python -c "from database.connection import Base, engine; Base.metadata.create_all(engine)"
```

## Step 5: Create Admin User in Production

```bash
# Connect to Cloud SQL
gcloud sql connect mlm-db --user=postgres --database=tiendavirtual

# In PostgreSQL prompt, create admin user
INSERT INTO users (username, email, password_hash, is_admin, status, name) 
VALUES ('admin', 'admin@tuempresainternacional.com', '[HASHED_PASSWORD]', true, 'active', 'Administrador');
```

## Step 6: Build and Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Update API URL in .env.production
echo "VITE_API_BASE=https://mlm-backend-xxxxx-rj.a.run.app" > .env.production

# Build production bundle
npm run build

# Create Cloud Storage bucket
gsutil mb -l southamerica-east1 gs://tuempresainternacional-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://tuempresainternacional-frontend

# Upload files
gsutil -m rsync -r dist/ gs://tuempresainternacional-frontend

# Set main page and error page
gsutil web set -m index.html -e index.html gs://tuempresainternacional-frontend

# Enable CORS
echo '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://tuempresainternacional-frontend
```

## Step 7: Configure Custom Domain

### For Backend (Cloud Run)

```bash
# Map custom domain to Cloud Run
gcloud run domain-mappings create \
  --service mlm-backend \
  --domain api.tuempresainternacional.com \
  --region southamerica-east1

# Follow instructions to add DNS records
```

### For Frontend (Cloud Storage)

```bash
# Create load balancer and map domain
# This requires Cloud Console - follow these steps:
# 1. Go to Cloud Console > Network Services > Load Balancing
# 2. Create HTTPS Load Balancer
# 3. Backend: Cloud Storage bucket
# 4. Frontend: tuempresainternacional.com
# 5. SSL Certificate: Auto-provision
```

## Step 8: Update DNS Records

Add these records to your domain registrar:

```
# For frontend
Type: A
Name: @
Value: [LOAD_BALANCER_IP]

# For backend API
Type: CNAME
Name: api
Value: ghs.googlehosted.com
```

## Step 9: Verification

```bash
# Test backend
curl https://api.tuempresainternacional.com/

# Test frontend
curl https://tuempresainternacional.com

# Test login
curl -X POST https://api.tuempresainternacional.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"[PASSWORD]"}'
```

## Cost Summary

**Monthly costs (southamerica-east1):**
- Cloud SQL (db-f1-micro): ~$7-9
- Cloud Run (backend): ~$0-5 (free tier)
- Cloud Storage (frontend): ~$0.01-0.50
- Load Balancer (optional): ~$18-25
- **Total without LB: ~$7-14/month**
- **Total with LB: ~$25-39/month**

## Troubleshooting

### Backend won't start
```bash
# Check logs
gcloud run services logs read mlm-backend --region southamerica-east1 --limit 50
```

### Database connection fails
```bash
# Verify Cloud SQL instance is running
gcloud sql instances list

# Check connection name
gcloud sql instances describe mlm-db
```

### Frontend 404 errors
```bash
# Verify files uploaded
gsutil ls gs://tuempresainternacional-frontend

# Check bucket permissions
gsutil iam get gs://tuempresainternacional-frontend
```

## Next Steps

1. Set up automated backups for Cloud SQL
2. Configure monitoring and alerts
3. Set up CI/CD pipeline
4. Enable Cloud CDN for frontend
5. Configure rate limiting
