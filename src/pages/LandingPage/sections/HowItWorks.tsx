import React from 'react';
import styles from './HowItWorks.module.css';

interface Step {
  num: string;
  label: string;
  description: string;
  tag: string;
}

const STEPS: Step[] = [
  {
    num: '01',
    tag: 'CALIBRATION',
    label: 'Spatial Alignment',
    description: 'The camera captures your proportions automatically—no manual measurements or complex sensors required.',
  },
  {
    num: '02',
    tag: 'EXPLORATION',
    label: 'Curated Wardrobe',
    description: 'Browse the collection directly from the sidebar. Switch garments seamlessly with a single interaction.',
  },
  {
    num: '03',
    tag: 'SIMULATION',
    label: 'Intelligent Drape',
    description: 'Move, rotate, and raise your arms. The mesh conforms to your body, deforming and folding naturally in real time.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="product" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>EXPERIENCE THE SYSTEM</span>
          <h2 className={styles.title}>A quieter, refined way to try.</h2>
        </div>
        
        <div className={styles.grid}>
          {STEPS.map((step, index) => (
            <article key={index} className={styles.card}>
              {/* Expanding Gold Hover Indicator */}
              <div className={styles.hoverLine} />
              
              <div className={styles.cardHeader}>
                <span className={styles.num}>{step.num}</span>
                <span className={styles.tag}>{step.tag}</span>
              </div>
              
              <h3 className={styles.label}>{step.label}</h3>
              <p className={styles.description}>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
