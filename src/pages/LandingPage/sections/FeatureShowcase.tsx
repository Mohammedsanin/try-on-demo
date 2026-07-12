import React from 'react';
import styles from './FeatureShowcase.module.css';

interface FeatureCard {
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  icon: string;
}

const FEATURES: FeatureCard[] = [
  {
    tag: 'SPATIAL VISION',
    title: 'Zero Latency Pose Tracking',
    subtitle: 'Dual-axis 2D/3D tracking',
    description: 'We calculate bone structures and landmark coordinates directly inside the main render thread, matching your body movement instantly.',
    icon: '✦',
  },
  {
    tag: 'DEFORMATION ENGINE',
    title: 'Intelligent Free-Form Drape',
    subtitle: 'Rest-pose weight calculations',
    description: 'Every mesh vertex conforms dynamically to your shape using customized anchor deltas compiled on the GPU, avoiding cardboard flat panel looks.',
    icon: '◈',
  },
  {
    tag: 'DEPTH & SORTING',
    title: 'Volumetric Depth Occlusion',
    subtitle: 'Capsule-based write pass',
    description: 'We depth-write invisible capsules to represent your arms. When your arm crosses your chest, the fabric hides correctly behind it.',
    icon: '⎔',
  },
];

export const FeatureShowcase: React.FC = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>TECHNICAL ARCHITECTURE</span>
          <h2 className={styles.title}>Engineered like fine jewelry.</h2>
        </div>

        <div className={styles.showcaseWrapper}>
          <div className={styles.scrollContainer}>
            {FEATURES.map((feature, idx) => (
              <div key={idx} className={styles.card}>
                <div className={styles.cardGlass} />
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <span className={styles.tag}>{feature.tag}</span>
                    <span className={styles.icon}>{feature.icon}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                  <h4 className={styles.cardSubtitle}>{feature.subtitle}</h4>
                  <p className={styles.cardDesc}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
