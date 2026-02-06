/**
 * VALO-SYNDIC Ghost — Content Script
 * ===================================
 * Minimal content script (extraction now done via executeScript)
 */

// Visual indicator that extension is active
console.log('🏢 VALO-SYNDIC Ghost actif sur cette page');

// Listen for future messages if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message reçu:', message);
    sendResponse({ status: 'ok' });
    return true;
});
