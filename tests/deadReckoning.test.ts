import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeadReckoningEstimator } from '../src/lib/deadReckoning.js';
import * as turf from '@turf/turf';

describe('DeadReckoningEstimator', () => {
  it('should estimate traverse time and position correctly (Acceptance Test)', () => {
    const estimator = new DeadReckoningEstimator();
    
    // Simulate approaching at constant 60 km/h (16.666... m/s)
    const speedMs = 60 / 3.6; 
    
    estimator.addSpeedSample(speedMs);
    estimator.addSpeedSample(speedMs);
    estimator.addSpeedSample(speedMs);
    estimator.addSpeedSample(speedMs);
    estimator.addSpeedSample(speedMs);
    
    // Atal Tunnel geometry (approx 9.02km)
    const lineString = turf.lineString([
      [77.1906, 32.3276],
      [77.185, 32.36],
      [77.1654, 32.4045]
    ]);
    const lengthMeters = 9020;
    
    const tunnel = {
      id: 'fixture-atal',
      name: 'Atal Tunnel',
      length_meters: lengthMeters,
      geometry: lineString.geometry,
      entryPoint: [77.1906, 32.3276] as turf.Position,
      exitPoint: [77.1654, 32.4045] as turf.Position
    };
    
    const startTime = 1000000;
    estimator.enterBlackout(tunnel, startTime, false);
    
    assert.equal(Math.round(estimator.getEntrySpeed() * 100) / 100, 16.67);
    
    // Expected traverse time = 9020 / 16.666 = 541.2 seconds ≈ 9 min 1 sec
    
    // Check at t = 270.6 seconds (halfway)
    const halfwayTime = startTime + (270.6 * 1000);
    const posHalf = estimator.estimatePosition(halfwayTime);
    assert.ok(posHalf);
    
    // distance should be approx 4510 meters
    assert.ok(Math.abs(posHalf.distanceTraveled - 4510) < 1);
    // ETA should be approx 270.6 seconds
    assert.ok(Math.abs(posHalf.etaSeconds - 270.6) < 1);
    
    // Check at t = 541.2 seconds (exit)
    const exitTime = startTime + (541.2 * 1000);
    const posExit = estimator.estimatePosition(exitTime);
    assert.ok(posExit);
    
    // distance should be clamped to 9020
    assert.ok(Math.abs(posExit.distanceTraveled - 9020) < 1);
    assert.ok(Math.abs(posExit.etaSeconds) < 1);
    
    // The position should be exactly at the exit point
    assert.deepEqual([posExit.lon, posExit.lat], tunnel.exitPoint);
  });
});
