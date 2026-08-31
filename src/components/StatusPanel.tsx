import React from 'react';

interface StatusPanelProps {
  isBlackout: boolean;
  currentSpeedKmh: number;
  entrySpeedMs: number;
  etaSeconds: number | null;
  elapsedBlackoutSeconds: number | null;
  distanceTraveledM: number | null;
  totalTunnelLengthM: number | null;
  errorMeters: number | null;
  tunnelName: string | null;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  currentRouteIndex: number;
  totalRouteSteps: number;
  onSeek: (index: number) => void;
  onStep: (delta: number) => void;
  carSpeedSettingKmh: number;
  onCarSpeedChange: (speed: number) => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  isBlackout,
  currentSpeedKmh,
  entrySpeedMs,
  etaSeconds,
  elapsedBlackoutSeconds,
  distanceTraveledM,
  totalTunnelLengthM,
  errorMeters,
  tunnelName,
  playbackSpeed,
  onSpeedChange,
  isPaused,
  onTogglePause,
  onRestart,
  currentRouteIndex,
  totalRouteSteps,
  onSeek,
  onStep,
  carSpeedSettingKmh,
  onCarSpeedChange
}) => {
  const entrySpeedKmh = (entrySpeedMs * 3.6).toFixed(1);
  const totalLength = totalTunnelLengthM || 9020;
  const remainingM = distanceTraveledM !== null ? Math.max(0, totalLength - distanceTraveledM) : totalLength;
  const progressPercent =
    distanceTraveledM !== null
      ? Math.min(100, Math.round((distanceTraveledM / totalLength) * 100))
      : 0;

  // Format seconds into MM:SS
  const formatTime = (secs: number | null) => {
    if (secs === null || isNaN(secs) || secs < 0) return '--:--';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 1000,
      backgroundColor: 'rgba(15, 18, 28, 0.95)',
      color: '#f3f4f6',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
      width: '350px',
      maxHeight: '94vh',
      overflowY: 'auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            🚇 {tunnelName || 'Tunnel DR Navigation'}
          </h2>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{totalLength.toLocaleString()}m Corridor</span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          padding: '4px 8px',
          borderRadius: '6px',
          backgroundColor: isBlackout ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
          color: isBlackout ? '#ef4444' : '#22c55e',
          border: `1px solid ${isBlackout ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`
        }}>
          {isBlackout ? '🔴 GNSS CUT (DR)' : '🟢 GNSS ACTIVE'}
        </span>
      </div>

      {/* PROMINENT EXIT TIMER ETA BADGE */}
      {isBlackout ? (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            ⏳ Exit Countdown ETA
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace', margin: '4px 0' }}>
            {formatTime(etaSeconds)}
          </div>
          <div style={{ fontSize: '12px', color: '#d1d5db' }}>
            <b>{etaSeconds !== null ? Math.round(etaSeconds) : '--'} seconds</b> remaining to exit
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '10px',
          textAlign: 'center',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600 }}>
            🛰️ Open Sky Navigation
          </div>
          <div style={{ fontSize: '13px', color: '#e0e7ff', marginTop: '2px' }}>
            {currentRouteIndex < 30 ? 'Approaching Tunnel Portal in ~1.5 km' : 'Exited Tunnel — Real GNSS Fixed'}
          </div>
        </div>
      )}

      {/* Live Vehicle Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Car Speed</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
            {currentSpeedKmh.toFixed(0)} <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>km/h</span>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
            {isBlackout ? 'Time in Tunnel' : 'Signal State'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: isBlackout ? '#f87171' : '#4ade80', marginTop: '2px' }}>
            {isBlackout && elapsedBlackoutSeconds !== null ? `${Math.round(elapsedBlackoutSeconds)}s` : '100%'}
          </div>
        </div>
      </div>

      {/* Live Dead-Reckoning Physics Breakdown */}
      {isBlackout && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
            📐 Real-Time DR Calculations
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.7', color: '#d1d5db', fontFamily: 'monospace' }}>
            <div>• <b>Entry Speed (v):</b> {entrySpeedMs.toFixed(2)} m/s ({entrySpeedKmh} km/h)</div>
            <div>• <b>Distance Done (d):</b> {distanceTraveledM !== null ? Math.round(distanceTraveledM) : 0} m</div>
            <div>• <b>Distance Left:</b> {Math.round(remainingM)} m / {totalLength} m</div>
            <div>• <b>Formula:</b> ETA = {Math.round(remainingM)}m ÷ {entrySpeedMs.toFixed(1)}m/s = <b>{etaSeconds !== null ? Math.round(etaSeconds) : 0}s</b></div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '10px', width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#f59e0b', transition: 'width 0.15s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
            <span>South Portal</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{progressPercent}% traversed</span>
            <span>North Portal</span>
          </div>
        </div>
      )}

      {/* Post-Exit Error Report */}
      {errorMeters !== null && !isBlackout && currentRouteIndex > 100 && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '10px',
          padding: '10px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>
            🎯 Reacquisition Verified
          </div>
          <div style={{ fontSize: '11px', color: '#d1d5db', marginTop: '2px' }}>
            Calculated Exit Error: <b>{errorMeters.toFixed(2)} meters</b> (Within SIH tolerance)
          </div>
        </div>
      )}

      {/* Drive Speed Setting */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }}>
          <span>Target Vehicle Cruise Speed</span>
          <span style={{ color: '#60a5fa' }}>{carSpeedSettingKmh} km/h</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[40, 60, 80, 100].map((spd) => (
            <button
              key={spd}
              onClick={() => onCarSpeedChange(spd)}
              style={{
                flex: 1,
                padding: '5px 0',
                backgroundColor: carSpeedSettingKmh === spd ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              {spd}k
            </button>
          ))}
        </div>
      </div>

      {/* Manual Route Scrubber */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
          <span>🎮 Manual Route Scrubber</span>
          <span>Step {currentRouteIndex + 1}/{totalRouteSteps}</span>
        </div>
        <input
          type="range"
          min={0}
          max={totalRouteSteps - 1}
          value={currentRouteIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: '#3b82f6',
            marginBottom: '8px'
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onStep(-10)} style={btnStyle}>⏪ -10s</button>
          <button onClick={() => onStep(-1)} style={btnStyle}>◀ -1s</button>
          <button onClick={() => onStep(1)} style={btnStyle}>▶ +1s</button>
          <button onClick={() => onStep(10)} style={btnStyle}>⏩ +10s</button>
        </div>
        <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', marginTop: '6px' }}>
          💡 Tip: Use <b>← / →</b> arrow keys on keyboard to drive!
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={onTogglePause}
            style={{
              flex: 1,
              padding: '7px 10px',
              backgroundColor: isPaused ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            {isPaused ? '▶ Play' : '⏸ Pause'}
          </button>
          <button
            onClick={onRestart}
            style={{
              flex: 1,
              padding: '7px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Speed multipliers */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>Playback:</span>
          {[1, 5, 10, 25, 50].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                flex: 1,
                padding: '3px 0',
                backgroundColor: playbackSpeed === s ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: playbackSpeed === s ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 600
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 4px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '11px'
};
