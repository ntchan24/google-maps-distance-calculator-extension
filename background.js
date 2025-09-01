chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isRoundTrip: true,
    optimizationStats: {
      count: 0,
      totalImprovement: 0,
      avgImprovement: 0
    }
  });
  
  console.log('Google Maps Route Optimizer installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    chrome.storage.local.get(['optimizationStats'], (result) => {
      const stats = result.optimizationStats || {
        count: 0,
        totalImprovement: 0,
        avgImprovement: 0
      };
      
      stats.count += 1;
      stats.totalImprovement += request.improvement || 0;
      stats.avgImprovement = Math.round(stats.totalImprovement / stats.count);
      
      chrome.storage.local.set({ optimizationStats: stats });
      sendResponse({ success: true });
    });
    
    return true;
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['isRoundTrip'], (result) => {
      sendResponse({
        isRoundTrip: result.isRoundTrip !== undefined ? result.isRoundTrip : true
      });
    });
    
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      (tab.url.includes('google.com/maps') || tab.url.includes('maps.google.com'))) {
    
    chrome.tabs.sendMessage(tabId, {
      action: 'checkWaypoints'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready yet');
      }
    });
  }
});