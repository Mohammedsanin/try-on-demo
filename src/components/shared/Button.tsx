import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  variant: 'primary' | 'ghost';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const buttonClass = `${styles.button} ${
    variant === 'primary' ? styles.primary : styles.ghost
  } ${className}`;

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
