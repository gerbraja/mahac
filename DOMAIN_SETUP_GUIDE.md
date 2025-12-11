# Complete Domain Setup Guide - tuempresainternacional.com

## Part 1: Backend API Domain (api.tuempresainternacional.com)

### Step 1: Map Domain in Cloud Console

1. **Go to Cloud Run:**
   https://console.cloud.google.com/run?project=tei-mlm-prod

2. **Click on `mlm-backend` service**

3. **Go to "DOMAIN MAPPINGS" tab** (at the top)

4. **Click "ADD MAPPING"**

5. **Enter domain:** `api.tuempresainternacional.com`

6. **Click "CONTINUE"**

7. **Google will show you DNS records to add.** Copy them (usually `ghs.googlehosted.com`)

### Step 2: Add DNS Record in Namecheap

1. **Log in to Namecheap:**
   https://www.namecheap.com

2. **Go to Domain List** → Click "Manage" next to `tuempresainternacional.com`

3. **Go to "Advanced DNS" tab**

4. **Click "ADD NEW RECORD"**

5. **Add this record:**
   ```
   Type: CNAME Record
   Host: api
   Value: ghs.googlehosted.com
   TTL: Automatic
   ```

6. **Click the green checkmark to save**

### Step 3: Wait and Verify

- Wait 15-30 minutes for DNS propagation
- Google will automatically provision SSL certificate
- Test: https://api.tuempresainternacional.com

---

## Part 2: Frontend Domain (tuempresainternacional.com)

### Step 1: Reserve Static IP

1. **Go to VPC Network → IP addresses:**
   https://console.cloud.google.com/networking/addresses/list?project=tei-mlm-prod

2. **Click "RESERVE EXTERNAL STATIC ADDRESS"**

3. **Configuration:**
   - Name: `tei-frontend-ip`
   - IP version: IPv4
   - Type: Global
   - Click "RESERVE"

4. **Copy the IP address** (e.g., 34.120.XX.XX)

### Step 2: Create Load Balancer

1. **Go to Load Balancing:**
   https://console.cloud.google.com/net-services/loadbalancing/list/loadBalancers?project=tei-mlm-prod

2. **Click "CREATE LOAD BALANCER"**

3. **Select "HTTP(S) Load Balancing"** → Click "START CONFIGURATION"

4. **Select:**
   - From Internet to my VMs or serverless services
   - Global HTTP(S) Load Balancer
   - Click "CONTINUE"

5. **Name:** `tei-frontend-lb`

### Step 3: Configure Backend

1. **Backend configuration:**
   - Click "Backend configuration"
   - Backend services & backend buckets → "CREATE A BACKEND BUCKET"

2. **Create backend bucket:**
   - Name: `tei-frontend-backend`
   - Cloud Storage bucket: `tuempresainternacional-frontend`
   - Enable Cloud CDN: ✓ (optional, recommended)
   - Click "CREATE"

### Step 4: Configure Frontend

1. **Frontend configuration:**
   - Click "Frontend configuration"
   - Click "ADD FRONTEND IP AND PORT"

2. **Configuration:**
   - Protocol: HTTPS
   - IP address: Select `tei-frontend-ip` (the one you created)
   - Port: 443
   - Certificate: "CREATE A NEW CERTIFICATE"

3. **Create SSL Certificate:**
   - Name: `tei-ssl-cert`
   - Create mode: "Create Google-managed certificate"
   - Domains: 
     - `tuempresainternacional.com`
     - `www.tuempresainternacional.com`
   - Click "CREATE"

4. **Add HTTP redirect (optional but recommended):**
   - Click "ADD FRONTEND IP AND PORT" again
   - Protocol: HTTP
   - IP address: Same `tei-frontend-ip`
   - Port: 80
   - Click "DONE"

### Step 5: Review and Create

1. **Click "REVIEW AND FINALIZE"**

2. **Click "CREATE"**

3. **Wait 5-10 minutes** for Load Balancer to be created

### Step 6: Add DNS Records in Namecheap

1. **Go back to Namecheap Advanced DNS**

2. **Add A Records:**

   **Record 1:**
   ```
   Type: A Record
   Host: @
   Value: [YOUR_STATIC_IP from Step 1]
   TTL: Automatic
   ```

   **Record 2:**
   ```
   Type: A Record
   Host: www
   Value: [YOUR_STATIC_IP from Step 1]
   TTL: Automatic
   ```

3. **Save changes**

### Step 7: Wait for SSL Certificate

- DNS propagation: 15-30 minutes
- SSL certificate provisioning: 15-60 minutes
- You can check status in Load Balancer details

---

## Part 3: Update Frontend Configuration

### Step 1: Update API URL

```powershell
cd c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend

# Update .env.production
echo "VITE_API_BASE=https://api.tuempresainternacional.com" > .env.production
```

### Step 2: Rebuild Frontend

```powershell
npm run build
```

### Step 3: Upload to Cloud Storage

```powershell
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" -m rsync -r dist/ gs://tuempresainternacional-frontend
```

---

## Verification Checklist

After DNS propagation and SSL provisioning (1-2 hours total):

- [ ] https://api.tuempresainternacional.com returns API response
- [ ] https://tuempresainternacional.com loads frontend
- [ ] https://www.tuempresainternacional.com redirects to main domain
- [ ] SSL certificates show as valid (green padlock)
- [ ] Login works correctly
- [ ] All features function properly

---

## Troubleshooting

### SSL Certificate Pending
- Wait up to 60 minutes
- Verify DNS records are correct
- Check Load Balancer status in Console

### DNS Not Propagating
- Check records in Namecheap
- Use DNS checker: https://dnschecker.org
- Wait up to 48 hours (usually 15-30 minutes)

### Backend Domain Not Working
- Verify CNAME record points to `ghs.googlehosted.com`
- Check Cloud Run domain mapping status
- Wait for SSL certificate provisioning

---

## Timeline

- **Backend domain:** 30-60 minutes
- **Frontend Load Balancer:** 60-120 minutes
- **Total:** 1.5-3 hours (mostly waiting for DNS/SSL)

---

## Next Steps After Completion

1. Test complete application flow
2. Change admin password
3. Set up monitoring
4. Configure automated backups
5. Add users and test MLM features
