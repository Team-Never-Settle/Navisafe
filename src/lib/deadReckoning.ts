import * as turf from '@turf/turf';
import type { Tunnel } from './tunnelDb';

export class DeadReckoningEstimator {
  private speedBuffer: number[] = [];
  private activeTunnel: Tunnel | null = null;
  private blackoutStartTime: number = 0;
  private entrySpeed: number = 0;
  private isReversed: boolean = false;

  // Add a speed sample to the running buffer
  addSpeedSample(speedMs: number) {
    this.speedBuffer.push(speedMs);
    if (this.speedBuffer.length > 5) {
      this.speedBuffer.shift();
    }
  }

  // Called when we officially lose GPS inside a tunnel
  enterBlackout(tunnel: Tunnel, timestamp: number, isReversed: boolean = false) {
    this.activeTunnel = tunnel;
    this.blackoutStartTime = timestamp;
    this.isReversed = isReversed;

    // Calculate smoothed entry speed (average of last 5 samples)
    if (this.speedBuffer.length > 0) {
      this.entrySpeed = this.speedBuffer.reduce((a, b) => a + b, 0) / this.speedBuffer.length;
    } else {
      this.entrySpeed = 0; // Fallback, shouldn't happen in practice
    }
    
    // Minimum fallback speed to avoid division by zero
    if (this.entrySpeed < 1) this.entrySpeed = 1;
  }

  // Returns the estimated position and ETA based on current timestamp
  estimatePosition(currentTimestamp: number): { lat: number, lon: number, etaSeconds: number, distanceTraveled: number } | null {
    if (!this.activeTunnel || this.entrySpeed === 0) return null;

    const elapsedSeconds = (currentTimestamp - this.blackoutStartTime) / 1000;
    
    // distance = speed * time
    let distanceTraveled = this.entrySpeed * elapsedSeconds;
    
    // Clamp to tunnel length
    if (distanceTraveled > this.activeTunnel.length_meters) {
      distanceTraveled = this.activeTunnel.length_meters;
    }

    const etaSeconds = (this.activeTunnel.length_meters - distanceTraveled) / this.entrySpeed;

    // Interpolate along the tunnel's geometry
    let line = this.activeTunnel.geometry;
    
    // If entering from the exit, reverse the line for interpolation
    if (this.isReversed) {
      // Create a reversed array of coordinates
      const reversedCoords = [...line.coordinates].reverse();
      line = turf.lineString(reversedCoords).geometry;
    }

    const point = turf.along(line, distanceTraveled, { units: 'meters' });

    return {
      lat: point.geometry.coordinates[1],
      lon: point.geometry.coordinates[0],
      etaSeconds: Math.max(0, etaSeconds),
      distanceTraveled
    };
  }

  exitBlackout() {
    this.activeTunnel = null;
    this.blackoutStartTime = 0;
  }
  
  getEntrySpeed(): number {
    return this.entrySpeed;
  }
}
