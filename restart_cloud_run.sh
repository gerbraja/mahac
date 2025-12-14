#!/bin/bash
# Script to verify and restart Cloud Run service

echo "=== Finding Cloud Run services ==="
gcloud run services list --project=tei-mlm-prod --region=southamerica-east1

echo ""
echo "=== Getting service name ==="
SERVICE_NAME=$(gcloud run services list --project=tei-mlm-prod --region=southamerica-east1 --format="value(metadata.name)" | head -1)

echo "Found service: $SERVICE_NAME"

echo ""
echo "=== Checking environment variables ==="
gcloud run services describe $SERVICE_NAME --region=southamerica-east1 --project=tei-mlm-prod --format="value(spec.template.spec.containers[0].env)"

echo ""
echo "=== Forcing new deployment to reconnect ==="
gcloud run deploy $SERVICE_NAME --region=southamerica-east1 --project=tei-mlm-prod --platform=managed
