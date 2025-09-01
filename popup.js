document.addEventListener('DOMContentLoaded', function() {
  const roundTripToggle = document.getElementById('defaultRoundTrip');
  const statsSection = document.getElementById('statsSection');
  const statsText = document.getElementById('statsText');
  
  chrome.storage.local.get(['isRoundTrip', 'optimizationStats'], function(result) {
    if (result.isRoundTrip !== undefined) {
      roundTripToggle.checked = result.isRoundTrip;
    }
    
    if (result.optimizationStats) {
      statsSection.style.display = 'block';
      const stats = result.optimizationStats;
      statsText.textContent = `Routes optimized: ${stats.count || 0} | Avg improvement: ${stats.avgImprovement || 0} units`;
    }
  });
  
  roundTripToggle.addEventListener('change', function() {
    const isRoundTrip = roundTripToggle.checked;
    chrome.storage.local.set({ isRoundTrip: isRoundTrip }, function() {
      console.log('Default route type updated to:', isRoundTrip ? 'Round Trip' : 'One Way');
    });
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('google.com/maps')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateRouteType',
          isRoundTrip: isRoundTrip
        });
      }
    });
  });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.optimizationStats) {
    const statsSection = document.getElementById('statsSection');
    const statsText = document.getElementById('statsText');
    
    if (changes.optimizationStats.newValue) {
      statsSection.style.display = 'block';
      const stats = changes.optimizationStats.newValue;
      statsText.textContent = `Routes optimized: ${stats.count || 0} | Avg improvement: ${stats.avgImprovement || 0} units`;
    }
  }
});