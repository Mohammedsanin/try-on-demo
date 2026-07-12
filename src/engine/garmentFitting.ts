import * as THREE from 'three';
import type { PoseFrame } from './poseTracking';
import type { GarmentAsset } from './garmentLoader';
import type { BodyMetrics } from './calibration';

const IDS = [11, 12, 13, 14, 15, 16, 23, 24];
const NAMES: Record<number, string[]> = {
  // Each string is compared as a substring against the NORMALISED bone name
  // (lower-cased, all underscores/spaces/dots/hyphens removed from BOTH sides).
  // Add aliases here whenever a new GLB uses a different naming convention.
  11: ['leftshoulder', 'shoulder_l', 'l_shoulder', 'upperarm_l', 'leftarm', 'clavicle_l'],
  12: ['rightshoulder', 'shoulder_r', 'r_shoulder', 'upperarm_r', 'rightarm', 'clavicle_r'],
  13: ['leftelbow', 'lowerarm_l', 'forearm_l'],
  14: ['rightelbow', 'lowerarm_r', 'forearm_r'],
  15: ['leftwrist', 'hand_l', 'lefthand', 'wrist_inner_l', 'wrist_l'],
  16: ['rightwrist', 'hand_r', 'righthand', 'wrist_inner_r', 'wrist_r'],
  23: ['lefthip', 'thigh_l', 'upleg_l'],
  24: ['righthip', 'thigh_r', 'upleg_r'],
};

// Explicit per-anchor landmark drivers for the STATIC_MESH FFD path.
// Order must match the 8 anchors defined in prepareFFD():
//   [L-shoulder, R-shoulder, L-armpit, R-armpit, L-mid-torso, R-mid-torso, L-hem, R-hem]
// Armpits are driven by the same-side shoulder — NOT elbow (landmark 13/14).
// Driving armpits with elbows caused shirt sides to balloon when the user raised their hands.
// Mid-torso anchors are driven by the same-side hip — NOT wrist (landmark 15/16).
// Driving mid-torso with wrists caused the shirt body to follow hand movement.
const FFD_ANCHOR_DRIVERS = [11, 12, 11, 12, 23, 24, 23, 24] as const;

export class GarmentFitter {
  private binds = new Map<THREE.Bone, { position: THREE.Vector3; quaternion: THREE.Quaternion }>();
  private mapped = new Map<number, THREE.Bone>();
  private ffdBind: THREE.Vector3[] = [];
  /** Guards lazy FFD initialisation — reset to false per instance so garment swaps re-init correctly. */
  private ffdReady = false;
  private sanityLogged = false;
  private clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.03);
  private uniforms = { uAnchorDelta: { value: Array.from({ length: 8 }, () => new THREE.Vector3()) } };
  private modelShoulderMidpoint = new THREE.Vector3();

  constructor(public asset: GarmentAsset) {
    if (asset.mode === 'RIGGED') {
      this.prepareRig();
      const leftS = this.mapped.get(11);
      const rightS = this.mapped.get(12);
      if (leftS && rightS) {
        this.asset.root.updateMatrixWorld(true);
        const pL = leftS.getWorldPosition(new THREE.Vector3());
        const pR = rightS.getWorldPosition(new THREE.Vector3());
        this.modelShoulderMidpoint.copy(pL).add(pR).multiplyScalar(0.5);
      } else {
        this.modelShoulderMidpoint.set(0, this.asset.size.y * 0.35, 0);
      }
    } else {
      this.modelShoulderMidpoint.set(0, this.asset.size.y * 0.35, 0);
    }
    this.initClipping();
  }

  private initClipping() {
    this.asset.meshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        mat.clippingPlanes = [this.clippingPlane];
      });
    });
  }

  private prepareRig() {
    this.asset.bones.forEach((b) =>
      this.binds.set(b, { position: b.position.clone(), quaternion: b.quaternion.clone() })
    );
    for (const id of IDS) {
      const match = this.asset.bones.find((b) =>
        NAMES[id].some((n) =>
          // Normalise BOTH the bone name and the pattern: lower-case and strip all
          // non-alphanumeric characters (underscores, spaces, dots, hyphens).
          // This makes 'upperarm_l_014' → 'upperarml014' match pattern 'upperarm_l' → 'upperarml',
          // and handles conventions like Mixamo (LeftArm), UE5 (upperarm_l_014), etc.
          b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(n.toLowerCase().replace(/[^a-z0-9]/g, ''))
        )
      );
      if (match) this.mapped.set(id, match);
    }
  }

  /**
   * Initialise FFD bind pose. Call ONCE, immediately after scene.add(root), while the
   * garment is still at its bind pose (centered, scale=1, no rotation from the fitter).
   *
   * Why eager, not lazy: prepareFFD() uses Box3.setFromObject() to measure the garment.
   * If called lazily inside update() after calibration locks, the garment will already
   * have been translated and scaled by the fitting loop — the measured bind pose would
   * be wrong, corrupting all FFD anchor positions and vertex weights.
   *
   * Safe to call on a RIGGED garment (no-op). Idempotent on duplicate calls.
   */
  initFFD() {
    if (this.ffdReady || this.asset.mode !== 'STATIC_MESH') return;
    this.ffdReady = true;
    this.prepareFFD();
  }

  private prepareFFD() {
    // Force matrixWorld to be current before reading world-space bounds.
    this.asset.root.updateMatrixWorld(true);
    const invWorld = this.asset.root.matrixWorld.clone().invert();

    const box  = new THREE.Box3().setFromObject(this.asset.root);
    const size = box.getSize(new THREE.Vector3());
    const c    = box.getCenter(new THREE.Vector3());

    // 8 control points distributed around the garment silhouette, computed in WORLD space.
    // FIX 3: Shoulder anchor Y raised from 0.35 → 0.40 so the FFD shoulder control
    // points sit at the anatomical shoulder seam (~40% above bbox centre on a shirt),
    // not at the upper chest (35%). Hem anchors adjusted to match at -0.40.
    const anchorsWorld = [
      new THREE.Vector3(c.x - size.x * 0.28, c.y + size.y * 0.40, c.z), // 0 left shoulder
      new THREE.Vector3(c.x + size.x * 0.28, c.y + size.y * 0.40, c.z), // 1 right shoulder
      new THREE.Vector3(c.x - size.x * 0.43, c.y + size.y * 0.08, c.z), // 2 left armpit
      new THREE.Vector3(c.x + size.x * 0.43, c.y + size.y * 0.08, c.z), // 3 right armpit
      new THREE.Vector3(c.x - size.x * 0.52, c.y - size.y * 0.20, c.z), // 4 left mid-torso
      new THREE.Vector3(c.x + size.x * 0.52, c.y - size.y * 0.20, c.z), // 5 right mid-torso
      new THREE.Vector3(c.x - size.x * 0.22, c.y - size.y * 0.40, c.z), // 6 left hem
      new THREE.Vector3(c.x + size.x * 0.22, c.y - size.y * 0.40, c.z), // 7 right hem
    ];

    // BUG 4 FIX (coordinate space): store rest-pose anchors in LOCAL (object) space.
    // The FFD shader applies displacement in object space (position attribute), so
    // all deltas passed via uAnchorDelta must also be in object space.
    // Previously these were stored in world space, making every delta wrong once the
    // root moved away from the origin.
    this.ffdBind = anchorsWorld.map((a) => a.clone().applyMatrix4(invWorld));

    // Vertex → anchor weight baking. Distances are computed in world space, which is
    // fine: we only need a consistent frame for the proximity comparison.
    this.asset.meshes.forEach((mesh) => {
      const p = mesh.geometry.getAttribute('position');
      const indices = new Float32Array(p.count * 4);
      const weights = new Float32Array(p.count * 4);
      for (let i = 0; i < p.count; i++) {
        const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(mesh.matrixWorld);
        const nearest = anchorsWorld
          .map((a, j) => ({ j, d: Math.max(v.distanceTo(a), size.length() * 0.025) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 3);
        const total = nearest.reduce((sum, n) => sum + 1 / (n.d * n.d), 0);
        nearest.forEach((n, k) => {
          indices[i * 4 + k] = n.j;
          weights[i * 4 + k] = 1 / (n.d * n.d) / total;
        });
      }
      mesh.geometry.setAttribute('ffdIndices', new THREE.BufferAttribute(indices, 4));
      mesh.geometry.setAttribute('ffdWeights', new THREE.BufferAttribute(weights, 4));
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uAnchorDelta = this.uniforms.uAnchorDelta;
          shader.vertexShader = shader.vertexShader
            .replace(
              '#include <common>',
              '#include <common>\nattribute vec4 ffdIndices; attribute vec4 ffdWeights; uniform vec3 uAnchorDelta[8];'
            )
            .replace(
              '#include <begin_vertex>',
              `vec3 transformed = vec3(position);\nfor(int fi=0;fi<4;fi++){ int ai=int(ffdIndices[fi]+0.5); transformed += uAnchorDelta[ai]*ffdWeights[fi]; }`
            );
        };
        mat.needsUpdate = true;
      });
    });
  }

  /**
   * @param frustumWidth  camera.right - camera.left  — scene units spanning viewport width
   * @param frustumHeight camera.top   - camera.bottom — scene units spanning viewport height
   * @param videoAspect   optional aspect ratio of raw video (width/height) to correct object-fit cover crop
   */
  update(pose: PoseFrame, metrics: BodyMetrics, frustumWidth: number, frustumHeight: number, videoAspect?: number) {
    // FFD is initialised eagerly by initFFD() (CameraPanel calls it right after scene.add)
    // so the bind pose is captured before the garment moves. No lazy init here.

    const l = pose.landmarks;
    const wl = pose.worldLandmarks;

    // BUG 1 FIX: Convert normalized 2D landmark [0,1] → scene units correctly.
    // Also compensates for object-fit: cover cropping if videoAspect is provided.
    const sceneXY = (id: number) => {
      let x = l[id].x;
      let y = l[id].y;

      if (videoAspect) {
        const containerAspect = frustumWidth / frustumHeight;
        if (containerAspect > videoAspect) {
          // Video is cropped vertically
          y = 0.5 + (y - 0.5) * (containerAspect / videoAspect);
        } else {
          // Video is cropped horizontally
          x = 0.5 + (x - 0.5) * (videoAspect / containerAspect);
        }
      }

      // (0.5 - x) mirrors X to match the CSS scaleX(-1) on the video element —
      // landmark x=0 (camera left = user's right) maps to positive scene X (screen right
      // in the mirrored view). Sign is intentional; do not invert.
      return new THREE.Vector3(
        (0.5 - x) * frustumWidth,
        (0.5 - y) * frustumHeight,
        0,
      );
    };

    const shoulderL = sceneXY(11);
    const shoulderR = sceneXY(12);
    const hipL      = sceneXY(23);
    const hipR      = sceneXY(24);
    const midS = shoulderL.clone().add(shoulderR).multiplyScalar(0.5);
    const midH = hipL.clone().add(hipR).multiplyScalar(0.5);

    // Torso 3D Rotation (Yaw, Pitch, Roll) using MediaPipe metric worldLandmarks.
    // Left shoulder (11), Right shoulder (12), Left hip (23), Right hip (24).
    let yaw = 0;
    let pitch = 0;
    if (wl && wl[11] && wl[12] && wl[23] && wl[24]) {
      // Yaw (Y-rotation): based on Z-depth difference of shoulders
      const dz = wl[11].z - wl[12].z;
      const dx = wl[11].x - wl[12].x;
      yaw = Math.atan2(dz, dx);

      // Pitch (X-rotation): based on relative shoulder-to-hip Z-depth tilt
      const shoulderZ = (wl[11].z + wl[12].z) * 0.5;
      const hipZ = (wl[23].z + wl[24].z) * 0.5;
      const shoulderY = (wl[11].y + wl[12].y) * 0.5;
      const hipY = (wl[23].y + wl[24].y) * 0.5;
      pitch = Math.atan2(shoulderZ - hipZ, hipY - shoulderY);
    }

    // FIX 2: Dual-axis scale — constrain by BOTH shoulder span (X) AND torso height (Y).
    const sceneShoulderSpan  = shoulderL.distanceTo(shoulderR);
    const sceneTorsoHeight   = Math.abs(midS.y - midH.y);

    const scaleFromWidth  = sceneShoulderSpan  / Math.max(this.asset.size.x, 0.001);
    const baseScale = scaleFromWidth * 0.95;

    // Snap to baseScale on the very first update() (scale.x === 1.0 = GLB default).
    const currentScale = this.asset.root.scale.x;
    const fromScale = currentScale === 1.0 ? baseScale : currentScale;
    this.asset.root.scale.setScalar(THREE.MathUtils.lerp(fromScale, baseScale, 0.18));

    // One-time sanity log.
    if (!this.sanityLogged && metrics.shoulder > 0) {
      this.sanityLogged = true;
      console.info(
        `[TryOn] garmentBind W=${this.asset.size.x.toFixed(4)} H=${this.asset.size.y.toFixed(4)} GLB units` +
        ` | scaleFromWidth=${scaleFromWidth.toFixed(3)} applied=${baseScale.toFixed(3)}`
      );
    }

    // BUG FIX — lean flip: when user is too close, hip landmarks drift above shoulders
    // in scene space, making midS.y - midH.y < 0 → atan2(~0, negative) = ±π → shirt
    // rotates 180° upside-down. Clamp to ±60° to prevent the flip.
    const rawLean = Math.atan2(midS.x - midH.x, midS.y - midH.y);
    const lean = THREE.MathUtils.clamp(rawLean, -Math.PI / 3, Math.PI / 3);

    // Anatomical Shoulder Midpoint-anchored positioning.
    // Aligns the model's shoulder midpoint directly with the user's shoulder midpoint.
    const nose = sceneXY(0);
    const userShoulderMidpoint = midS.clone().lerp(nose, 0.08); // 8% up towards nose for shoulder slope

    const currentQ = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(pitch * 0.5, yaw * 0.8, lean)
    );
    const scaledOffset = this.modelShoulderMidpoint.clone()
      .multiplyScalar(baseScale)
      .applyQuaternion(currentQ);

    const targetX = userShoulderMidpoint.x - scaledOffset.x;
    const targetY = userShoulderMidpoint.y - scaledOffset.y;

    // Dynamic Z depth tracking:
    let targetZ = -0.05;
    if (wl && wl[11] && wl[12] && metrics.shoulder > 0) {
      const sceneScaleRatio = sceneShoulderSpan / metrics.shoulder;
      const chestZ = (wl[11].z + wl[12].z) * 0.5;
      targetZ = -0.05 - (chestZ * sceneScaleRatio);
    }

    const center = new THREE.Vector3(targetX, targetY, targetZ);
    this.asset.root.position.lerp(center, 0.28);

    this.asset.root.rotation.x = THREE.MathUtils.lerp(this.asset.root.rotation.x, pitch * 0.5, 0.18);
    this.asset.root.rotation.y = THREE.MathUtils.lerp(this.asset.root.rotation.y, yaw * 0.8, 0.18);
    this.asset.root.rotation.z = THREE.MathUtils.lerp(this.asset.root.rotation.z, lean, 0.22);

    // Update clipping plane to world space based on the updated root matrixWorld
    this.asset.root.updateMatrixWorld(true);
    const localPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.03); // 3cm behind center
    this.clippingPlane.copy(localPlane).applyMatrix4(this.asset.root.matrixWorld);

    // ── RIGGED bone retargeting ──────────────────────────────────────────
    // Strategy: compute a world-space delta rotation for each limb segment
    // from MediaPipe worldLandmarks, then apply it to the corresponding
    // skeleton bone as a LOCAL rotation change.
    //
    // Why this works when bone-position driving did not:
    //   • Rotations are SCALE-INDEPENDENT. Whether the GLB is in cm or metres
    //     the rotation of a joint is the same.
    //   • We never set bone.position, so no coordinate-space mismatch can
    //     cause the "mesh explosion" artefact.
    //
    // The pipeline per bone:
    //   1. Reset all bones to bind pose.
    //   2. Update world matrices (bind pose is now the reference).
    //   3. bindDir = direction from this bone to its child bone in world space.
    //   4. targetDir = direction from landmark[id] to landmark[childId]
    //      (metric worldLandmarks, mirrored X, Y-up for Three.js).
    //   5. deltaQ = setFromUnitVectors(bindDir, targetDir).
    //   6. targetWorldQ = deltaQ × bindWorldQ.
    //   7. localQ = inv(parentWorldQ) × targetWorldQ.
    //   8. Restore saved quaternion and slerp toward localQ.

    if (this.asset.mode === 'RIGGED' && wl && wl.length >= 17) {
      // Map: landmark id → its child landmark (defines bone segment direction)
      const CHILD_LM: Partial<Record<number, number>> = {
        11: 13, // left  shoulder → left  elbow
        12: 14, // right shoulder → right elbow
        13: 15, // left  elbow   → left  wrist
        14: 16, // right elbow   → right wrist
      };

      // Ensure world matrices reflect current root transform (including rotation/scale)
      // before reading bone world positions.
      this.asset.root.updateMatrixWorld(true);

      for (const [id, bone] of this.mapped) {
        const childLmId = CHILD_LM[id];
        if (childLmId === undefined) continue;
        if (!wl[id] || !wl[childLmId]) continue;

        // Visibility gate (use 2D landmark visibility — worldLandmarks have no visibility field)
        if ((l[id]?.visibility ?? 1) < 0.50) continue;

        const skeletonChild = bone.children.find((c): c is THREE.Bone => c instanceof THREE.Bone);
        if (!skeletonChild) continue;

        // Perform non-uniform bone/limb scaling along its primary local axis
        const modelLength = skeletonChild.position.length();
        const pA = new THREE.Vector3(wl[id].x, wl[id].y, wl[id].z);
        const pB = new THREE.Vector3(wl[childLmId].x, wl[childLmId].y, wl[childLmId].z);
        const userLength = pA.distanceTo(pB);
        if (modelLength > 0.001 && userLength > 0.001) {
          const userRatio = userLength / Math.max(metrics.shoulder, 0.001);
          const modelRatio = modelLength / Math.max(this.asset.modelShoulderSpan, 0.001);
          const targetScale = THREE.MathUtils.clamp(userRatio / Math.max(modelRatio, 0.001), 0.75, 1.35);

          // Identify major axis of child position offset (primary bone direction axis)
          const pos = skeletonChild.position;
          const absX = Math.abs(pos.x);
          const absY = Math.abs(pos.y);
          const absZ = Math.abs(pos.z);
          let majorAxis: 'x' | 'y' | 'z' = 'y';
          if (absX > absY && absX > absZ) majorAxis = 'x';
          else if (absZ > absY && absZ > absX) majorAxis = 'z';

          const currentVal = bone.scale[majorAxis];
          const newVal = THREE.MathUtils.lerp(currentVal, targetScale, 0.18);
          bone.scale.set(1, 1, 1);
          bone.scale[majorAxis] = newVal;
        }

        // Current bone direction in world space (includes root rotation — this is intentional).
        // We drive the bone relative to its CURRENT orientation, not the bind pose.
        // This avoids the "bind pose reset → world matrix recompute" issue and allows the
        // root rotation to handle gross alignment while bones handle fine limb adjustment.
        const boneWPos  = bone.getWorldPosition(new THREE.Vector3());
        const childWPos = skeletonChild.getWorldPosition(new THREE.Vector3());
        const currentDir = childWPos.sub(boneWPos);
        if (currentDir.lengthSq() < 1e-8) continue;
        currentDir.normalize();

        // Target direction from MediaPipe worldLandmarks, converted to Three.js world space:
        //   MediaPipe worldLandmarks: X positive = camera right, Y positive = downward, Z toward cam.
        //   Three.js scene (mirrored): negate X (mirrors video), negate Y (Y-up), Z unchanged.
        const lA = wl[id], lB = wl[childLmId];
        const targetDir = new THREE.Vector3(
          -(lB.x - lA.x),
          -(lB.y - lA.y),
           (lB.z - lA.z),
        );
        if (targetDir.lengthSq() < 1e-8) continue;
        targetDir.normalize();

        const dot = THREE.MathUtils.clamp(currentDir.dot(targetDir), -1, 1);
        // Skip if already aligned (numerical noise) OR near-antiparallel (dot < -0.1).
        // Near-antiparallel setFromUnitVectors is unstable and can cause sudden 180° flips.
        if (dot > 0.9998 || dot < -0.10) continue;

        // Delta rotation: rotate currentDir onto targetDir in world space.
        const deltaQ = new THREE.Quaternion().setFromUnitVectors(currentDir, targetDir);

        // Bone's current world quaternion
        const boneWorldQ = bone.getWorldQuaternion(new THREE.Quaternion());

        // Parent world quaternion (identity if root-level bone)
        const parentWorldQ = (bone.parent instanceof THREE.Object3D)
          ? bone.parent.getWorldQuaternion(new THREE.Quaternion())
          : new THREE.Quaternion();

        // Target world orientation = apply delta on top of current world orientation
        const targetWorldQ = deltaQ.multiply(boneWorldQ);

        // Convert to local space: localQ = inv(parentWorldQ) × targetWorldQ
        const localQ = parentWorldQ.clone().invert().multiply(targetWorldQ);

        // Smooth slerp — converges to target over ~5 frames without jitter
        bone.quaternion.slerp(localQ, 0.25);
      }
    }
  }
}
