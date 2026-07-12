import * as THREE from 'three';
import type { PoseFrame } from './poseTracking';

export type BodyMetrics = { shoulder: number; hip: number; torso: number; scale: number };

export class Calibrator {
  progress = 0;
  metrics?: BodyMetrics;
  private samples: Array<Omit<BodyMetrics, 'scale'>> = [];

  reset() {
    this.progress = 0;
    this.metrics = undefined;
    this.samples = [];
  }

  update(pose: PoseFrame, garmentSize: THREE.Vector3) {
    if (pose.confidence < 0.68) {
      this.progress = Math.max(0, this.progress - 3);
      return;
    }
    const w = pose.worldLandmarks;
    const v = (i: number) => new THREE.Vector3(w[i].x, w[i].y, w[i].z);
    const shoulder = v(11).distanceTo(v(12));
    const hip = v(23).distanceTo(v(24));
    const torso = v(11)
      .add(v(12))
      .multiplyScalar(0.5)
      .distanceTo(v(23).add(v(24)).multiplyScalar(0.5));

    if (shoulder < 0.12 || torso < 0.12) return;
    this.samples.push({ shoulder, hip, torso });
    if (this.samples.length > 30) this.samples.shift();

    // Outlier gate: only advance progress (and allow locking) when the rolling window
    // is stable. CV = std / mean on shoulder samples. Threshold 0.06 = 6% variation.
    // A still user locks in ~0.8 s (same as before). A moving/fidgeting user stalls
    // until they hold still — no noisy average is ever locked in permanently.
    const isStable = (() => {
      if (this.samples.length < 8) return false;
      const vals = this.samples.map((m) => m.shoulder);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
      return std / mean < 0.06;
    })();

    this.progress = isStable
      ? Math.min(100, (this.samples.length / 24) * 100)
      : Math.max(0, this.progress - 1); // decay slowly while unstable

    if (isStable && this.samples.length >= 24) {
      const avg = (key: 'shoulder' | 'hip' | 'torso') =>
        this.samples.reduce((s, m) => s + m[key], 0) / this.samples.length;
      const s = avg('shoulder');
      const t = avg('torso');
      // scale = raw average shoulder width in metres from worldLandmarks (genuinely metric).
      // garmentFitting.ts derives its own scene-space scale from the 2D landmark span ratio,
      // so no magic multiplier or clamp is needed here.
      this.metrics = {
        shoulder: s,
        hip: avg('hip'),
        torso: t,
        scale: s,
      };
    }
  }
}
