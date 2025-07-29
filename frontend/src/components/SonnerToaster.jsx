import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';

export default function SonnerToaster() {
  useEffect(() => {
    // Exponer Sonner globalmente
    if (typeof window !== 'undefined') {
      window.sonner = toast;
    }
  }, []);

  return (
    <Toaster
      position="top-right"
      duration={4000}
      closeButton={true}
      richColors={true}
      expand={true}
      theme='light'
    />
  );
} 