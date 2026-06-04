import { useState, useEffect } from 'react';
import type { FloatingNavbarProps } from './_types';
import { MobileNavbar } from './MobileNavbar';
import { DesktopNavbar } from './DesktopNavbar';

export function FloatingNavbar(props: FloatingNavbarProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const check = () => setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Only render after mount to avoid hydration mismatch
  if (!isMounted) return null;

  return isDesktop ? <DesktopNavbar {...props} /> : <MobileNavbar {...props} />;
}
