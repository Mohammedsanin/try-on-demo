import React, { useEffect } from 'react';
import { useTryOn } from '../../context/TryOnContext';
import { Button } from '../../components/shared/Button';
import { GarmentListItem } from './GarmentListItem';
import styles from './GarmentSidebar.module.css';

interface GarmentSidebarProps {
  storeName?: string;
}

export const GarmentSidebar: React.FC<GarmentSidebarProps> = ({
  storeName = 'Your boutique',
}) => {
  const {
    garments,
    setGarments,
    selectedGarmentId,
    setSelectedGarmentId,
    triggerCapture,
    trackingDetails,
  } = useTryOn();

  useEffect(() => {
    const fetchGarments = async () => {
      try {
        const names = window.tryOn
          ? await window.tryOn.listGarments()
          : ['new shirt.glb', 'mens_casual_shirt.glb', 'shirt.glb', 't-shirt.glb'];

        const mapped = names.map((name) => ({
          id: name,
          name: name.replace(/\.glb$/i, '').replace(/[-_]/g, ' '),
        }));

        setGarments(mapped);
        if (mapped.length > 0 && !selectedGarmentId) {
          setSelectedGarmentId(mapped[0].id);
        }
      } catch (err) {
        console.error('Failed to list garments', err);
      }
    };

    fetchGarments();
  }, []);

  const handleGarmentSelect = (id: string) => {
    setSelectedGarmentId(id);
  };

  const selectedGarment = garments.find((g) => g.id === selectedGarmentId);
  const selectedName = selectedGarment ? selectedGarment.name : 'Select a garment';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.title}>Try On</h1>
        <span className={styles.count} aria-label={`${garments.length} items available`}>
          {String(garments.length).padStart(2, '0')}
        </span>
      </div>

      <div className={styles.list} role="radiogroup" aria-label="Available garments">
        {garments.map((garment, idx) => (
          <GarmentListItem
            key={garment.id}
            id={garment.id}
            name={garment.name}
            selected={garment.id === selectedGarmentId}
            onSelect={handleGarmentSelect}
            showDivider={idx < garments.length - 1}
            index={idx}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={triggerCapture} className={styles.actionButton}>
          Capture Look
        </Button>
        <Button variant="ghost" className={styles.actionButton}>
          Share
        </Button>
      </div>

      <div className={styles.storeSlot}>
        <span className={styles.storeLabel}>In store at</span>
        <strong className={styles.storeName}>{storeName}</strong>
      </div>

      {/* Screen Reader Only telemetry info for accessibility */}
      <div className="sr-only" aria-live="polite">
        <b id="stageGarment">{selectedName}</b>
        <b id="fitState">{trackingDetails.fitState}</b>
        <span id="fitDetail">{trackingDetails.fitDetail}</span>
        <span id="trackingValue">{trackingDetails.trackingValue}</span>
        <span id="meshValue">{trackingDetails.meshValue}</span>
        <span id="deformValue">{trackingDetails.deformValue}</span>
        <span id="confidenceValue">{trackingDetails.confidenceValue}</span>
      </div>
    </aside>
  );
};
