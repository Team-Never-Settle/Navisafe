import * as turf from '@turf/turf';

export interface Tunnel {
  id: string;
  name: string;
  length_meters: number;
  geometry: any;
  entryPoint: any; // [lon, lat]
  exitPoint: any;  // [lon, lat]
}

export class TunnelDB {
  private tunnels: Map<string, Tunnel> = new Map();

  constructor(geojsonData: any) {
    if (!geojsonData || !geojsonData.features) return;
    
    for (const feature of geojsonData.features) {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates;
        if (coords.length < 2) continue;
        
        const id = feature.properties?.id || `unknown-${Math.random()}`;
        this.tunnels.set(id, {
          id,
          name: feature.properties?.name || 'Unnamed Tunnel',
          length_meters: feature.properties?.length_meters || 0,
          geometry: feature.geometry,
          entryPoint: coords[0],
          exitPoint: coords[coords.length - 1]
        });
      }
    }
  }

  getTunnelById(id: string): Tunnel | undefined {
    return this.tunnels.get(id);
  }

  getAllTunnels(): Tunnel[] {
    return Array.from(this.tunnels.values());
  }

  /**
   * Check if a given coordinate is physically inside this tunnel.
   * Returns information about the tunnel, progress (meters from entry), and remaining distance to exit.
   */
  getTunnelContainment(lat: number, lon: number, maxDistToLineMeters: number = 60): {
    tunnel: Tunnel;
    progressMeters: number;
    remainingMeters: number;
    totalLengthMeters: number;
    isReversed: boolean;
  } | null {
    const pt = turf.point([lon, lat]);
    for (const tunnel of this.tunnels.values()) {
      const line = turf.lineString(tunnel.geometry.coordinates);
      const totalLength = turf.length(line, { units: 'meters' });
      const snapped = turf.nearestPointOnLine(line, pt, { units: 'meters' });
      const distToLine = snapped.properties.dist ?? turf.pointToLineDistance(pt, line, { units: 'meters' });
      const progressMeters = snapped.properties.location ?? 0; // Already in meters from nearestPointOnLine

      if (distToLine <= maxDistToLineMeters) {
        const distToEntry = turf.distance(pt, turf.point(tunnel.entryPoint), { units: 'meters' });
        const distToExit = turf.distance(pt, turf.point(tunnel.exitPoint), { units: 'meters' });

        // Point is strictly between entrance and exit
        if (progressMeters >= 0 && progressMeters <= totalLength && distToEntry <= totalLength + 10 && distToExit <= totalLength + 10) {
          return {
            tunnel,
            progressMeters,
            remainingMeters: Math.max(0, totalLength - progressMeters),
            totalLengthMeters: totalLength,
            isReversed: false
          };
        }
      }
    }
    return null;
  }

  /**
   * Finds the closest tunnel entrance (or exit, as tunnels are bidirectional)
   * within a given radius.
   * @param lat Latitude of current position
   * @param lon Longitude of current position
   * @param radiusMeters Search radius in meters
   * @param heading Current heading in degrees (optional, could be used for advanced filtering)
   */
  findTunnelNear(lat: number, lon: number, radiusMeters: number = 100): { tunnel: Tunnel, distance: number, isReversed: boolean } | null {
    const point = turf.point([lon, lat]);
    let closest: { tunnel: Tunnel, distance: number, isReversed: boolean } | null = null;
    let minDistance = radiusMeters;

    for (const tunnel of this.tunnels.values()) {
      // Check distance to start point
      const distStart = turf.distance(point, turf.point(tunnel.entryPoint), { units: 'meters' });
      if (distStart < minDistance) {
        minDistance = distStart;
        closest = { tunnel, distance: distStart, isReversed: false };
      }

      // Check distance to end point (entering from the other direction)
      const distEnd = turf.distance(point, turf.point(tunnel.exitPoint), { units: 'meters' });
      if (distEnd < minDistance) {
        minDistance = distEnd;
        closest = { tunnel, distance: distEnd, isReversed: true };
      }
    }

    return closest;
  }
}
