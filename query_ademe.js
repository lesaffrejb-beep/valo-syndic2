const https = require('https');

const API_BAN = "https://api-adresse.data.gouv.fr/search/?q=60+Rue+Jules+Guitton+49100+Angers&limit=1";
const API_ADEME_BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant";

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log("1. Fetching coordinates from BAN...");
        const banData = await fetchJson(API_BAN);

        if (!banData.features || banData.features.length === 0) {
            console.error("No address found in BAN.");
            return;
        }

        const feature = banData.features[0];
        const [lon, lat] = feature.geometry.coordinates;
        console.log(`Address found: ${feature.properties.label}`);
        console.log(`Coordinates: ${lat}, ${lon}`);

        // Simulate searchDPEByLocation
        // geo_distance=lon,lat,distance
        // using default radius 500m
        const radius = 500;
        const limit = 10;
        const ademeUrl = `${API_ADEME_BASE}/lines?size=${limit}&geo_distance=${lon},${lat},${radius}&sort=-date_etablissement_dpe`;

        console.log(`\n2. Querying ADEME API (Radius: ${radius}m)...`);
        console.log(`URL: ${ademeUrl}`);

        const ademeData = await fetchJson(ademeUrl);
        const results = ademeData.results || [];

        console.log(`Found ${results.length} DPE(s) in radius.`);

        results.forEach((r, i) => {
            console.log(`\n--- Result ${i + 1} ---`);
            console.log(`Address: ${r.adresse_brute}`);
            console.log(`DPE: ${r.etiquette_dpe}`);
            console.log(`Date: ${r.date_etablissement_dpe}`);

            console.log(JSON.stringify(r, null, 2));

            // Check if it matches "60 Rue Jules Guitton"
            /*
            if (r.adresse_brute.includes("60") && r.adresse_brute.toLowerCase().includes("jules guitton")) {
                console.log(">>> MATCH FOUND! <<<");
            }
            */
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

run();
