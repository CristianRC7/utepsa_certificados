// Hook personalizado para usar Sonner desde JavaScript vanilla
export function useToast() {
  // Función para esperar a que Sonner esté disponible
  const waitForSonner = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.sonner) {
        resolve(window.sonner);
      } else {
        const checkSonner = () => {
          if (typeof window !== 'undefined' && window.sonner) {
            resolve(window.sonner);
          } else {
            setTimeout(checkSonner, 100);
          }
        };
        checkSonner();
      }
    });
  };

  // Función para mostrar toast de éxito
  const success = async (message, options = {}) => {
    const sonner = await waitForSonner();
    sonner.success(message, options);
  };

  // Función para mostrar toast de error
  const error = async (message, options = {}) => {
    const sonner = await waitForSonner();
    sonner.error(message, options);
  };

  // Función para mostrar toast de información
  const info = async (message, options = {}) => {
    const sonner = await waitForSonner();
    sonner.info(message, options);
  };

  // Función para mostrar toast de advertencia
  const warning = async (message, options = {}) => {
    const sonner = await waitForSonner();
    sonner.warning(message, options);
  };

  // Función para mostrar toast de carga
  const loading = async (message, options = {}) => {
    const sonner = await waitForSonner();
    return sonner.loading(message, options);
  };

  // Función para mostrar toast personalizado
  const toast = async (message, options = {}) => {
    const sonner = await waitForSonner();
    sonner(message, options);
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    toast
  };
} 