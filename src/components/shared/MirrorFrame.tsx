import React, { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import styles from './MirrorFrame.module.css';

interface MirrorFrameProps {
  children: React.ReactNode;
  state?: 'idle' | 'calibrating' | 'active' | 'error';
  caption?: string;
  garmentId?: string;
}

export const MirrorFrame: React.FC<MirrorFrameProps> = ({
  children,
  state = 'active',
  caption,
  garmentId,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isChanging, setIsChanging] = useState<boolean>(false);

  useEffect(() => {
    if (!garmentId || state !== 'active' || prefersReducedMotion) return;

    setIsChanging(true);
    const timer = setTimeout(() => {
      setIsChanging(false);
    }, 420); // slightly longer than the 400ms animation to ensure it finishes

    return () => clearTimeout(timer);
  }, [garmentId, state, prefersReducedMotion]);

  // Handle state classes
  const isCalibrating = state === 'calibrating';
  const isError = state === 'error';

  const shellClasses = [
    styles.mirrorShell,
    isCalibrating && !prefersReducedMotion ? styles.calibrating : '',
    isError ? styles.error : '',
    isChanging ? styles.changing : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.container}>
      <div className={shellClasses}>
        <div className={styles.mirrorFrame}>
          {isError ? (
            <div className={styles.errorContainer}>
              <span className={styles.errorTitle}>Camera not detected</span>
              <p className={styles.errorCopy}>Check connection and permissions, then try again.</p>
            </div>
          ) : (
            <div className={`${styles.contentWrapper} ${isChanging ? styles.fadeChildren : ''}`}>
              {children}
            </div>
          )}
        </div>
      </div>
      {caption && (isCalibrating || state === 'idle') && (
        <p className={styles.caption}>{caption}</p>
      )}
    </div>
  );
};
