import json
import urllib.request
import csv
import io
import sys
import os

DATASET_SLUG = "registre-national-dimmatriculation-des-coproprietes"
API_URL = f"https://www.data.gouv.fr/api/1/datasets/{DATASET_SLUG}/"
OUTPUT_FILE = os.path.join("data", "rnic_49.csv")


def get_latest_csv_url():
    print(f"Fetching metadata from {API_URL}...")
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        with urllib.request.urlopen(API_URL, context=ctx) as response:
            data = json.load(response)
    except Exception as e:
        print(f"Error fetching metadata: {e}")
        sys.exit(1)
    
    resources = data.get("resources", [])
    # Filter for CSVs and sort by publication date (descending)
    csv_resources = [
        r for r in resources 
        if r["format"].lower() == "csv" and "rnic" in r["title"].lower()
    ]
    
    if not csv_resources:
        print("No CSV resources found.")
        # Fallback to any CSV
        csv_resources = [r for r in resources if r["format"].lower() == "csv"]
    
    if not csv_resources:
         print("Really no CSV resources found.")
         sys.exit(1)

    # Sort by creation date (published)
    csv_resources.sort(key=lambda x: x.get("created_at", x.get("last_modified", "")), reverse=True)
    
    latest = csv_resources[0]
    print(f"Found latest resource: {latest['title']} ({latest.get('created_at', 'unknown date')})")
    print(f"URL: {latest['url']}")
    return latest["url"]

def process_csv(url):
    print(f"Downloading and processing CSV from {url}...")
    
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # We will stream the download and filter on the fly
    req = urllib.request.Request(url)
    project_root = os.getcwd() # Should be project root
    output_path = os.path.join(project_root, OUTPUT_FILE)
    
    line_count = 0
    match_count = 0
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response, open(output_path, 'w', encoding='utf-8', newline='') as outfile:
            # Use an incrementing decoder
            # latin-1 is common for french govt data, but utf-8 is standard. 
            # We'll try utf-8 but handle errors? 
            # Actually, let's assume valid encoding or default to utf-8.
            wrapper = io.TextIOWrapper(response, encoding='utf-8-sig') 
            
            # Check delimiter - usually comma or semicolon
            header_line = wrapper.readline()
            if not header_line:
                print("Empty file")
                sys.exit(1)

            delimiter = ';' if ';' in header_line else ','
            print(f"Detected delimiter: '{delimiter}'")
            
            headers = header_line.strip().split(delimiter)
            # Clean headers
            headers = [h.strip('"').strip() for h in headers]
            
            # Write clean header with comma delimiter
            writer = csv.writer(outfile, delimiter=',')
            writer.writerow(headers)
            
            # Find index
            pc_idx = -1
            # Candidates for postal code column
            candidates = ['code_postal', 'adresse_code_postal', 'cp']
            
            for i, h in enumerate(headers):
                if any(c == h.lower() for c in candidates):
                    pc_idx = i
                    break
            
            # Loose search if exact match fails
            if pc_idx == -1:
                 for i, h in enumerate(headers):
                    if 'code_postal' in h.lower():
                        pc_idx = i
                        break

            if pc_idx == -1:
                print("Could not find postal code column in headers:", headers)
                sys.exit(1)
                
            print(f"Postal code column found at index {pc_idx}: {headers[pc_idx]}")
            
            reader = csv.reader(wrapper, delimiter=delimiter)
            
            for row in reader:
                line_count += 1
                if line_count % 50000 == 0:
                    print(f"Processed {line_count} lines...")
                
                if len(row) > pc_idx:
                    pc = row[pc_idx]
                    # Check for 49 prefix
                    # Handle cases where CP might be 49100 or "49100"
                    if pc.strip().startswith('49'):
                        writer.writerow(row)
                        match_count += 1

    except Exception as e:
        print(f"Error processing CSV: {e}")
        # Check if we should delete the file if it failed?
        sys.exit(1)

    print(f"Done. Processed {line_count} lines. Found {match_count} entries for department 49.")
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    url = get_latest_csv_url()
    process_csv(url)
