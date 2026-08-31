import type { GpsSample } from '../routes/demoRoute';

type GpsCallback = (sample: GpsSample | null) => void;

export class GpsSimulator {
  private route: GpsSample[];
  private currentIndex: number = 0;
  private timer: number | null = null;
  private playbackSpeed: number = 1;
  private callbacks: Set<GpsCallback> = new Set();
  
  // A function that returns true if the current location is in a GPS blackout zone
  private blackoutMask: ((sample: GpsSample) => boolean) | null = null;
  private inBlackout: boolean = false;

  constructor(route: GpsSample[]) {
    this.route = route;
  }

  setBlackoutMask(mask: (sample: GpsSample) => boolean) {
    this.blackoutMask = mask;
  }

  setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
    if (this.timer) {
      this.pause();
      this.play();
    }
  }

  onUpdate(callback: GpsCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback); // Unsubscribe function
  }

  play() {
    if (this.timer) return; // Already playing
    
    // Simulate real-time playback by advancing based on the timestamp differences
    const tick = () => {
      if (this.currentIndex >= this.route.length) {
        this.pause();
        return;
      }

      const sample = this.route[this.currentIndex];
      
      // Determine if in blackout
      const isBlackout = this.blackoutMask ? this.blackoutMask(sample) : false;
      this.inBlackout = isBlackout;

      // Notify listeners
      for (const cb of this.callbacks) {
        cb(isBlackout ? null : sample);
      }

      this.currentIndex++;

      if (this.currentIndex < this.route.length) {
        const nextSample = this.route[this.currentIndex];
        const delayMs = (nextSample.timestamp - sample.timestamp) / this.playbackSpeed;
        this.timer = window.setTimeout(tick, delayMs) as unknown as number;
      } else {
        this.pause();
      }
    };

    tick();
  }

  pause() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  reset() {
    this.pause();
    this.currentIndex = 0;
    this.inBlackout = false;
  }
  
  seek(index: number) {
    this.currentIndex = Math.max(0, Math.min(this.route.length - 1, index));
    const sample = this.route[this.currentIndex];
    const isBlackout = this.blackoutMask ? this.blackoutMask(sample) : false;
    this.inBlackout = isBlackout;
    for (const cb of this.callbacks) {
      cb(isBlackout ? null : sample);
    }
  }

  getCurrentIndex() {
    return this.currentIndex;
  }
  
  isCurrentlyBlackedOut() {
    return this.inBlackout;
  }
}
