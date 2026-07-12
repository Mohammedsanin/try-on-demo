import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MirrorFrame } from '../../../components/shared/MirrorFrame';
import styles from './Hero.module.css';

interface HeroProps {
  demoSrc?: string;
}

export const Hero: React.FC<HeroProps> = ({ demoSrc }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="top" className={styles.hero}>
      {/* Volumetric background glows */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      
      {/* Subtle floating dust particles */}
      <div className={styles.dustContainer}>
        <div className={styles.dust} style={{ top: '20%', left: '15%', animationDelay: '0s' }} />
        <div className={styles.dust} style={{ top: '60%', left: '30%', animationDelay: '3s' }} />
        <div className={styles.dust} style={{ top: '80%', left: '10%', animationDelay: '1s' }} />
        <div className={styles.dust} style={{ top: '30%', left: '80%', animationDelay: '5s' }} />
        <div className={styles.dust} style={{ top: '70%', left: '70%', animationDelay: '2s' }} />
      </div>

      <div className={styles.copy}>
        <span className={`${styles.eyebrow} ${mounted ? styles.animateFadeUp : ''}`}>
          THE FITTING ROOM, REIMAGINED
        </span>
        
        <h1 className={`${styles.headline} ${mounted ? styles.animateHeadline : ''}`}>
          <span>See it on.</span>
          <span>Before you</span>
          <span>try it on.</span>
        </h1>
        
        <p className={`${styles.subhead} ${mounted ? styles.animateFadeUp2 : ''}`}>
          Stand in front of the mirror. Pick a piece. See exactly how it looks—without changing a thing. Experience the touch of digital drape.
        </p>

        <div className={`${styles.ctaGroup} ${mounted ? styles.animateFadeUp3 : ''}`}>
          <button onClick={() => navigate('/app')} className={styles.btnPrimary}>
            <span className={styles.btnBg} />
            <span className={styles.btnContent}>
              Enter Studio
              <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </button>
          <button 
            onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })} 
            className={styles.btnSecondary}
          >
            Explore Craft
          </button>
        </div>
      </div>

      <div className={styles.device}>
        <div className={styles.mirrorWrapper}>
          <MirrorFrame state="active">
            {demoSrc ? (
              <video
                className={styles.video}
                src={demoSrc}
                autoPlay
                loop
                muted
                playsInline
                aria-label="TryOn live mirror demonstration video"
              />
            ) : (
              <div className={styles.placeholder} onClick={() => navigate('/app')} role="button" aria-label="Enter Fitting Studio">
                {/* Glare Glass Overlay */}
                <div className={styles.glareOverlay} />
                
                {/* Flowing Silk Waves (SVG simulation) */}
                <div className={styles.silkWaveContainer}>
                  <svg className={styles.silkWave} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0 50 Q 25 35, 50 50 T 100 50 L 100 100 L 0 100 Z" fill="rgba(181, 138, 60, 0.03)" />
                    <path d="M 0 60 Q 30 45, 60 60 T 100 60 L 100 100 L 0 100 Z" fill="rgba(181, 138, 60, 0.05)" />
                  </svg>
                </div>

                <div className={styles.placeholderCopy}>
                  <span className={styles.placeholderLabel}>Live fitting mirror</span>
                  <strong className={styles.placeholderTitle}>
                    Step closer.<br />This is your look.
                  </strong>
                </div>

                {/* Elegantly styled breathing silhouette */}
                <div className={styles.figure}>
                  <div className={styles.head} />
                  <div className={styles.torso} />
                  <div className={styles.legs} />
                </div>
              </div>
            )}
          </MirrorFrame>
        </div>
      </div>
    </section>
  );
};

export default Hero;
