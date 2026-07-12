import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type GarmentAsset = {
  name: string;
  root: THREE.Group;
  meshes: THREE.Mesh[];
  skinned: THREE.SkinnedMesh[];
  bounds: THREE.Box3;
  size: THREE.Vector3;
  mode: 'RIGGED' | 'STATIC_MESH';
  bones: THREE.Bone[];
  modelShoulderSpan: number;
};

export async function loadGarment(name: string): Promise<GarmentAsset> {
  const bytes = window.tryOn
    ? await window.tryOn.readGarment(name)
    : new Uint8Array(await (await fetch(`/garments/${name}`)).arrayBuffer());
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  const meshes: THREE.Mesh[] = [];
  const skinned: THREE.SkinnedMesh[] = [];
  const bones: THREE.Bone[] = [];

  gltf.scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh;
      meshes.push(m);
      m.castShadow = true;
      m.frustumCulled = false;
    }
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) {
      const s = o as THREE.SkinnedMesh;
      skinned.push(s);
      s.skeleton.bones.forEach((b) => {
        if (!bones.includes(b)) bones.push(b);
      });
    }
  });

  // Create wrapper group to normalize mesh coordinate axes
  const rootGroup = new THREE.Group();
  rootGroup.add(gltf.scene);

  const isNewShirt = name.toLowerCase().includes('new shirt');
  if (isNewShirt) {
    // new shirt.glb was exported upside-down. Rotate it 180 degrees around Z axis inside the wrapper.
    gltf.scene.rotation.z = Math.PI;
    gltf.scene.updateMatrixWorld(true);
  }

  const bounds = new THREE.Box3().setFromObject(rootGroup);
  const size = bounds.getSize(new THREE.Vector3());
  gltf.scene.position.sub(bounds.getCenter(new THREE.Vector3()));
  gltf.scene.updateMatrixWorld(true);

  // Find left and right shoulder bones to measure model shoulder span
  const leftS = bones.find((b) =>
    ['leftshoulder', 'shoulder_l', 'l_shoulder', 'upperarm_l', 'leftarm', 'clavicle_l'].some((n) =>
      b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(n.replace(/[^a-z0-9]/g, ''))
    )
  );
  const rightS = bones.find((b) =>
    ['rightshoulder', 'shoulder_r', 'r_shoulder', 'upperarm_r', 'rightarm', 'clavicle_r'].some((n) =>
      b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(n.replace(/[^a-z0-9]/g, ''))
    )
  );

  let modelShoulderSpan = size.x;
  if (leftS && rightS) {
    const pL = leftS.getWorldPosition(new THREE.Vector3());
    const pR = rightS.getWorldPosition(new THREE.Vector3());
    modelShoulderSpan = pL.distanceTo(pR);
  }

  console.info(
    `[TryOn] ${name}: ${skinned.length ? 'rigged' : 'static'}, ${meshes.length} meshes | modelShoulderSpan=${modelShoulderSpan.toFixed(4)}`,
    bones.map((b) => b.name)
  );
  return {
    name,
    root: rootGroup,
    meshes,
    skinned,
    bounds,
    size,
    mode: skinned.length ? 'RIGGED' : 'STATIC_MESH',
    bones,
    modelShoulderSpan,
  };
}
