// Extender la interfaz Window para incluir Sonner
declare global {
  interface Window {
    sonner?: {
      success: (message: string, options?: any) => void;
      error: (message: string, options?: any) => void;
      info: (message: string, options?: any) => void;
      warning: (message: string, options?: any) => void;
      loading: (message: string, options?: any) => any;
      toast: (message: string, options?: any) => void;
    };
    showToast?: {
      success: (message: string) => Promise<void>;
      error: (message: string) => Promise<void>;
      info: (message: string) => Promise<void>;
      warning: (message: string) => Promise<void>;
    };
    mostrarModalContrasena?: () => void;
    cerrarModalContrasena?: () => void;
    cerrarModal?: () => void;
    cambiarPagina?: (nuevaPagina: number) => void;
  }
}

export {}; 