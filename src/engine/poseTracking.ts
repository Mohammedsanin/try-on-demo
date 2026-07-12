import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult, type NormalizedLandmark } from '@mediapipe/tasks-vision';

export type PoseFrame = {
  landmarks: NormalizedLandmark[];
  worldLandmarks: NormalizedLandmark[];
  confidence: number;
  result: PoseLandmarkerResult;
};

export class PoseTracker {
  private landmarker?: PoseLandmarker;
  private lastVideoTime = -1;
  private lastResult?: PoseFrame;

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.55,
      minPosePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      outputSegmentationMasks: true,
    });
  }

  detect(video: HTMLVideoElement, now: number): PoseFrame | undefined {
    if (!this.landmarker || video.readyState < 2 || video.currentTime === this.lastVideoTime) {
      return this.lastResult;
    }
    this.lastVideoTime = video.currentTime;
    const result = this.landmarker.detectForVideo(video, now);
    if (!result.landmarks[0] || !result.worldLandmarks[0]) return undefined;
    const required = [11, 12, 13, 14, 15, 16, 23, 24];
    const confidence =
      required.reduce((sum, i) => sum + (result.landmarks[0][i].visibility ?? 0), 0) /
      required.length;
    this.lastResult = {
      landmarks: result.landmarks[0],
      worldLandmarks: result.worldLandmarks[0],
      confidence,
      result,
    };
    return this.lastResult;
  }
}
