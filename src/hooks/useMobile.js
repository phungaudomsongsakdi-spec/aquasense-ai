// ✅ src/hooks/useMobile.js
import { useState, useEffect } from 'react';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    // ตรวจสอบเบื้องต้นจาก user agent
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({
        width,
        height: window.innerHeight,
      });
      setIsMobile(width < 768);
    };

    // ตั้งค่า initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { 
    isMobile, 
    windowSize,
    isSmallMobile: windowSize.width < 400,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024
  };
};

// Hook สำหรับตรวจสอบ orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return orientation;
};