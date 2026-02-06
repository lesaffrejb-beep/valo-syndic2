/**
 * VALO-SYNDIC Ghost — Background Service Worker
 * ==============================================
 * Minimal service worker for Manifest V3 compliance.
 */

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('✅ VALO-SYNDIC Ghost installé');
    } else if (details.reason === 'update') {
        console.log('✅ VALO-SYNDIC Ghost mis à jour:', chrome.runtime.getManifest().version);
    }
});

// Keep alive (prevent service worker sleep during development)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    sendResponse({ status: 'alive' });
    return true;
});
