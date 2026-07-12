import React from 'react';
import styles from './ForRetailers.module.css';

interface ForRetailersProps {
  stat?: string;
  caption?: string;
}

export const ForRetailers: React.FC<ForRetailersProps> = ({
  stat = '3×',
  caption = 'more looks explored in one store visit',
}) => {
  return (
    <section id="retailers" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.info}>
          <span className={styles.eyebrow}>For retailers</span>
          <h2 className={styles.heading}>
            More time choosing.<br />Less time changing.
          </h2>
          <p className={styles.copy}>
            Help customers narrow their choices before entering the fitting room, with less garment handling along the way.
          </p>
        </div>

        <div className={styles.statBox}>
          <strong className={styles.stat}>{stat}</strong>
          <span className={styles.statCaption}>{caption}</span>
        </div>
      </div>
    </section>
  );
};
