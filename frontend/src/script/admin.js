// Importar configuración
import Config from '../utils/Config.js';

// Variables globales
let adminUserData = null;

// Función para mostrar el modal de código de administrador
window.mostrarModalAdmin = function(userData) {
    adminUserData = userData;
    const modal = document.getElementById('modal-admin');
    if (modal) {
        modal.classList.remove('hidden');
        // Enfocar el campo de código
        const codeInput = document.getElementById('admin-code');
        if (codeInput) {
            codeInput.focus();
        }
    }
}

// Función para cerrar el modal de administrador
window.cerrarModalAdmin = function() {
    const modal = document.getElementById('modal-admin');
    if (modal) {
        modal.classList.add('hidden');
        // Limpiar el formulario
        const form = document.getElementById('form-admin-code');
        if (form) {
            form.reset();
        }
    }
}

// Función para verificar código de administrador
async function verificarCodigoAdmin(codigo) {
    try {
        const response = await fetch(Config.getAdminUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'verificar_codigo_admin',
                admin_user_id: adminUserData.id,
                codigo: codigo
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al verificar código:', error);
        return {
            success: false,
            message: 'Error de conexión. Verifica tu conexión a internet.'
        };
    }
}

// Función para redirigir al panel de administración
function redirigirAlPanelAdmin() {
    // Guardar sesión de administrador en localStorage
    const adminSession = {
        user: adminUserData,
        isAdmin: true,
        adminVerified: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('adminSession', JSON.stringify(adminSession));
    
    // Redirigir al panel de administración
    window.location.href = '/admin-panel';
}

// Manejar el formulario de código de administrador
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-admin-code');
    const submitButton = document.getElementById('btn-admin-submit');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (submitButton.disabled) {
                return;
            }
            
            const codeInput = document.getElementById('admin-code');
            const codigo = codeInput ? codeInput.value.trim() : '';
            
            if (!codigo) {
                if (window.showToast) {
                    await window.showToast.error('Por favor, ingresa el código de administrador');
                } else {
                    alert('Por favor, ingresa el código de administrador');
                }
                return;
            }
            
            // Mostrar spinner y deshabilitar botón
            mostrarSpinnerAdmin(submitButton);
            
            try {
                const result = await verificarCodigoAdmin(codigo);
                
                if (result.success) {
                    if (window.showToast) {
                        await window.showToast.success('Código verificado correctamente');
                    }
                    
                    // Cerrar modal y redirigir al panel
                    setTimeout(() => {
                        cerrarModalAdmin();
                        redirigirAlPanelAdmin();
                    }, 1000);
                } else {
                    if (window.showToast) {
                        await window.showToast.error(result.message || 'Código incorrecto');
                    } else {
                        alert(result.message || 'Código incorrecto');
                    }
                    
                    // Limpiar campo de código
                    if (codeInput) {
                        codeInput.value = '';
                        codeInput.focus();
                    }
                }
            } catch (error) {
                if (window.showToast) {
                    await window.showToast.error('Error al verificar el código');
                } else {
                    alert('Error al verificar el código');
                }
            } finally {
                // Restaurar botón
                restaurarBotonAdmin(submitButton);
            }
        });
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-admin');
            if (modal && !modal.classList.contains('hidden')) {
                cerrarModalAdmin();
            }
        }
    });
    
    // Cerrar modal al hacer clic fuera
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-admin');
        if (modal && e.target === modal) {
            cerrarModalAdmin();
        }
    });
});

// Función para mostrar spinner en el botón de administrador
function mostrarSpinnerAdmin(button) {
    button.disabled = true;
    button.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Verificando...</span>
        </div>
    `;
    button.classList.add('opacity-75', 'cursor-not-allowed');
}

// Función para restaurar el botón de administrador
function restaurarBotonAdmin(button) {
    button.disabled = false;
    button.innerHTML = 'Verificar Código';
    button.classList.remove('opacity-75', 'cursor-not-allowed');
} 