import React, { useEffect, useMemo, useState } from 'react';
import { useTryOn } from '../../context/TryOnContext';
import { CATEGORIES, classifyGarment } from '../../data/categories';
import styles from './GarmentPanel.module.css';

// Sleek luxury icons
const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const TshirtIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4a3 3 0 0 0-6 0M3 7.5L6 6l2 4M21 7.5L18 6l-2 4M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>
  </svg>
);

const ShirtIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l3 6-3 2-2-4v14H8V7L6 11l-3-2zM12 7v11M12 10h.01M12 14h.01"/>
  </svg>
);

const HangerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a2 2 0 0 1 2 2c0 .7-.3 1.3-.8 1.7L21 11a1 1 0 0 1-.5 1.8H3.5A1 1 0 0 1 3 11l7.8-5.3c-.5-.4-.8-1-.8-1.7a2 2 0 0 1 2-2z"/>
  </svg>
);

export const GarmentPanel: React.FC = () => {
  const {
    garments, setGarments,
    selectedGarmentId, setSelectedGarmentId,
    triggerCapture,
    trackingDetails,
    selectedCategoryId, selectedSubId,
  } = useTryOn();
  
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Load garments once on mount
  useEffect(() => {
    const load = async () => {
      try {
        const names = window.tryOn
          ? await window.tryOn.listGarments()
          : ['new shirt.glb', 'mens_casual_shirt.glb', 'shirt.glb', 't-shirt.glb'];

        const mapped = names.map(name => ({
          id: name,
          name: name.replace(/\.glb$/i, '').replace(/[-_]/g, ' '),
        }));
        setGarments(mapped);
        if (mapped.length > 0) setSelectedGarmentId(mapped[0].id);
      } catch (e) {
        console.error('Failed to load garments', e);
      }
    };
    load();
  }, []);

  // Filter garments by selected category/sub
  const filtered = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === selectedCategoryId);
    const sub = cat?.subCategories.find(s => s.id === selectedSubId);

    if (!cat || !sub) return garments;

    if (cat.id === 'others') {
      return garments.filter(g => {
        const cls = classifyGarment(g.id);
        return cls === null;
      });
    }

    if (sub.keywords.length === 0) return garments;

    const filteredItems = garments.filter(g => {
      const cls = classifyGarment(g.id);
      return cls?.catId === cat.id && cls?.subId === sub.id;
    });

    if (filteredItems.length === 0) {
      return garments.filter(g => classifyGarment(g.id)?.catId === cat.id);
    }
    return filteredItems;
  }, [garments, selectedCategoryId, selectedSubId]);

  const cat = CATEGORIES.find(c => c.id === selectedCategoryId);
  const sub = cat?.subCategories.find(s => s.id === selectedSubId);
  const selectedGarment = garments.find(g => g.id === selectedGarmentId);

  return (
    <>
      {/* Collapsed tab button */}
      {collapsed && (
        <button
          className={styles.collapsedTab}
          onClick={() => setCollapsed(false)}
          aria-label="Expand Catalog"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <aside className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}>
        {/* Panel header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <span className={styles.catName}>{sub?.label ?? 'All'}</span>
            <span className={styles.itemCount}>{filtered.length}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.catPath}>{cat?.label}</span>
            <button
              className={styles.collapseBtn}
              onClick={() => setCollapsed(true)}
              aria-label="Collapse Catalog"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Garment list */}
        <div className={styles.list} role="radiogroup" aria-label="Available garments">
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>✦</span>
              <p className={styles.emptyText}>No items found in this section.</p>
              <p className={styles.emptyHint}>Drape is checking local archives.</p>
            </div>
          ) : (
            filtered.map((g) => {
              const isSelected = g.id === selectedGarmentId;
              const isTshirt = g.id.toLowerCase().includes('t-shirt') || g.id.toLowerCase().includes('tshirt') || g.id.toLowerCase().includes('polo');
              const isShirt = g.id.toLowerCase().includes('shirt') && !isTshirt;
              
              const Icon = isTshirt ? TshirtIcon : isShirt ? ShirtIcon : HangerIcon;

              return (
                <button
                  key={g.id}
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                  onClick={() => setSelectedGarmentId(g.id)}
                >
                  <span className={styles.swatch}>
                    <Icon />
                  </span>
                  <span className={styles.itemName}>{g.name}</span>
                  <span className={`${styles.checkmark} ${isSelected ? styles.checkmarkVisible : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3"/>
                    </svg>
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={triggerCapture}>
            <CameraIcon />
            Capture Look
          </button>
          <button className={styles.btnGhost}>
            <ShareIcon />
            Share Look
          </button>
        </div>

        {/* Fit status card */}
        <div className={styles.statusCard}>
          <div className={styles.statusLine} />
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>{trackingDetails.fitState}</span>
            {trackingDetails.fitDetail && trackingDetails.fitDetail !== 'Waiting' && (
              <span className={styles.statusDetail}>{trackingDetails.fitDetail}</span>
            )}
          </div>
        </div>

        {/* Store badge */}
        <div className={styles.storeBadge}>
          <span className={styles.storeAt}>Crafted by</span>
          <span className={styles.storeName}>TRYON STUDIO</span>
        </div>

        {/* accessibility */}
        <div className="sr-only" aria-live="polite">
          <b id="stageGarment">{selectedGarment?.name}</b>
          <b id="fitState">{trackingDetails.fitState}</b>
          <span id="fitDetail">{trackingDetails.fitDetail}</span>
        </div>
      </aside>
    </>
  );
};

export default GarmentPanel;
