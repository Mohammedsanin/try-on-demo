import React from 'react';
import styles from './GarmentListItem.module.css';

interface GarmentListItemProps {
  id: string;
  name: string;
  thumbnailSrc?: string;
  selected: boolean;
  onSelect: (id: string) => void;
  showDivider: boolean;
  index: number;
}

export const GarmentListItem: React.FC<GarmentListItemProps> = ({
  id,
  name,
  thumbnailSrc,
  selected,
  onSelect,
  showDivider,
  index,
}) => {
  // Use index to generate a unique soft colored swatch if no thumbnail source is present
  const getSwatchStyle = () => {
    if (thumbnailSrc) return { backgroundImage: `url(${thumbnailSrc})` };
    
    // Fallback colors like the original CSS:
    if (index === 0) return { backgroundColor: 'var(--porcelain)' };
    if (index === 1) return { backgroundColor: 'color-mix(in srgb, var(--stone) 23%, var(--porcelain))' };
    return { backgroundColor: 'color-mix(in srgb, var(--clay) 24%, var(--porcelain))' };
  };

  return (
    <button
      className={`${styles.item} ${selected ? styles.active : ''} ${
        showDivider ? styles.divider : ''
      }`}
      onClick={() => onSelect(id)}
      aria-checked={selected}
      role="radio"
    >
      <i className={styles.radio} aria-hidden="true" />
      <span className={styles.name}>{name}</span>
      <span className={styles.swatch} style={getSwatchStyle()} />
    </button>
  );
};
