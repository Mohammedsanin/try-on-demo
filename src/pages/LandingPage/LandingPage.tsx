import React from 'react';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { LuxuryStorytelling } from './sections/LuxuryStorytelling';
import { FeatureShowcase } from './sections/FeatureShowcase';
import { ForRetailers } from './sections/ForRetailers';
import { Footer } from './sections/Footer';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
  return (
    <main className={styles.main}>
      <Header />
      <Hero />
      <HowItWorks />
      <LuxuryStorytelling />
      <FeatureShowcase />
      <ForRetailers />
      <Footer />
    </main>
  );
};
export default LandingPage;
