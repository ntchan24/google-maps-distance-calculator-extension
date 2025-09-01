function optimizeRouteWithNearestNeighbor(distanceMatrix, isRoundTrip) {
  const n = distanceMatrix.length;
  if (n < 2) return [0];
  
  const visited = new Array(n).fill(false);
  const route = [];
  
  let current = 0;
  route.push(current);
  visited[current] = true;
  
  for (let i = 1; i < n; i++) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    
    for (let j = 0; j < n; j++) {
      if (!visited[j] && distanceMatrix[current][j] < nearestDistance) {
        nearestDistance = distanceMatrix[current][j];
        nearestIndex = j;
      }
    }
    
    if (nearestIndex !== -1) {
      route.push(nearestIndex);
      visited[nearestIndex] = true;
      current = nearestIndex;
    }
  }
  
  return route;
}

function improve2Opt(route, distanceMatrix, isRoundTrip) {
  const n = route.length;
  if (n < 4) return route;
  
  let improved = true;
  let bestRoute = [...route];
  
  while (improved) {
    improved = false;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (!isRoundTrip && j === n - 1 && i === 0) continue;
        
        const currentDistance = calculateSegmentDistance(
          bestRoute, i, j, distanceMatrix, isRoundTrip
        );
        
        const newRoute = [...bestRoute];
        reverseSegment(newRoute, i + 1, j);
        
        const newDistance = calculateSegmentDistance(
          newRoute, i, j, distanceMatrix, isRoundTrip
        );
        
        if (newDistance < currentDistance) {
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }
  
  return bestRoute;
}

function calculateSegmentDistance(route, i, j, distanceMatrix, isRoundTrip) {
  const n = route.length;
  let distance = 0;
  
  distance += distanceMatrix[route[i]][route[i + 1]];
  
  if (j < n - 1) {
    distance += distanceMatrix[route[j]][route[j + 1]];
  } else if (isRoundTrip) {
    distance += distanceMatrix[route[j]][route[0]];
  }
  
  if (i === 0 && j === n - 1 && isRoundTrip) {
    distance = distanceMatrix[route[n - 1]][route[0]];
  }
  
  return distance;
}

function reverseSegment(route, start, end) {
  while (start < end) {
    const temp = route[start];
    route[start] = route[end];
    route[end] = temp;
    start++;
    end--;
  }
}

function calculateTotalRouteDistance(route, distanceMatrix, isRoundTrip) {
  let totalDistance = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i]][route[i + 1]];
  }
  
  if (isRoundTrip && route.length > 0) {
    totalDistance += distanceMatrix[route[route.length - 1]][route[0]];
  }
  
  return totalDistance;
}

function findOptimalRoute(waypoints, distanceMatrix, isRoundTrip) {
  const nearestNeighborRoute = optimizeRouteWithNearestNeighbor(
    distanceMatrix,
    isRoundTrip
  );
  
  const optimizedRoute = improve2Opt(
    nearestNeighborRoute,
    distanceMatrix,
    isRoundTrip
  );
  
  return optimizedRoute;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    optimizeRouteWithNearestNeighbor,
    improve2Opt,
    findOptimalRoute,
    calculateTotalRouteDistance
  };
}