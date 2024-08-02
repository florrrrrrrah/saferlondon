const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZmxvcnJycnJyYWgiLCJhIjoiY2x2eHZwNXlmMHJ0dzJpb2dnbGZkZTd6dSJ9.7RUUwCSSp6JnlEuJR5a60w';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-0.1276, 51.5074], // London
    zoom: 7,
    minZoom: 7,
    maxBounds: [
        [-0.61, 51], // Southwest
        [0.41, 52]  // Northeast
    ]
});

const bounds = [
    [51, -0.61], // Southwest
    [52, 0.41]   // Northeast
];
const step = 0.05;

async function fetchCrimes(southWest, northEast) {
    const allCrimes = [];
    const fetchPromises = [];
    for (let lat = southWest[0]; lat < northEast[0]; lat += step) {
        for (let lng = southWest[1]; lng < northEast[1]; lng += step) {
            const url = `/api/crimes?poly=${lat},${lng}:${lat + step},${lng}:${lat + step},${lng + step}:${lat},${lng + step}`;
            const fetchPromise = fetch(url)
                .then(response => response.json())
                .then(crimes => {
                    console.log('Fetched crimes:', crimes);
                    if (Array.isArray(crimes)) {
                        allCrimes.push(...crimes);
                    } else {
                        console.error('Data is not an array:', crimes);
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });

            fetchPromises.push(fetchPromise);

            await new Promise(resolve => setTimeout(resolve, 50)); // delay
        }
    }
    await Promise.all(fetchPromises);
    console.log('All fetched crimes:', allCrimes);
    return allCrimes;
}

async function loadMap() {
    await new Promise((resolve, reject) => {
        map.on('load', async () => {
            try {
                fetch('london_borough_boundaries.geojson')
                    .then(response => response.json())
                    .then(data => {
                        map.addSource('boroughs', {
                            'type': 'geojson',
                            'data': data
                        });

                        map.addLayer({
                            'id': 'boroughs-layer',
                            'type': 'line',
                            'source': 'boroughs',
                            'layout': {},
                            'paint': {
                                'line-color': 'rgba(85, 58, 65, 1)',
                                'line-width': 1
                            }
                        });
                    });

                const crimeData = await fetchCrimes(bounds[0], bounds[1]);
                const crimeGeoJson = {
                    'type': 'FeatureCollection',
                    'features': crimeData.map(crime => ({
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [crime.location.longitude, crime.location.latitude]
                        },
                        'properties': {
                            'category': crime.category,
                            'location': crime.location.street.name,
                            'outcome': crime.outcome_status ? crime.outcome_status.category : 'Unknown'
                        }
                    }))
                };

                console.log('Crime GeoJSON:', JSON.stringify(crimeGeoJson, null, 2));

                map.addSource('crimes', {
                    'type': 'geojson',
                    'data': crimeGeoJson
                });

                map.addLayer({
                    'id': 'crimes-layer',
                    'type': 'circle',
                    'source': 'crimes',
                    'paint': {
                        'circle-color': 'rgba(255, 0, 0, 0.6)',
                        'circle-radius': 3
                    }
                });

                map.on('click', 'crimes-layer', (e) => {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const description = `
                        <strong>Category:</strong> ${e.features[0].properties.category}<br>
                        <strong>Location:</strong> ${e.features[0].properties.location}<br>
                        <strong>Outcome:</strong> ${e.features[0].properties.outcome}
                    `;

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                });

                map.on('mouseenter', 'crimes-layer', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'crimes-layer', () => {
                    map.getCanvas().style.cursor = '';
                });

                resolve();
            } catch (error) {
                console.error('Error processing crime data:', error);
                reject(error);
            }
    
        });
    });
}

window.loadMap = loadMap;
