from google.cloud import logging

client = logging.Client(project="tei-mlm-prod")
FILTER = 'resource.type="cloud_run_revision" AND resource.labels.service_name="mlm-backend" AND severity>=ERROR'

print("Fetching latest errors from Cloud Run...")
for entry in client.list_entries(filter_=FILTER, order_by=logging.DESCENDING, max_results=10):
    print(f"[{entry.timestamp}] {entry.payload}")
