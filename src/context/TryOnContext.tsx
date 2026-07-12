import React, { createContext, useContext, useState } from 'react';

export interface Garment {
  id: string;
  name: string;
  thumbnailSrc?: string;
}

interface TrackingDetails {
  fitState: string;
  fitDetail: string;
  meshValue: string;
  deformValue: string;
  confidenceValue: string;
  trackingValue: string;
}

interface TryOnContextType {
  selectedGarmentId: string | null;
  setSelectedGarmentId: (id: string | null) => void;
  status: 'live' | 'ready' | 'error';
  setStatus: (status: 'live' | 'ready' | 'error') => void;
  calibrationProgress: number;
  setCalibrationProgress: (progress: number) => void;
  fps: number;
  setFps: (fps: number) => void;
  garments: Garment[];
  setGarments: (garments: Garment[]) => void;
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  trackingDetails: TrackingDetails;
  setTrackingDetails: React.Dispatch<React.SetStateAction<TrackingDetails>>;
  captureTrigger: number;
  triggerCapture: () => void;
  // NEW category state
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  selectedSubId: string;
  setSelectedSubId: (id: string) => void;
}

const TryOnContext = createContext<TryOnContextType | undefined>(undefined);

export const TryOnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'live' | 'ready' | 'error'>('ready');
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [captureTrigger, setCaptureTrigger] = useState<number>(0);
  const [trackingDetails, setTrackingDetails] = useState<TrackingDetails>({
    fitState: 'Waiting for camera',
    fitDetail: 'Waiting',
    meshValue: '—',
    deformValue: '—',
    confidenceValue: '—',
    trackingValue: 'Offline',
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState('gents');
  const [selectedSubId, setSelectedSubId] = useState('g-shirts');

  const triggerCapture = () => setCaptureTrigger(prev => prev + 1);

  return (
    <TryOnContext.Provider value={{
      selectedGarmentId, setSelectedGarmentId,
      status, setStatus,
      calibrationProgress, setCalibrationProgress,
      fps, setFps,
      garments, setGarments,
      cameraActive, setCameraActive,
      trackingDetails, setTrackingDetails,
      captureTrigger, triggerCapture,
      selectedCategoryId, setSelectedCategoryId,
      selectedSubId, setSelectedSubId,
    }}>
      {children}
    </TryOnContext.Provider>
  );
};

export const useTryOn = () => {
  const ctx = useContext(TryOnContext);
  if (!ctx) throw new Error('useTryOn must be used within TryOnProvider');
  return ctx;
};
