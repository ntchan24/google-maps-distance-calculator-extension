# Google Maps Route Optimizer Extension

A Chrome extension that finds the shortest route between multiple locations on Google Maps using the Nearest Neighbor algorithm with 2-opt improvement.

## Features

- **Automatic Detection**: Detects when 2+ waypoints are added to Google Maps
- **Route Optimization**: Uses Nearest Neighbor + 2-opt algorithms for efficient routing
- **Flexible Routes**: Toggle between round trip and one-way routes
- **Simple UI**: Integrated directly into Google Maps interface
- **No API Required**: Works entirely through DOM manipulation

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `google_maps_extension` folder
5. The extension icon should appear in your browser toolbar

## How to Use

1. Go to [Google Maps](https://maps.google.com)
2. Click on "Directions" 
3. Add 2 or more destinations
4. The "Optimize Route" button will appear automatically
5. Toggle between "Round Trip" and "One Way" as needed
6. Click "Optimize Route" to reorder your stops for the shortest path

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Main content script for waypoint detection and UI
- `optimizer.js` - Route optimization algorithms
- `background.js` - Service worker for settings management
- `popup.html/js` - Extension popup for settings
- `styles.css` - UI styling
- `icon*.png` - Extension icons

## Algorithm

The extension uses:
1. **Nearest Neighbor**: Quick initial route generation
2. **2-opt Improvement**: Refines the route by eliminating crossing paths

## Testing

To test the extension:
1. Load the extension in Chrome
2. Go to Google Maps
3. Add multiple destinations (try 3-5 for best demonstration)
4. Click "Optimize Route"
5. Verify the waypoints are reordered

## Limitations

- Distance calculations are approximate when not using Google Maps API
- Works best with up to 20 waypoints
- Requires Google Maps to be in English

## Future Improvements

- Add Google Distance Matrix API support for accurate distances
- Implement more sophisticated algorithms (genetic, simulated annealing)
- Add route history and undo functionality
- Support for different travel modes (walking, transit, etc.)