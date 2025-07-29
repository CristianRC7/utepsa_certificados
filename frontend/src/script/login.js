// Importar configuración
import Config from '../utils/Config.js';

// Variables globales para paginación
let certificadosActuales = [];
let paginaActual = 1;
const certificadosPorPagina = 4;
let usuarioActualId = null;

// Funcionalidad de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            
            // Verificar si ya está procesando
            if (submitButton.disabled) {
                return;
            }
            
            const usuario = document.querySelector('input[name="usuario"]').value;
            const contrasena = document.querySelector('input[name="contrasena"]');
            const contrasenaValue = contrasena ? contrasena.value : '';
            
            if (!usuario || !contrasenaValue) {
                if (window.showToast) {
                    await window.showToast.error('Por favor, completa todos los campos');
                } else {
                    alert('Por favor, completa todos los campos');
                }
                return;
            }
            
            // Mostrar spinner y deshabilitar botón
            mostrarSpinner(submitButton);
            
            try {
                const response = await fetch(Config.getLoginUrl(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        usuario: usuario,
                        contrasena: contrasenaValue
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Guardar el ID del usuario
                    usuarioActualId = data.user.id;
                    // Obtener certificados del usuario
                    await obtenerCertificados(data.user.id);
                } else {
                    // Manejar diferentes tipos de error
                    let mensajeError = data.message || 'Error al iniciar sesión';
                    
                    if (data.error_type === 'user_not_found') {
                        if (window.showToast) {
                            await window.showToast.error('El usuario no existe. Verifica tu número de estudiante.');
                        } else {
                            alert('El usuario no existe. Verifica tu número de estudiante.');
                        }
                    } else if (data.error_type === 'wrong_password') {
                        if (window.showToast) {
                            await window.showToast.error('Contraseña incorrecta. Intenta nuevamente.');
                        } else {
                            alert('Contraseña incorrecta. Intenta nuevamente.');
                        }
                    } else if (data.error_type === 'database_error') {
                        if (window.showToast) {
                            await window.showToast.error('Error del servidor. Contacta al administrador.');
                        } else {
                            alert('Error del servidor. Contacta al administrador.');
                        }
                    } else {
                        if (window.showToast) {
                            await window.showToast.error(mensajeError);
                        } else {
                            alert(mensajeError);
                        }
                    }
                }
            } catch (error) {
                if (window.showToast) {
                    await window.showToast.error('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
                } else {
                    alert('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
                }
            } finally {
                // Restaurar botón
                restaurarBoton(submitButton, originalButtonText);
            }
        });
    }
});

// Función para obtener certificados del usuario
async function obtenerCertificados(userId) {
    try {
        const response = await fetch(Config.getCertificadosUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: userId
            })
        });
        
        const data = await response.json();
        mostrarModalCertificados(data);
    } catch (error) {
        if (window.showToast) {
            await window.showToast.error('Error al obtener certificados. Intenta nuevamente.');
        } else {
            alert('Error al obtener certificados. Intenta nuevamente.');
        }
    }
}

// Función para mostrar el modal de certificados con paginación
function mostrarModalCertificados(data) {
    const modal = document.getElementById('modal-certificados');
    const modalContent = document.getElementById('modal-content');
    
    if (data.success && data.certificados && data.certificados.length > 0) {
        certificadosActuales = data.certificados;
        paginaActual = 1;
        modalContent.innerHTML = generarHTMLModal();
    } else {
        modalContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">Mis Certificados</h3>
                    <button onclick="cerrarModal()" class="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-6 text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-gray-600">No se encuentra con certificados</p>
                </div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
}

// Función para generar el HTML del modal con paginación
function generarHTMLModal() {
    const totalCertificados = certificadosActuales.length;
    const totalPaginas = Math.ceil(totalCertificados / certificadosPorPagina);
    const inicio = (paginaActual - 1) * certificadosPorPagina;
    const fin = inicio + certificadosPorPagina;
    const certificadosPagina = certificadosActuales.slice(inicio, fin);
    
    let html = `
        <div class="bg-white rounded-lg shadow-xl w-full">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Mis Certificados</h3>
                <button onclick="cerrarModal()" class="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="p-6">
                <div class="space-y-4">
    `;
    
    certificadosPagina.forEach(certificado => {
        html += `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div class="flex flex-col space-y-3">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <svg class="w-8 h-8 text-[#cf152d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900">${certificado.nombre_evento}</h4>
                            <p class="text-sm text-gray-600 mt-1">Nro. Certificado: ${certificado.nro_certificado}</p>
                        </div>
                    </div>
                    <button onclick="descargarCertificado('${certificado.nro_certificado}')" 
                            class="w-full bg-[#cf152d] text-white px-4 py-3 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer flex items-center justify-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3 3-3m-6 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Descargar Certificado</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
    `;
    
    // Agregar paginación si hay más de una página
    if (totalPaginas > 1) {
        html += `
                <div class="mt-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div class="text-sm text-gray-600 text-center sm:text-left">
                        Mostrando ${inicio + 1} - ${Math.min(fin, totalCertificados)} de ${totalCertificados} certificados
                    </div>
                    <div class="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                        <button onclick="cambiarPagina(${paginaActual - 1})" 
                                class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                                ${paginaActual === 1 ? 'disabled' : ''}>
                            Anterior
                        </button>
                        <div class="flex justify-center space-x-1">
        `;
        
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === paginaActual) {
                html += `<span class="px-3 py-2 text-sm bg-[#cf152d] text-white rounded-lg">${i}</span>`;
            } else {
                html += `<button onclick="cambiarPagina(${i})" class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">${i}</button>`;
            }
        }
        
        html += `
                        </div>
                        <button onclick="cambiarPagina(${paginaActual + 1})" 
                                class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                                ${paginaActual === totalPaginas ? 'disabled' : ''}>
                            Siguiente
                        </button>
                    </div>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Función para cambiar de página
window.cambiarPagina = function(nuevaPagina) {
    const totalPaginas = Math.ceil(certificadosActuales.length / certificadosPorPagina);
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = generarHTMLModal();
    }
}

// Función para cerrar el modal
window.cerrarModal = function() {
    const modal = document.getElementById('modal-certificados');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Función para descargar certificado
window.descargarCertificado = async function(nroCertificado) {
    try {
        // Obtener el ID del usuario del localStorage o de alguna variable global
        // Por ahora, vamos a obtenerlo del primer certificado disponible
        if (certificadosActuales.length > 0) {
            // Buscar el certificado específico para obtener información adicional si es necesario
            const certificado = certificadosActuales.find(cert => cert.nro_certificado === nroCertificado);
            
            // Mostrar toast de carga
            if (window.showToast) {
                await window.showToast.info('Generando certificado...');
            }
            
            // Construir la URL de descarga
            const downloadUrl = `${Config.getDownloadUrl()}?userId=${usuarioActualId}&certificateId=${nroCertificado}`;
            
            // Crear un enlace temporal y hacer clic en él para descargar
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `certificado_${nroCertificado}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Mostrar toast de éxito
            if (window.showToast) {
                await window.showToast.success(`Certificado ${nroCertificado} descargado exitosamente`);
            }
        } else {
            if (window.showToast) {
                await window.showToast.error('No se pudo obtener información del certificado');
            } else {
                alert('No se pudo obtener información del certificado');
            }
        }
    } catch (error) {
        if (window.showToast) {
            await window.showToast.error('Error al descargar el certificado');
        } else {
            alert('Error al descargar el certificado');
        }
        console.error('Error al descargar certificado:', error);
    }
}



// Función para mostrar spinner en el botón
function mostrarSpinner(button) {
    button.disabled = true;
    button.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Iniciando sesión...</span>
        </div>
    `;
    button.classList.add('opacity-75', 'cursor-not-allowed');
}

// Función para restaurar el botón
function restaurarBoton(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
    button.classList.remove('opacity-75', 'cursor-not-allowed');
}
