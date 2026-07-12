import React, { useEffect, useRef, useState } from 'react';
import styles from './CustomCursor.module.css';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<boolean>(true);
  const [hovered, setHovered] = useState<boolean>(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Add custom cursor class to body
    document.body.classList.add('has-custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (hidden) setHidden(false);
    };

    const handleMouseLeaveWindow = () => {
      setHidden(true);
    };

    const handleMouseEnterWindow = () => {
      setHidden(false);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.addEventListener('mouseenter', handleMouseEnterWindow);

    // Track hover states for interactive elements
    const updateHoverStates = () => {
      const interactives = document.querySelectorAll('a, button, select, input, [role="button"], [role="radio"]');
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', () => setHovered(true));
        el.addEventListener('mouseleave', () => setHovered(false));
      });
    };

    // Run once and on DOM changes (since React changes views)
    updateHoverStates();
    const observer = new MutationObserver(updateHoverStates);
    observer.observe(document.body, { childList: true, subtree: true });

    // requestAnimationFrame loop for smooth tracking
    let frameId: number;
    const animate = () => {
      const dot = dotRef.current;
      const ring = ringRef.current;

      if (dot && ring && !hidden) {
        // Dot follows cursor exactly
        dot.style.transform = `translate3d(${mouseRef.current.x}px, ${mouseRef.current.y}px, 0)`;

        // Ring follows cursor with inertia (lerp)
        const lerpFactor = 0.15;
        ringPosRef.current.x += (mouseRef.current.x - ringPosRef.current.x) * lerpFactor;
        ringPosRef.current.y += (mouseRef.current.y - ringPosRef.current.y) * lerpFactor;
        ring.style.transform = `translate3d(${ringPosRef.current.x}px, ${ringPosRef.current.y}px, 0)`;
      }

      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      document.body.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('mouseenter', handleMouseEnterWindow);
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <>
      <div
        ref={dotRef}
        className={`${styles.dot} ${hovered ? styles.dotHover : ''}`}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={`${styles.ring} ${hovered ? styles.ringHover : ''}`}
        aria-hidden="true"
      />
    </>
  );
};

export default CustomCursor;
