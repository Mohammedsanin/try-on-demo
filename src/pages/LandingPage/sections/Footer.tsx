import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>DRAPE</span>
          <p className={styles.copy}>Virtual Fitting Studio. Reimagining the retail fitting room.</p>
        </div>
        <a href="mailto:hello@drape.studio" className={styles.email}>
          hello@drape.studio
        </a>
      </div>
    </footer>
  );
};
