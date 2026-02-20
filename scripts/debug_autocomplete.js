const https = require('https');

const API_BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant";

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const response = {
                    statusCode: res.statusCode,
                    data: null,
                    error: null
                };

                try {
                    response.data = JSON.parse(data);
                } catch (e) {
                    response.error = e.message;
                    // If not JSON, probably an error page HTML
                    if (res.statusCode >= 400) {
                        console.error("Raw response:", data.substring(0, 200));
                    }
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(response.data);
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${JSON.stringify(response.data)}`));
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    const query = "60 Rue Jules Guitton";
    console.log(`Testing ADEME Text Search for: "${query}"`);

    // Paramètres utilisés dans ademeDpeService.ts
    // size=5 & q=query & sort=-date_etablissement_dpe
    const params = `size=5&q=${encodeURIComponent(query)}&sort=-date_etablissement_dpe`;
    const url = `${API_BASE}/lines?${params}`;

    console.log(`URL: ${url}`);

    try {
        const results = await fetchJson(url);
        console.log("Success!");
        console.log(`Total hits: ${results.total}`);

        if (results.results && results.results.length > 0) {
            console.log("First result sample:");
            console.log(JSON.stringify(results.results[0], null, 2));
        } else {
            console.log("No results found.");
        }

    } catch (error) {
        console.error("Search FAILED:", error.message);
    }
}

run();
