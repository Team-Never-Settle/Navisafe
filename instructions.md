# PROJECT BRIEF — Tunnel-Aware Dead Reckoning Navigation (SIH 2026, PS ID 26168)

## 1. Context
This is a prototype for Smart India Hackathon 2026, Problem Statement 26168
("AI-ML based Intelligent Dead Reckoning system for seamless navigation",
ISRO / Dept. of Space). GNSS drops out in tunnels, underground parking, and
urban canyons, causing navigation apps to freeze or jump. Full inertial
navigation (IMU sensor fusion) is the "proper" solution but is hard to
demo convincingly in a hackathon. Instead, build a simplified but genuinely
useful version scoped to tunnels specifically:

**Core idea:** Pre-map every tunnel in India (entry point, exit point, path
geometry, length). When the vehicle's GPS is about to enter a mapped
tunnel, record its speed at the entry point. Use that speed + the known
tunnel length to (a) estimate how long the vehicle will be in the
blackout, (b) interpolate a synthetic position along the tunnel path while
GPS is unavailable, and (c) predict the timestamp/location where GPS
should reacquire.

Before writing any code, produce a short implementation plan and confirm
the module breakdown below, then build it phase by phase.

## 2. Objective
A working local web demo where:
- A simulated vehicle moves along a route that passes through a real,
  pre-mapped Indian tunnel.
- GPS is deliberately "cut" for the tunnel segment (simulating GNSS loss).
- The app captures entry speed, computes ETA to exit, and shows a live
  interpolated position on the map during the blackout.
- On "exit", it compares the predicted exit time/position against the
  (simulated) real GPS fix and reports the error.

## 3. Data strategy — real tunnel geometry, not a hardcoded list
Do not hand-type a small list of famous tunnels (Atal Tunnel, Chenani-Nashri,
etc.) as the entire dataset — that won't hold up to scrutiny. Instead:

- Use the OpenStreetMap Overpass API to query all ways in India tagged
  `tunnel=yes` on `highway=*` (motorway, trunk, primary, secondary).
  Example Overpass QL:

[out:json][timeout:60];
area["ISO3166-1"="IN"][admin_level=2]->.india;
(
way["tunnel"="yes"]"highway";
);
out geom;

- For each returned way: extract the ordered lat/lon polyline, compute
  length in meters (haversine sum along the polyline), and store
  entry point (first node) and exit point (last node).
- Cache this as a local GeoJSON/SQLite file at build time so the demo
  doesn't depend on live internet access during judging. Include a
  refresh script (`scripts/fetch_tunnels.py` or `.ts`) that can be re-run.
- Keep a small hand-verified subset (e.g. Atal Tunnel — 9.02 km, Chenani-
  Nashri — ~9 km, Sela Tunnel) as sanity-check fixtures alongside the
  bulk OSM-derived dataset, since OSM tagging completeness varies.

## 4. System modules
1. **Tunnel Database** — loads the cached tunnel GeoJSON, exposes
   `findTunnelNear(lat, lon, heading)` and `getTunnelById(id)`.
2. **GPS Source (simulated)** — plays back a route (array of
   `{lat, lon, speed, timestamp}` samples) at real-time or accelerated
   speed. Must support an injected "blackout mask" that suppresses
   samples once the vehicle enters a tunnel geofence.
3. **Geofence / Detection Engine** — watches live GPS; when the vehicle
   is within N meters of a tunnel entry point and heading toward it,
   flags "approaching tunnel" and, on last valid fix, flags "entered
   blackout."
4. **Dead-Reckoning Estimator** — on blackout entry:
   - `entrySpeed` = smoothed average of last ~5 valid speed readings
     (not a single noisy sample).
   - `etaSeconds = tunnelLengthMeters / entrySpeed`
   - During blackout, on each tick: `distanceTraveled = entrySpeed * elapsedSeconds`,
     clamp to tunnel length, interpolate that distance along the tunnel's
     stored polyline to get a synthetic `{lat, lon}`.
   - Emits `predictedExitTimestamp` and `predictedExitPoint`.
5. **AI/ML speed-profile refinement (satisfies the "AI-ML" part of the
   problem title)** — instead of assuming constant speed for the whole
   tunnel, maintain a lightweight per-tunnel historical model: log
   (entrySpeed, actualTraverseTime) pairs from every simulated run,
   fit a simple regression (even linear regression is fine for a demo)
   predicting a `speedAdjustmentFactor` per tunnel (accounts for known
   effects like uphill gradient, curvature, or typical congestion).
   Use `predictedTraverseTime = tunnelLength / (entrySpeed * factor)`
   once enough samples exist; fall back to the naive constant-speed
   formula otherwise. This is intentionally simple — a lookup-table/
   regression is fine, don't over-engineer a neural net for this.
6. **Reacquisition & Correction** — when GPS resumes (simulated exit),
   compare actual fix vs. `predictedExitPoint`/`predictedExitTimestamp`,
   log the error, and feed it into the model in (5).
7. **Map UI** — Leaflet (or Mapbox GL if a token is available) showing:
   the route, the tunnel polyline highlighted, a live marker for the
   vehicle (solid color = real GPS, dashed/ghost style = dead-reckoned),
   and a small status panel showing entry speed, ETA, countdown, and
   post-exit error once available.

## 5. Recommended tech stack
- Frontend: React + TypeScript + Vite, Leaflet for mapping.
- No backend server required for the demo — do the OSM fetch as a
  build-time/offline script, ship the resulting GeoJSON as a static
  asset, and run everything client-side for simplicity of judging.
- If a backend is useful for the ML regression step, a small Node/Express
  or Python/FastAPI service is fine — keep it optional/stubbed if it
  adds friction to a same-day demo.

## 6. Suggested project structure

/scripts/fetch_tunnels.(py|ts) # Overpass API pull + cache to /data
/data/tunnels_india.geojson # cached tunnel geometries
/data/tunnels_fixtures.json # hand-verified sanity-check tunnels
/src/lib/tunnelDb.ts
/src/lib/gpsSimulator.ts
/src/lib/deadReckoning.ts
/src/lib/speedModel.ts
/src/components/MapView.tsx
/src/components/StatusPanel.tsx
/src/routes/demoRoute.ts # a sample route through a real tunnel
/tests/deadReckoning.test.ts


## 7. Concrete acceptance test (use this to validate the core math)
Route through Atal Tunnel (Rohtang), length 9.02 km, constant entry speed
60 km/h. Expected traverse time ≈ 9 min 1 sec (9.02/60 hours). The demo
should reproduce this to within a couple of seconds when using the naive
constant-speed formula, and should show the ghost marker reaching the real
exit coordinates at (or very near) that mark.

## 8. Build order (do these as separate phases; check in after each)
1. Overpass fetch script + cached GeoJSON + length computation, with the
   fixture tunnels as a fallback if the live query is unreachable.
2. Tunnel DB module + geofence detection, unit-tested against fixtures.
3. GPS simulator with an injectable blackout mask + a demo route through
   Atal Tunnel.
4. Dead-reckoning estimator (constant-speed version first) + tests
   against the acceptance test in section 7.
5. Map UI wired to the simulator, showing real vs. ghost marker and the
   status panel.
6. Speed-profile regression model (section 4.5) layered on top once the
   naive version is verified working end-to-end.
7. Polish: play/pause/speed controls on the simulation, a results summary
   screen (predicted vs actual exit) for demo purposes.

## 9. Known limitations to state explicitly in the README (don't hide these)
- Assumes roughly constant speed through the tunnel; sudden braking/
  acceleration inside the tunnel isn't captured without extra sensors.
- Only covers pre-mapped tunnels — doesn't generalize to urban canyons,
  multi-level parking, or dense forest cover (the other GNSS-loss cases
  the original problem statement mentions). Note this as a "Phase 2 —
  IMU-based general dead reckoning" extension if asked about scope.
- OSM tunnel tagging coverage in India is incomplete/inconsistent in
  places; the fixture dataset exists precisely to cover known gaps.

Start by proposing the implementation plan for phases 1–5, wait for
confirmation, then implement sequentially.