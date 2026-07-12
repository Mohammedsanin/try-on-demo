import React from 'react';
import styles from './StatusDot.module.css';

interface StatusDotProps {
  status: 'live' | 'ready' | 'error';
  className?: string;
}

const statusConfig = {
  live: {
    colorClass: styles.brassDot,
    label: 'Live',
  },
  ready: {
    colorClass: styles.sageDot,
    label: 'Ready',
  },
  error: {
    colorClass: styles.stoneDot,
    label: 'Offline',
  },
};

export const StatusDot: React.FC<StatusDotProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.error;

  return (
    <div className={`${styles.container} ${className}`}>
      <span className={`${styles.dot} ${config.colorClass}`} aria-hidden="true" />
      <span className={styles.label}>{config.label}</span>
    </div>
  );
};
