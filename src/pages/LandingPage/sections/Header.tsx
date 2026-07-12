import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Platform', sectionId: 'product' },
  { label: 'Story', sectionId: 'story' },
  { label: 'For Retailers', sectionId: 'retailers' },
  { label: 'Contact', sectionId: 'contact' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (sectionId: string) => {
    setMobileMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={styles.wordmark} aria-label="TryOn Home">
        TRYON
      </button>

      <button
        className={`${styles.menuButton} ${mobileMenuOpen ? styles.menuActive : ''}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-controls="siteNav"
        aria-label="Toggle navigation menu"
      >
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
      </button>

      <nav
        id="siteNav"
        className={`${styles.nav} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={styles.navLink}
            onClick={() => handleScrollTo(item.sectionId)}
          >
            {item.label}
          </button>
        ))}
        <button onClick={() => navigate('/app')} className={styles.demoButton}>
          Enter Studio
          <svg className={styles.arrow} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" />
          </svg>
        </button>
      </nav>
    </header>
  );
};
