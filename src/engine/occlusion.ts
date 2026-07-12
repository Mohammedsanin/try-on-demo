import * as THREE from 'three';
import type { PoseFrame } from './poseTracking';

export class ArmOcclusion {
  private arms: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    const material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true });
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.5, 4, 8), material);
      m.visible = false;
      m.renderOrder = -5;
      scene.add(m);
      this.arms.push(m);
    }
  }

  update(pose: PoseFrame, w: number, h: number, baseScale: number = 1.0) {
    const l = pose.landmarks;
    // Z position is matched to be in front of the garment Z (-0.05).
    const p = (id: number) => new THREE.Vector3((0.5 - l[id].x) * w, (0.5 - l[id].y) * h, 0.08);
    [[11, 13], [13, 15], [12, 14], [14, 16]].forEach(([a, b], i) => {
      const m = this.arms[i];
      const pa = p(a);
      const pb = p(b);
      const mid = pa.clone().add(pb).multiplyScalar(0.5);
      const len = pa.distanceTo(pb);
      m.visible = (l[b].visibility ?? 0) > 0.55 && l[b].z < Math.max(l[11].z, l[12].z) + 0.06;
      m.position.copy(mid);
      
      // Dynamic thickness scales with the user's calibrated/apparent scale (baseScale)
      const thickness = Math.max(0.3, baseScale);
      m.scale.set(thickness, Math.max(0.1, len / 0.5), thickness);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
    });
  }
}
