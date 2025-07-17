// Importar configuración
import Config from '../utils/Config.js';

// Variables globales para paginación
let certificadosActuales = [];
let paginaActual = 1;
const certificadosPorPagina = 4;

// Funcionalidad de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usuario = document.querySelector('input[type="text"]').value;
            const contrasena = document.querySelector('input[type="password"]').value;
            
            if (!usuario || !contrasena) {
                alert('Por favor, completa todos los campos');
                return;
            }
            
            try {
                const response = await fetch(Config.getLoginUrl(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        usuario: usuario,
                        contrasena: contrasena
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Obtener certificados del usuario
                    await obtenerCertificados(data.user.id);
                } else {
                    alert(data.message || 'Error al iniciar sesión');
                }
            } catch (error) {
                alert('Error de conexión. Intenta nuevamente.');
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
        alert('Error al obtener certificados');
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
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
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
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
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
                <div class="flex justify-between items-start">
                    <div class="flex items-start space-x-3 flex-1">
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
                            class="bg-[#cf152d] text-white px-4 py-2 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3 3-3m-6 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Descargar</span>
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
                <div class="mt-6 flex items-center justify-between">
                    <div class="text-sm text-gray-600">
                        Mostrando ${inicio + 1} - ${Math.min(fin, totalCertificados)} de ${totalCertificados} certificados
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="cambiarPagina(${paginaActual - 1})" 
                                class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                                ${paginaActual === 1 ? 'disabled' : ''}>
                            Anterior
                        </button>
                        <div class="flex space-x-1">
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

// Función para descargar certificado (placeholder)
function descargarCertificado(nroCertificado) {
    alert(`Descargando certificado: ${nroCertificado}`);
    // Aquí puedes implementar la lógica de descarga
}
