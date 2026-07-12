import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTryOn } from '../../context/TryOnContext';
import styles from './AppHeader.module.css';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { status, fps } = useTryOn();

  return (
    <header className={styles.header}>
      {/* Left: Brand */}
      <div className={styles.brand}>
        <button onClick={() => navigate('/')} className={styles.logo} aria-label="Go to home">
          <span className={styles.logoMark}>T</span>
        </button>
        <div className={styles.brandText}>
          <span className={styles.brandName}>TRYON</span>
          <span className={styles.brandTagline}>Virtual Fitting Lounge</span>
        </div>
      </div>

      {/* Center: Store name */}
      <div className={styles.storeChip}>
        <span className={styles.storeLabel}>Flagship Boutique</span>
      </div>

      {/* Right: Status */}
      <div className={styles.right}>
        <div className={`${styles.statusPill} ${status === 'live' ? styles.statusLive : ''}`}>
          <span className={styles.pulseDot} />
          <span className={styles.statusText}>
            {status === 'live' ? 'SYSTEM ONLINE' : 'CONNECTING'}
          </span>
        </div>
        
        {status === 'live' && (
          <span className={styles.fps}>{fps} FPS</span>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
