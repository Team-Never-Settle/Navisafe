// Generate a synthetic route passing through Atal Tunnel
// Atal entry approx: 32.3276, 77.1906
// Atal exit approx:  32.4045, 77.1654
// Distance is ~9.02 km. Speed ~60 km/h = 16.66 m/s. Traverse time = 541s (9m 1s).

import * as turf from '@turf/turf';

export interface GpsSample {
  lat: number;
  lon: number;
  speed: number; // m/s
  timestamp: number; // epoch ms
}

export function generateDemoRoute(speedKmh: number = 60): GpsSample[] {
  const route: GpsSample[] = [];
  let currentTime = 1000000;

  const speedMs = speedKmh / 3.6; // m/s

  // High fidelity waypoints accurately through Atal Tunnel (9.02 km)
  // Entry: [77.1906, 32.3276]
  // Exit:  [77.1654, 32.4045]
  const waypoints = [
    [77.1980, 32.3150], // ~1.5 km before entry (Open Sky / GPS Active)
    [77.1940, 32.3210],
    [77.1906, 32.3276], // Tunnel Entrance (Blackout Start)
    [77.1865, 32.3480],
    [77.1800, 32.3720],
    [77.1720, 32.3900],
    [77.1654, 32.4045], // Tunnel Exit (GPS Reacquired)
    [77.1580, 32.4180], // ~1.5 km after exit
  ];

  const line = turf.lineString(waypoints);
  const totalLength = turf.length(line, { units: 'meters' });
  const stepMeters = speedMs; // 1 second sample steps

  let currentDistance = 0;

  while (currentDistance <= totalLength) {
    const point = turf.along(line, currentDistance, { units: 'meters' });
    const coords = point.geometry.coordinates;

    route.push({
      lon: coords[0],
      lat: coords[1],
      speed: speedMs + (Math.sin(currentDistance / 100) * 0.5), // realistic slight speed fluctuation
      timestamp: currentTime
    });

    currentTime += 1000; // 1 second
    currentDistance += stepMeters;
  }

  return route;
}

export const demoRoute = generateDemoRoute();
