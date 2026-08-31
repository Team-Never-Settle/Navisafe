import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TunnelDB } from '../src/lib/tunnelDb.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TunnelDB', () => {
  let tunnelDb: TunnelDB;

  beforeEach(() => {
    // Load fixtures
    const fixturesPath = path.join(__dirname, '../data/tunnels_fixtures.json');
    const rawData = fs.readFileSync(fixturesPath, 'utf-8');
    const geojson = JSON.parse(rawData);
    tunnelDb = new TunnelDB(geojson);
  });

  it('should load tunnels from geojson', () => {
    const atal = tunnelDb.getTunnelById('fixture-atal-tunnel');
    assert.ok(atal);
    assert.equal(atal.name, 'Atal Tunnel');
    assert.equal(atal.length_meters, 9020);
    // Entry point: [77.1906, 32.3276]
    assert.deepEqual(atal.entryPoint, [77.1906, 32.3276]);
    // Exit point: [77.1654, 32.4045]
    assert.deepEqual(atal.exitPoint, [77.1654, 32.4045]);
  });

  it('should find tunnel near entry point', () => {
    // Exactly at entry point
    const match = tunnelDb.findTunnelNear(32.3276, 77.1906, 100);
    assert.ok(match);
    assert.equal(match.tunnel.id, 'fixture-atal-tunnel');
    assert.equal(match.distance, 0);
    assert.equal(match.isReversed, false);
  });

  it('should find tunnel near exit point (reversed)', () => {
    // Exactly at exit point
    const match = tunnelDb.findTunnelNear(32.4045, 77.1654, 100);
    assert.ok(match);
    assert.equal(match.tunnel.id, 'fixture-atal-tunnel');
    assert.equal(match.distance, 0);
    assert.equal(match.isReversed, true);
  });

  it('should return null if no tunnel is near', () => {
    // Somewhere far away
    const match = tunnelDb.findTunnelNear(0, 0, 100);
    assert.equal(match, null);
  });
});
