import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTryOn } from '../../context/TryOnContext';
import { MirrorFrame } from '../../components/shared/MirrorFrame';
import { Button } from '../../components/shared/Button';
import { PoseTracker } from '../../engine/poseTracking';
import { Calibrator } from '../../engine/calibration';
import { ArmOcclusion } from '../../engine/occlusion';
import { GarmentFitter } from '../../engine/garmentFitting';
import { loadGarment } from '../../engine/garmentLoader';
import styles from './CameraPanel.module.css';

export const CameraPanel: React.FC = () => {
  const {
    selectedGarmentId,
    status,
    setStatus,
    calibrationProgress,
    setCalibrationProgress,
    setFps,
    cameraActive,
    setCameraActive,
    trackingDetails,
    setTrackingDetails,
    captureTrigger,
  } = useTryOn();

  const [isError, setIsError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Refs for tracking engine instances
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const trackerRef = useRef<PoseTracker | null>(null);
  const calibratorRef = useRef<Calibrator | null>(null);
  const occlusionRef = useRef<ArmOcclusion | null>(null);
  const fitterRef = useRef<GarmentFitter | null>(null);
  const assetRef = useRef<any>(null);

  // Loop & stream management refs
  const lightFrameCounterRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const lastFrameRef = useRef<number>(0);
  const lastFpsRef = useRef<number>(0);
  const framesRef = useRef<number>(0);
  const trackingLostAtRef = useRef<number>(0);

  // Handle viewport sizing
  const resize = () => {
    const r = stageRef.current?.getBoundingClientRect();
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!r?.width || !r?.height || !renderer || !camera) return;

    renderer.setSize(r.width, r.height, false);
    const aspect = r.width / r.height;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x353832, 2.2));
    const key = new THREE.DirectionalLight(0xfff4db, 3);
    key.position.set(-2, 3, 4);
    scene.add(key);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    camera.position.z = 5;
    cameraRef.current = camera;

    const calibrator = new Calibrator();
    calibratorRef.current = calibrator;

    const occlusion = new ArmOcclusion(scene);
    occlusionRef.current = occlusion;

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      renderer.dispose();

      if (assetRef.current && sceneRef.current) {
        sceneRef.current.remove(assetRef.current.root);
      }
    };
  }, []);

  // Main tracking loop
  const loop = (now: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const tracker = trackerRef.current;
    const calibrator = calibratorRef.current;
    const fitter = fitterRef.current;
    const occlusion = occlusionRef.current;
    const asset = assetRef.current;

    if (!video || !canvas || !renderer || !scene || !camera || !tracker || !calibrator) return;

    const dt = now - lastFrameRef.current;
    lastFrameRef.current = now;
    framesRef.current++;

    if (now - lastFpsRef.current > 500) {
      const calculatedFps = Math.round((framesRef.current * 1000) / (now - lastFpsRef.current));
      setFps(calculatedFps);
      framesRef.current = 0;
      lastFpsRef.current = now;
    }

    let pose;
    try {
      pose = tracker.detect(video, now);
    } catch (e) {
      console.warn(e);
    }

    if (pose) {
      trackingLostAtRef.current = 0;
      setTrackingDetails((prev) => ({
        ...prev,
        trackingValue: 'LOCKED',
        confidenceValue: `${Math.round(pose.confidence * 100)}%`,
      }));

      if (asset) {
        calibrator.update(pose, asset.size);
        setCalibrationProgress(calibrator.progress);
      }

      if (calibrator.metrics && fitter) {
        const videoAspect = video.videoHeight > 0 ? video.videoWidth / video.videoHeight : undefined;
        fitter.update(pose, calibrator.metrics, camera.right - camera.left, camera.top - camera.bottom, videoAspect);
        if (occlusion) {
          const baseScale = asset?.root?.scale?.x ?? 1.0;
          occlusion.update(pose, camera.right - camera.left, camera.top - camera.bottom, baseScale);
        }
        setTrackingDetails((prev) => ({
          ...prev,
          fitState: 'Fit locked',
          fitDetail: 'Body proportions calibrated. Garment deformation is live.',
        }));
        setStatus('live');
      }
    } else {
      if (!trackingLostAtRef.current) {
        trackingLostAtRef.current = now;
      }
      setTrackingDetails((prev) => ({
        ...prev,
        trackingValue: 'SEARCHING',
      }));

      if (now - trackingLostAtRef.current > 1200 && calibrator.metrics) {
        calibrator.reset();
        setCalibrationProgress(0);
        setStatus('ready');
        setTrackingDetails((prev) => ({
          ...prev,
          fitState: 'Recalibrating',
        }));
      }
    }

    // Environmental lighting estimation
    lightFrameCounterRef.current++;
    if (lightFrameCounterRef.current >= 30) {
      lightFrameCounterRef.current = 0;
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = 4;
        offscreen.height = 4;
        const offCtx = offscreen.getContext('2d');
        if (offCtx && video.readyState >= video.HAVE_CURRENT_DATA) {
          offCtx.drawImage(video, 0, 0, 4, 4);
          const imgData = offCtx.getImageData(0, 0, 4, 4).data;
          
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            r += imgData[i];
            g += imgData[i + 1];
            b += imgData[i + 2];
          }
          const count = imgData.length / 4;
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const dynamicIntensity = 1.0 + brightness * 2.5;

          scene.traverse((o) => {
            if ((o as THREE.DirectionalLight).isDirectionalLight) {
              const dl = o as THREE.DirectionalLight;
              dl.intensity = dynamicIntensity;
              dl.color.setRGB(
                THREE.MathUtils.lerp(1.0, r / 255, 0.4),
                THREE.MathUtils.lerp(1.0, g / 255, 0.4),
                THREE.MathUtils.lerp(1.0, b / 255, 0.4)
              );
            }
            if ((o as THREE.HemisphereLight).isHemisphereLight) {
              const hl = o as THREE.HemisphereLight;
              hl.intensity = dynamicIntensity * 0.7;
              hl.color.setRGB(
                THREE.MathUtils.lerp(1.0, r / 255, 0.4),
                THREE.MathUtils.lerp(1.0, g / 255, 0.4),
                THREE.MathUtils.lerp(1.0, b / 255, 0.4)
              );
            }
          });
        }
      } catch (e) {
        console.warn('Light estimation failed', e);
      }
    }

    renderer.render(scene, camera);
    animationFrameIdRef.current = requestAnimationFrame(loop);
  };

  // Enable/initialize camera and body tracker
  const enableCamera = async () => {
    setIsError(false);
    setStatus('ready');
    setTrackingDetails((prev) => ({
      ...prev,
      trackingValue: 'STARTING',
      fitState: 'Loading body tracker',
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      const tracker = new PoseTracker();
      await tracker.init();
      trackerRef.current = tracker;

      setTrackingDetails((prev) => ({
        ...prev,
        fitState: 'Ready to calibrate',
      }));

      lastFrameRef.current = performance.now();
      lastFpsRef.current = performance.now();
      framesRef.current = 0;
      animationFrameIdRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      setIsError(true);
      setStatus('error');
      setCameraActive(false);
      setTrackingDetails((prev) => ({
        ...prev,
        fitState: 'Camera unavailable',
        fitDetail: 'Check Windows camera privacy settings, then try again.',
      }));
    }
  };

  // Garment loading effect
  useEffect(() => {
    if (!selectedGarmentId || !sceneRef.current) return;

    let active = true;
    setTrackingDetails((prev) => ({ ...prev, meshValue: 'INSPECTING' }));

    loadGarment(selectedGarmentId)
      .then((next) => {
        if (!active) return;
        if (assetRef.current && sceneRef.current) {
          sceneRef.current.remove(assetRef.current.root);
        }
        assetRef.current = next;
        fitterRef.current = new GarmentFitter(next);
        if (sceneRef.current) {
          sceneRef.current.add(next.root);
          // Capture FFD bind pose NOW — garment is at bind pose (centered, scale=1, no fitter movement).
          // Must happen before any fitter.update() calls; see GarmentFitter.initFFD() for details.
          fitterRef.current.initFFD();
        }
        if (calibratorRef.current) {
          calibratorRef.current.reset();
          setCalibrationProgress(0);
        }

        setTrackingDetails((prev) => ({
          ...prev,
          meshValue: next.mode,
          deformValue: next.mode === 'RIGGED' ? 'GPU SKINNING' : 'TRANSFORM FIT',
          fitState: cameraActive ? 'Ready to calibrate' : 'Garment loaded',
          fitDetail:
            next.mode === 'RIGGED'
              ? `${next.bones.length} bones detected and mapped by name.`
              : 'No skeleton detected. Anchor-weight vertex deformation is active.',
        }));
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setTrackingDetails((prev) => ({ ...prev, meshValue: 'LOAD ERROR' }));
        }
      });

    return () => {
      active = false;
    };
  }, [selectedGarmentId, cameraActive]);

  // Capture photo photo trigger effect
  useEffect(() => {
    if (captureTrigger === 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraActive) return;

    const shot = document.createElement('canvas');
    shot.width = video.videoWidth;
    shot.height = video.videoHeight;
    const ctx = shot.getContext('2d');
    if (!ctx) return;

    ctx.translate(shot.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, shot.width, shot.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(canvas, 0, 0, shot.width, shot.height);

    shot.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tryon-look.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  }, [captureTrigger]);

  const getMirrorFrameState = () => {
    if (isError) return 'error';
    if (!cameraActive) return 'idle';
    if (status === 'live') return 'active';
    return 'calibrating';
  };

  return (
    <div className={styles.panel}>
      <MirrorFrame
        state={getMirrorFrameState()}
        caption="Stand fully in frame for best fit"
        garmentId={selectedGarmentId || undefined}
      >
        <div className={styles.stage} id="stage" ref={stageRef}>
          <video
            ref={videoRef}
            id="camera"
            className={styles.camera}
            autoPlay
            muted
            playsInline
          />
          <canvas ref={canvasRef} id="viewport" className={styles.viewport} />

          {/* Torso Alignment Calibration Silhouette Overlay */}
          {cameraActive && status !== 'live' && (
            <div className={`${styles.silhouetteContainer} ${calibrationProgress > 0 ? styles.silhouetteCalibrating : ''}`}>
              <svg className={styles.silhouetteSvg} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35 15 C42 12, 58 12, 65 15 C68 20, 68 22, 74 25 C82 28, 80 38, 80 48 C80 58, 76 75, 75 88 C75 90, 25 90, 25 88 C24 75, 20 58, 20 48 C20 38, 18 28, 26 25 C32 22, 32 20, 35 15 Z" 
                      className={styles.silhouetteOutline} />
                <line x1="28" y1="24" x2="72" y2="24" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className={styles.silhouetteLine} />
                <line x1="24" y1="52" x2="76" y2="52" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className={styles.silhouetteLine} />
                <circle cx="50" cy="38" r="8" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" className={styles.silhouetteCircle} />
              </svg>
              <div className={styles.silhouetteLabel}>
                {calibrationProgress > 0 ? `Calibrating: ${Math.round(calibrationProgress)}%` : 'Align torso with outline to begin'}
              </div>
            </div>
          )}

          {/* Telemetry diagnostics overlay pills */}
          {cameraActive && (
            <div className={styles.telemetryPills}>
              <div className={styles.telemetryPill}>
                <span className={styles.telemetryLabel}>FIT ENGINE</span>
                <span className={styles.telemetryValue}>{trackingDetails.deformValue || 'GPU FFD'}</span>
              </div>
              <div className={styles.telemetryPill}>
                <span className={styles.telemetryLabel}>TRACKING</span>
                <span className={styles.telemetryValue}>{trackingDetails.trackingValue}</span>
              </div>
              {trackingDetails.confidenceValue && (
                <div className={styles.telemetryPill}>
                  <span className={styles.telemetryLabel}>CONFIDENCE</span>
                  <span className={styles.telemetryValue}>{trackingDetails.confidenceValue}</span>
                </div>
              )}
            </div>
          )}

          {!cameraActive && !isError && (
            <div className={styles.fallback}>
              <div className={styles.mirrorRing} />
              <div className={styles.mirrorRingInner} />
              <div className={styles.fallbackContent}>
                <span className={styles.fallbackEyebrow}>STUDIO SENSOR</span>
                <h2 className={styles.fallbackTitle}>Virtual Mirror</h2>
                <p className={styles.fallbackCopy}>Enable your camera to begin fitting garments in real time.</p>
                <Button variant="primary" onClick={enableCamera}>
                  Initialize Sensor
                </Button>
              </div>
            </div>
          )}

          {cameraActive && status === 'ready' && (
            <div className={styles.calibrationGuide}>
              <span>Optimizing body calibration...</span>
            </div>
          )}
        </div>
      </MirrorFrame>
    </div>
  );
};
