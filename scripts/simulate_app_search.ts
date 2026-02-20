
// Import localized dpeService to test exactly what the app runs
import { dpeService } from "@/services/dpeService";

async function run() {
    const query = "60 Rue Jules Guitton";
    console.log(`--- Simulating App Search for: "${query}" ---`);

    try {
        const results = await dpeService.hybridSearch(query);
        console.log("\n--- Hybrid Search Results ---");
        results.forEach(r => {
            console.log(`Address: ${r.address}`);
            console.log(`Postal Code: ${r.postalCode}`);
            console.log(`City: ${r.city}`);
            console.log(`Source: ${r.sourceType}`);
            console.log("-------------------");
        });
    } catch (error) {
        console.error("Hybrid Search Error:", error);
    }
}

run();
