# Step-by-Step Guide to Run Database Migrations

## Prerequisites
- Cloud SQL Proxy installed
- Database password from deployment

## Step 1: Download Cloud SQL Proxy

Download for Windows:
https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.x64.exe

Save it to: C:\Users\mahac\cloud-sql-proxy.exe

## Step 2: Start Cloud SQL Proxy

Open a NEW PowerShell terminal and run:

```powershell
C:\Users\mahac\cloud-sql-proxy.exe tei-mlm-prod:southamerica-east1:mlm-db
```

Leave this terminal open! The proxy needs to keep running.

## Step 3: Run Migrations

In ANOTHER PowerShell terminal, navigate to backend:

```powershell
cd c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend

# Activate virtual environment
& c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/Activate.ps1

# Set database URL (replace YOUR_PASSWORD with your actual password)
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/tiendavirtual"

# Run migrations
python run_migrations.py
```

## Step 4: Verify Tables Created

You should see output like:
```
✅ All tables created successfully!

📋 Tables created:
   - users
   - products
   - orders
   - commissions
   - binary_global_members
   - unilevel_members
   ... etc
```

## Step 5: Create Admin User

After migrations complete, create admin user:

```powershell
python create_admin.py
```

## Troubleshooting

### Cloud SQL Proxy won't start
- Make sure you're authenticated: `gcloud auth login`
- Verify project is set: `gcloud config set project tei-mlm-prod`

### Connection refused
- Make sure Cloud SQL Proxy is running in another terminal
- Check that the database password is correct

### Tables already exist
- This is OK! The script will skip existing tables
