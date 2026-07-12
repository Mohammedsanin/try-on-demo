import React from 'react';
import { TryOnProvider } from '../../context/TryOnContext';
import { AppHeader } from './AppHeader';
import { CategoryDrawer } from './CategoryDrawer';
import { CameraPanel } from './CameraPanel';
import { GarmentPanel } from './GarmentPanel';
import styles from './AppView.module.css';

export const AppView: React.FC = () => (
  <TryOnProvider>
    <div className={styles.shell}>
      {/* Immersive Fitting Lounge Overlays */}
      <div className={styles.vignette} />
      <div className={styles.ambientReflection} />
      
      <AppHeader />
      <div className={styles.body}>
        <CategoryDrawer />
        <main className={styles.stage}>
          <CameraPanel />
        </main>
        <GarmentPanel />
      </div>
    </div>
  </TryOnProvider>
);

export default AppView;
