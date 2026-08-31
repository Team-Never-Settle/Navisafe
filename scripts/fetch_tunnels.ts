import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

// Overpass API URL
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Query to get all tunnels on main highways in India
const QUERY = `
[out:json][timeout:90];
area["ISO3166-1"="IN"][admin_level=2]->.india;
(
  way["tunnel"="yes"]["highway"~"^(motorway|trunk|primary|secondary)$"](area.india);
);
out geom;
`;

async function fetchTunnels() {
  console.log('Fetching tunnel data from Overpass API...');
  
  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(QUERY),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.elements.length} elements from Overpass API.`);

    const features = [];

    for (const element of data.elements) {
      if (element.type === 'way' && element.geometry && element.geometry.length > 1) {
        const coordinates = element.geometry.map((node: any) => [node.lon, node.lat]);
        const lineString = turf.lineString(coordinates);
        
        // Calculate length in meters
        const lengthKm = turf.length(lineString, { units: 'kilometers' });
        const lengthMeters = lengthKm * 1000;
        
        // Filter out tiny tunnels (< 100m) to keep the dataset clean
        if (lengthMeters < 100) continue;

        const feature = turf.feature(lineString.geometry, {
          id: `osm-${element.id}`,
          name: element.tags?.name || 'Unnamed Tunnel',
          length_meters: Math.round(lengthMeters),
          highway: element.tags?.highway,
        });
        
        features.push(feature);
      }
    }

    const featureCollection = turf.featureCollection(features);
    
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    const outputPath = path.join(DATA_DIR, 'tunnels_india.geojson');
    await fs.writeFile(outputPath, JSON.stringify(featureCollection, null, 2), 'utf-8');
    
    console.log(`Successfully saved ${features.length} tunnels to ${outputPath}`);
    
  } catch (error: any) {
    console.error('Failed to fetch tunnel data:', error.message);
    console.log('Using fallback fixtures instead.');
    
    // Write fixtures as the geojson if it fails
    const fixturesPath = path.join(DATA_DIR, 'tunnels_fixtures.json');
    const outputPath = path.join(DATA_DIR, 'tunnels_india.geojson');
    try {
      const fixtures = await fs.readFile(fixturesPath, 'utf-8');
      await fs.writeFile(outputPath, fixtures, 'utf-8');
      console.log('Copied fixtures to tunnels_india.geojson');
    } catch (e: any) {
      console.error('Failed to copy fixtures:', e.message);
    }
  }
}

fetchTunnels().catch(console.error);
