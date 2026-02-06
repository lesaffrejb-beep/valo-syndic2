/**
 * VALO-SYNDIC Ghost — Popup Logic
 * ================================
 * Orchestrates scanning and JSON export.
 */

// DOM Elements
const scanBtn = document.getElementById('scanBtn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const resultCountEl = document.getElementById('resultCount');
const copyBtn = document.getElementById('copyBtn');

// State
let extractedData = null;

// Update status message
function setStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Main scan function
async function scanPage() {
    try {
        scanBtn.disabled = true;
        setStatus('Analyse en cours...', '');
        resultsEl.classList.remove('visible');

        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.id) {
            throw new Error('Impossible d\'accéder à l\'onglet actif');
        }

        // Execute extraction script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractDataFromPage,
        });

        const data = results[0]?.result;

        if (!data || !data.lots || data.lots.length === 0) {
            setStatus('❌ Aucun lot détecté sur cette page', 'error');
            extractedData = null;
            return;
        }

        // Success
        extractedData = data;
        resultCountEl.textContent = data.lots.length;
        resultsEl.classList.add('visible');
        setStatus(`✅ ${data.lots.length} lots extraits avec succès !`, 'success');

    } catch (error) {
        console.error('Scan error:', error);
        setStatus(`⚠️ Erreur: ${error.message}`, 'error');
        extractedData = null;
    } finally {
        scanBtn.disabled = false;
    }
}

// Copy JSON to clipboard
async function copyToClipboard() {
    if (!extractedData) return;

    try {
        const json = JSON.stringify(extractedData, null, 2);
        await navigator.clipboard.writeText(json);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copié !';
        copyBtn.classList.add('copied');

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);

    } catch (error) {
        console.error('Copy error:', error);
        setStatus('Erreur de copie', 'error');
    }
}

// ============================================================================
// EXTRACTION FUNCTION (Injected into page)
// ============================================================================

function extractDataFromPage() {
    const lots = [];

    // Find all tables on page
    const tables = Array.from(document.querySelectorAll('table')).filter(table => {
        // Must be visible
        const rect = table.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    });

    // Process each table
    for (const table of tables) {
        const extracted = extractFromTable(table);
        lots.push(...extracted);
    }

    // Deduplicate by ID
    const uniqueLots = deduplicateLots(lots);

    return {
        source: 'valo-syndic-ghost',
        version: '1.0.0',
        extractedAt: new Date().toISOString(),
        url: window.location.href,
        lots: uniqueLots,
    };

    // ---- Helper Functions ----

    function extractFromTable(table) {
        const results = [];

        // Find headers
        const headerRow = table.querySelector('thead tr, tr:first-child');
        if (!headerRow) return results;

        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell =>
            cell.textContent?.toLowerCase().trim() || ''
        );

        // Keyword matching (flexible order)
        const keywords = {
            lot: ['lot', 'n°', 'id', 'numéro', 'numero', 'no'],
            tantiemes: ['tantieme', 'tantième', 'qp', '/1000', 'quote', 'millieme', 'millième'],
            surface: ['m2', 'm²', 'surface', 'sup', 'superficie'],
            type: ['nature', 'désignation', 'designation', 'type', 'catégorie', 'categorie'],
        };

        // Find column indices
        const colMap = {};
        for (const [key, terms] of Object.entries(keywords)) {
            colMap[key] = headers.findIndex(h =>
                terms.some(term => h.includes(term))
            );
        }

        // If no lot or tantiemes column found, skip this table
        if (colMap.lot === -1 && colMap.tantiemes === -1) {
            return results;
        }

        // Extract rows
        const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');

        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 2) continue;

            const lot = {
                id: colMap.lot >= 0 ? cleanText(cells[colMap.lot]) : null,
                tantiemes: colMap.tantiemes >= 0 ? parseNumber(cells[colMap.tantiemes]?.textContent) : null,
                surface: colMap.surface >= 0 ? parseFloat(cells[colMap.surface]?.textContent?.replace(',', '.')) : null,
                type: colMap.type >= 0 ? cleanText(cells[colMap.type]) : null,
            };

            // Must have at least ID or tantiemes
            if (lot.id || lot.tantiemes) {
                results.push(lot);
            }
        }

        return results;
    }

    function cleanText(cell) {
        if (!cell) return null;
        const text = cell.textContent?.trim();
        return text && text.length > 0 ? text : null;
    }

    function parseNumber(str) {
        if (!str) return null;
        const cleaned = str.replace(/[^\d]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
    }

    function deduplicateLots(lots) {
        const seen = new Set();
        return lots.filter(lot => {
            const key = lot.id || JSON.stringify(lot);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

scanBtn.addEventListener('click', scanPage);
copyBtn.addEventListener('click', copyToClipboard);
