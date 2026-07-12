import React, { useEffect, useRef, useState } from 'react';
import styles from './LuxuryStorytelling.module.css';

export const LuxuryStorytelling: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section id="story" ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>THE NEW PHILOSOPHY</span>
          <h2 className={`${styles.headline} ${isVisible ? styles.revealText : ''}`}>
            Crafted for the human form.
          </h2>
          <p className={styles.paragraph}>
            We believe that virtual try-on should not feel like an engineering demo. It should feel like stepping into a flagship boutique on Rue du Faubourg Saint-Honoré, where the lighting is soft, the materials are tactile, and the garment drapes perfectly around you.
          </p>
          <div className={styles.divider} />
          <p className={styles.subtext}>
            Using advanced custom shaders, our system models fabric drape with sub-centimeter accuracy, adjusting in real time to your subtle sways and bends. We respect the texture, the weight, and the silhouette of every fabric thread.
          </p>
        </div>
        
        <div className={styles.right}>
          {/* Masked image reveal simulation using CSS animations */}
          <div className={`${styles.imageFrame} ${isVisible ? styles.revealImage : ''}`}>
            <div className={styles.imageOverlay} />
            <div className={styles.editorialGraphic}>
              <div className={styles.editorialPattern} />
              <div className={styles.editorialText}>DRAPE COUTURE</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LuxuryStorytelling;
