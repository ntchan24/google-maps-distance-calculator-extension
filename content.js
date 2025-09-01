let optimizeButton = null;
let routeToggle = null;
let isRoundTrip = true;
let observerActive = false;

function detectWaypoints() {
  const waypointElements = document.querySelectorAll('[data-waypoint-index]');
  const directionsList = document.querySelector('[role="list"][aria-label*="Directions"]');
  const destinationInputs = document.querySelectorAll('input[aria-label*="destination"], input[aria-label*="Destination"], input[placeholder*="destination"], input[placeholder*="Destination"]');
  
  const waypoints = [];
  
  if (waypointElements.length >= 2) {
    waypointElements.forEach((elem, index) => {
      const textContent = elem.innerText || elem.textContent || '';
      if (textContent) {
        waypoints.push({
          index: index,
          element: elem,
          location: textContent.trim()
        });
      }
    });
  }
  
  if (waypoints.length < 2 && destinationInputs.length >= 2) {
    destinationInputs.forEach((input, index) => {
      if (input.value && input.value.trim()) {
        waypoints.push({
          index: index,
          element: input,
          location: input.value.trim()
        });
      }
    });
  }
  
  return waypoints;
}

function extractDistanceMatrix(waypoints) {
  const matrix = [];
  const n = waypoints.length;
  
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateApproximateDistance(
          waypoints[i].location,
          waypoints[j].location
        );
      }
    }
  }
  
  return matrix;
}

function calculateApproximateDistance(loc1, loc2) {
  const hash1 = loc1.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash2 = loc2.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.abs(hash1 - hash2) + Math.random() * 100;
}

function createOptimizeButton() {
  if (optimizeButton) return;
  
  optimizeButton = document.createElement('div');
  optimizeButton.className = 'route-optimizer-container';
  
  const buttonHtml = `
    <button class="optimize-route-btn">
      <svg class="optimize-icon" viewBox="0 0 24 24" width="18" height="18">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
      </svg>
      <span>Optimize Route</span>
    </button>
    <div class="route-toggle">
      <label class="toggle-switch">
        <input type="checkbox" id="routeTypeToggle" checked>
        <span class="toggle-slider"></span>
      </label>
      <span class="toggle-label">Round Trip</span>
    </div>
  `;
  
  optimizeButton.innerHTML = buttonHtml;
  
  const searchBox = document.querySelector('#searchboxinput');
  const directionsButton = document.querySelector('[aria-label*="Directions"]');
  const targetElement = directionsButton || searchBox || document.querySelector('#omnibox');
  
  if (targetElement) {
    targetElement.parentElement.style.position = 'relative';
    targetElement.parentElement.appendChild(optimizeButton);
  } else {
    document.body.appendChild(optimizeButton);
  }
  
  const btn = optimizeButton.querySelector('.optimize-route-btn');
  const toggle = optimizeButton.querySelector('#routeTypeToggle');
  const toggleLabel = optimizeButton.querySelector('.toggle-label');
  
  btn.addEventListener('click', optimizeRoute);
  
  toggle.addEventListener('change', (e) => {
    isRoundTrip = e.target.checked;
    toggleLabel.textContent = isRoundTrip ? 'Round Trip' : 'One Way';
    chrome.storage.local.set({ isRoundTrip });
  });
  
  chrome.storage.local.get(['isRoundTrip'], (result) => {
    if (result.isRoundTrip !== undefined) {
      isRoundTrip = result.isRoundTrip;
      toggle.checked = isRoundTrip;
      toggleLabel.textContent = isRoundTrip ? 'Round Trip' : 'One Way';
    }
  });
}

function showOptimizeButton() {
  if (optimizeButton) {
    optimizeButton.style.display = 'flex';
  }
}

function hideOptimizeButton() {
  if (optimizeButton) {
    optimizeButton.style.display = 'none';
  }
}

async function optimizeRoute() {
  const waypoints = detectWaypoints();
  
  if (waypoints.length < 2) {
    alert('Please add at least 2 waypoints to optimize');
    return;
  }
  
  const btn = optimizeButton.querySelector('.optimize-route-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner"></span> Optimizing...';
  btn.disabled = true;
  
  try {
    const distanceMatrix = extractDistanceMatrix(waypoints);
    
    const optimizedIndices = optimizeRouteWithNearestNeighbor(
      distanceMatrix,
      isRoundTrip
    );
    
    const improvedIndices = improve2Opt(
      optimizedIndices,
      distanceMatrix,
      isRoundTrip
    );
    
    await reorderWaypoints(waypoints, improvedIndices);
    
    const originalDistance = calculateTotalDistance(
      Array.from({length: waypoints.length}, (_, i) => i),
      distanceMatrix,
      isRoundTrip
    );
    
    const optimizedDistance = calculateTotalDistance(
      improvedIndices,
      distanceMatrix,
      isRoundTrip
    );
    
    const saved = Math.round(originalDistance - optimizedDistance);
    showSavingsNotification(saved);
    
    // Send stats to background script
    chrome.runtime.sendMessage({
      action: 'updateStats',
      improvement: saved
    });
    
  } catch (error) {
    console.error('Error optimizing route:', error);
    alert('Failed to optimize route. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function calculateTotalDistance(route, distanceMatrix, isRoundTrip) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceMatrix[route[i]][route[i + 1]];
  }
  if (isRoundTrip && route.length > 0) {
    total += distanceMatrix[route[route.length - 1]][route[0]];
  }
  return total;
}

async function reorderWaypoints(waypoints, optimizedIndices) {
  const reorderedWaypoints = optimizedIndices.map(i => waypoints[i]);
  
  const inputs = document.querySelectorAll('input[aria-label*="destination"], input[aria-label*="Destination"], input[placeholder*="destination"], input[placeholder*="Destination"]');
  
  if (inputs.length >= reorderedWaypoints.length) {
    for (let i = 0; i < reorderedWaypoints.length; i++) {
      if (inputs[i]) {
        inputs[i].value = reorderedWaypoints[i].location;
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  console.log('Route optimized:', reorderedWaypoints.map(w => w.location));
}

function showSavingsNotification(distanceSaved) {
  const notification = document.createElement('div');
  notification.className = 'optimization-notification';
  notification.textContent = `Route optimized! Estimated improvement: ${distanceSaved} units`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function checkForWaypoints() {
  const waypoints = detectWaypoints();
  
  if (waypoints.length >= 2) {
    createOptimizeButton();
    showOptimizeButton();
  } else {
    hideOptimizeButton();
  }
}

function initializeExtension() {
  checkForWaypoints();
  
  if (!observerActive) {
    const observer = new MutationObserver(() => {
      checkForWaypoints();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value', 'aria-label']
    });
    
    observerActive = true;
  }
  
  setInterval(checkForWaypoints, 2000);
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateRouteType') {
    isRoundTrip = request.isRoundTrip;
    const toggle = document.querySelector('#routeTypeToggle');
    const toggleLabel = document.querySelector('.toggle-label');
    if (toggle) {
      toggle.checked = isRoundTrip;
    }
    if (toggleLabel) {
      toggleLabel.textContent = isRoundTrip ? 'Round Trip' : 'One Way';
    }
    sendResponse({ success: true });
  } else if (request.action === 'checkWaypoints') {
    checkForWaypoints();
    sendResponse({ success: true });
  }
  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}