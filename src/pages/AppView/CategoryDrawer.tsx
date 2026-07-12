import React, { useState } from 'react';
import { useTryOn } from '../../context/TryOnContext';
import { CATEGORIES } from '../../data/categories';
import styles from './CategoryDrawer.module.css';

// Minimal luxury line icons
const ICONS: Record<string, React.ReactNode> = {
  gents: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M12 4v18M3 12h18" />
    </svg>
  ),
  ladies: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a6 6 0 0 0-6 6c0 4.25 6 13 6 13s6-8.75 6-13a6 6 0 0 0-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  ),
  kids: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
      <path d="M12 2v10" />
    </svg>
  ),
  others: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/>
    </svg>
  ),
};

export const CategoryDrawer: React.FC = () => {
  const { selectedCategoryId, setSelectedCategoryId, selectedSubId, setSelectedSubId } = useTryOn();
  const [expandedCat, setExpandedCat] = useState<string>(selectedCategoryId);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleCatClick = (catId: string) => {
    const isOpen = expandedCat === catId;
    if (!isOpen) {
      setExpandedCat(catId);
      setSelectedCategoryId(catId);
      const cat = CATEGORIES.find(c => c.id === catId);
      if (cat && cat.subCategories.length > 0) {
        setSelectedSubId(cat.subCategories[0].id);
      }
    } else {
      setExpandedCat('');
    }
  };

  const handleSubClick = (catId: string, subId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSubId(subId);
  };

  return (
    <>
      {/* Mini toggle tab when collapsed */}
      {collapsed && (
        <button
          className={styles.collapsedTab}
          onClick={() => setCollapsed(false)}
          aria-label="Expand Collections"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <aside className={`${styles.drawer} ${collapsed ? styles.collapsed : ''}`}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerLabel}>Collections</span>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(true)}
            aria-label="Collapse Collections"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className={styles.nav} aria-label="Garment categories">
          {CATEGORIES.map(cat => {
            const isExpanded = expandedCat === cat.id;
            const isActiveCat = selectedCategoryId === cat.id;

            return (
              <div key={cat.id} className={styles.catGroup}>
                <button
                  className={`${styles.catBtn} ${isActiveCat ? styles.catActive : ''}`}
                  onClick={() => handleCatClick(cat.id)}
                  aria-expanded={isExpanded}
                >
                  {/* Gold active dot indicator */}
                  {isActiveCat && <span className={styles.activeDot} />}
                  
                  <span className={`${styles.catIcon} ${isActiveCat ? styles.catIconActive : ''}`}>
                    {ICONS[cat.id]}
                  </span>
                  <span className={styles.catLabel}>{cat.label}</span>
                  <svg
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                    width="10" height="10" viewBox="0 0 12 12" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    <path d="M3 4.5l3 3 3-3"/>
                  </svg>
                </button>

                {/* Sub-categories */}
                <div
                  className={styles.subList}
                  style={{
                    maxHeight: isExpanded ? `${cat.subCategories.length * 36}px` : '0',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  {cat.subCategories.map(sub => {
                    const isActiveSub = selectedSubId === sub.id && isActiveCat;
                    return (
                      <button
                        key={sub.id}
                        className={`${styles.subBtn} ${isActiveSub ? styles.subActive : ''}`}
                        onClick={() => handleSubClick(cat.id, sub.id)}
                      >
                        {isActiveSub && <span className={styles.activeSubLine} />}
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <div className={styles.footerBrand}>
            <span className={styles.footerName}>TRYON</span>
            <span className={styles.footerSub}>Fitting Lounge</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default CategoryDrawer;
