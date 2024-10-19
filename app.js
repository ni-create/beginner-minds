// Initialize the map centered at an imaginary city (or Bangalore coordinates)
const map = L.map('map').setView([12.9716, 77.5946], 13);
  // Adjust coordinates as needed

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// --- Draw City Border ---
const cityBorder = L.circle([12.9716, 77.5946], {
    color: 'black',
    fillOpacity: 0,
    radius: 3000  // City radius in meters
}).addTo(map);


// --- Define and Draw Routes ---
// Normal routes (for all types of vehicles) - in red
const normalRoutes = [
    { coords: [[12.9716, 77.5946], [12.9750, 77.5960], [12.9780, 77.5980]], speed: 30, traffic: 1, isSpecial: false },
    { coords: [[12.9700, 77.5920], [12.9650, 77.5900], [12.9600, 77.5880]], speed: 30, traffic: 1, isSpecial: false }
];
const specialRoutes = [
    { coords: [[12.9720, 77.5950], [12.9750, 77.5965], [12.9780, 77.5940], [12.9760, 77.5930]], speed: 50, traffic: 1.5, isSpecial: true, name: 'Special Route 1' },
    { coords: [[12.9700, 77.5910], [12.9725, 77.5880], [12.9750, 77.5890], [12.9740, 77.5900]], speed: 45, traffic: 1.2, isSpecial: true, name: 'Special Route 2' },
    { coords: [[12.9650, 77.5925], [12.9680, 77.5940], [12.9670, 77.5960], [12.9655, 77.5970]], speed: 60, traffic: 1.3, isSpecial: true, name: 'Special Route 3' }
];


// Add normal routes to the map (in red)
normalRoutes.forEach(route => {
    L.polyline(route.coords, { color: 'red', weight: 4 }).addTo(map);
});

// Add special routes to the map (in blue, dashed for visibility)
specialRoutes.forEach(route => {
    L.polyline(route.coords, { color: 'blue', weight: 6, dashArray: '10, 10' }).addTo(map);
});

// Route data combining normal and special routes
let allRoutes = [...normalRoutes, ...specialRoutes];

// --- Dynamic Route Calculation Based on User Input ---
function calculateRoute() {
    // Clear previous markers
    clearMarkers();

    // Get user inputs
    const vehicleType = document.getElementById('vehicleType').value;
    const source = document.getElementById('source').value.split(',').map(Number);
    const destination = document.getElementById('destination').value.split(',').map(Number);

    // Get speed limits and traffic multipliers for each route
    const specialRoute1Speed = parseFloat(document.getElementById('specialRoute1Speed').value);
    const specialRoute1Traffic = parseFloat(document.getElementById('specialRoute1Traffic').value);

    const specialRoute2Speed = parseFloat(document.getElementById('specialRoute2Speed').value);
    const specialRoute2Traffic = parseFloat(document.getElementById('specialRoute2Traffic').value);

    const specialRoute3Speed = parseFloat(document.getElementById('specialRoute3Speed').value);
    const specialRoute3Traffic = parseFloat(document.getElementById('specialRoute3Traffic').value);

    const mainRouteSpeed = parseFloat(document.getElementById('mainRouteSpeed').value);
    const mainRouteTraffic = parseFloat(document.getElementById('mainRouteTraffic').value);

    // Update route data with input values
    specialRoutes[0].speed = specialRoute1Speed;
    specialRoutes[0].traffic = specialRoute1Traffic;

    specialRoutes[1].speed = specialRoute2Speed;
    specialRoutes[1].traffic = specialRoute2Traffic;

    specialRoutes[2].speed = specialRoute3Speed;
    specialRoutes[2].traffic = specialRoute3Traffic;

    normalRoutes[0].speed = mainRouteSpeed;
    normalRoutes[0].traffic = mainRouteTraffic;

    // Filter routes based on vehicle type
    let filteredRoutes;
    if (vehicleType === 'heavy') {
        filteredRoutes = [...specialRoutes, ...normalRoutes];
    } else {
        filteredRoutes = [...normalRoutes];
    }

    // Calculate the effective speed for each lane and sort them based on it
    filteredRoutes.forEach((route, index) => {
        route.effectiveSpeed = route.speed / route.traffic;
        route.routeNumber = index + 1; // Assign route numbers for display
    });
    filteredRoutes.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed);

    // Clear previous route highlights
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            layer.setStyle({ color: layer.options.color === 'blue' ? 'blue' : 'red', weight: 4 });
        }
    });

    // Highlight the best route
    const bestRoute = filteredRoutes[0];
    const bestRouteLayer = L.polyline(bestRoute.coords, { color: 'orange', weight: 6 }).addTo(map);

    // Add markers for source and destination
    L.marker(source, { icon: L.divIcon({ className: 'start-marker', html: '🔴', iconSize: [25, 41] }) }).addTo(map);
    L.marker(destination, { icon: L.divIcon({ className: 'end-marker', html: '🟢', iconSize: [25, 41] }) }).addTo(map);

    // Simulate travel time calculation
    let totalTime = 0;
    filteredRoutes.forEach(route => {
        totalTime += (geodesic(source, destination).km / route.effectiveSpeed) * 60; // convert to minutes
    });

    // Display top route suggestions
    displayRouteSuggestions(filteredRoutes, totalTime);
}

// Clear previous markers
function clearMarkers() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}

// Display top routes in the suggestions area
function displayRouteSuggestions(filteredRoutes, totalTravelTime) {
    let suggestionHTML = `<h3>Top Route Suggestions:</h3><ul>`;
    for (let i = 0; i < Math.min(3, filteredRoutes.length); i++) {
        const route = filteredRoutes[i];
        suggestionHTML += `<li>${route.isSpecial ? 'Special Route' : 'Main Route'} ${route.routeNumber} - Effective Speed: ${route.effectiveSpeed.toFixed(2)} km/h</li>`;
    }
    suggestionHTML += `</ul><p>Total Travel Time: ${Math.round(totalTravelTime)} minutes</p>`;
    
    document.getElementById('route-suggestions').innerHTML = suggestionHTML;
}
