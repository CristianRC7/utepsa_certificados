import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CheckCircle, Clock, Edit, Trash2, Plus } from 'lucide-react';
import Config from '../utils/Config.js';

const ModalParticipaciones = ({ 
  isOpen, 
  onClose, 
  user = null
}) => {
  const [participaciones, setParticipaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingParticipacion, setEditingParticipacion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddParticipacion, setShowAddParticipacion] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      cargarParticipaciones();
    }
  }, [isOpen, user]);

  const cargarParticipaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'obtener_participaciones_usuario',
          admin_user_id: sessionData.user.id,
          user_id: user.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setParticipaciones(data.participaciones);
      } else {
        setError(data.message || 'Error al cargar participaciones');
      }
    } catch (error) {
      console.error('Error al cargar participaciones:', error);
      setError('Error de conexión al cargar participaciones');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoIcon = (estado) => {
    if (estado === 'pagado') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    if (estado === 'pagado') {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-orange-100 text-orange-800';
    }
  };

  const getEstadoTexto = (estado) => {
    if (estado === 'pagado') {
      return 'Pagado';
    } else {
      return 'Pendiente';
    }
  };

  const handleEditar = (participacion) => {
    setEditingParticipacion(participacion);
  };

  const handleEliminar = (participacion) => {
    setShowDeleteConfirm(participacion);
  };

  const handleCancelarEdicion = () => {
    setEditingParticipacion(null);
  };

  const handleCancelarEliminacion = () => {
    setShowDeleteConfirm(null);
  };

  const handleGuardarEdicion = async (formData) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'editar_participacion',
          admin_user_id: sessionData.user.id,
          participacion_id: editingParticipacion.id,
          nro_certificado: formData.nro_certificado,
          estado_pago: formData.estado_pago
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar las participaciones
        await cargarParticipaciones();
        setEditingParticipacion(null);
        if (window.showToast) {
          await window.showToast.success('Participación actualizada correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al actualizar participación');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al actualizar participación:', error);
      if (window.showToast) {
        await window.showToast.error('Error al actualizar participación');
      }
    }
  };

  const handleConfirmarEliminacion = async () => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'eliminar_participacion',
          admin_user_id: sessionData.user.id,
          participacion_id: showDeleteConfirm.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar las participaciones
        await cargarParticipaciones();
        setShowDeleteConfirm(null);
        if (window.showToast) {
          await window.showToast.success('Participación eliminada correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al eliminar participación');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al eliminar participación:', error);
      if (window.showToast) {
        await window.showToast.error('Error al eliminar participación');
      }
    }
  };

  const handleAgregarParticipacion = () => {
    setShowAddParticipacion(true);
  };

  const handleCancelarAgregar = () => {
    setShowAddParticipacion(false);
  };

  const handleGuardarNuevaParticipacion = async (formData) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'agregar_participacion',
          admin_user_id: sessionData.user.id,
          user_id: user.id,
          evento_id: formData.evento_id,
          nro_certificado: formData.nro_certificado,
          estado_pago: formData.estado_pago
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar las participaciones
        await cargarParticipaciones();
        setShowAddParticipacion(false);
        if (window.showToast) {
          await window.showToast.success('Participación agregada correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al agregar participación');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al agregar participación:', error);
      if (window.showToast) {
        await window.showToast.error('Error al agregar participación');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
                         <div>
               <h3 className="text-xl font-semibold text-gray-900">Participaciones del Usuario</h3>
               <p className="text-sm text-gray-600">{user?.nombre} {user?.apellido} ({user?.usuario})</p>
             </div>
           </div>
           <div className="flex items-center space-x-3">
             <button
               onClick={handleAgregarParticipacion}
               className="flex items-center space-x-2 bg-[#cf152d] text-white px-4 py-2 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer"
               title="Agregar participación"
             >
               <Plus className="w-4 h-4" />
               <span>Agregar Participación</span>
             </button>
             <button
               onClick={onClose}
               className="text-gray-400 hover:text-gray-600 cursor-pointer"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-[#cf152d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Cargando participaciones...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={cargarParticipaciones}
                className="mt-4 bg-[#cf152d] text-white px-4 py-2 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : participaciones.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Sin participaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Este usuario no tiene participaciones registradas en eventos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  Participaciones ({participaciones.length})
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Pagado</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>Pendiente</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {participaciones.map((participacion) => (
                  <div key={participacion.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-[#cf152d]/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#cf152d]" />
                          </div>
                          <h5 className="font-medium text-gray-900">{participacion.nombre_evento}</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Nro. Certificado:</span>
                            <span className="ml-2 font-medium text-gray-900">{participacion.nro_certificado}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Estado:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(participacion.estado_pago)}`}>
                              {getEstadoIcon(participacion.estado_pago)}
                              <span className="ml-1">{getEstadoTexto(participacion.estado_pago)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                                             <div className="flex items-center space-x-2 ml-4">
                         <div className={`flex items-center space-x-1 ${participacion.estado_pago === 'pagado' ? 'text-green-600' : 'text-orange-600'}`}>
                           {participacion.estado_pago === 'pagado' ? (
                             <CheckCircle className="w-4 h-4" />
                           ) : (
                             <DollarSign className="w-4 h-4" />
                           )}
                           <span className="text-sm font-medium">
                             {participacion.estado_pago === 'pagado' ? 'Certificado disponible' : 'Pago pendiente'}
                           </span>
                         </div>
                         
                         <div className="flex items-center space-x-1">
                           <button
                             onClick={() => handleEditar(participacion)}
                             className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50 cursor-pointer"
                             title="Editar participación"
                           >
                             <Edit size={16} />
                           </button>
                           <button
                             onClick={() => handleEliminar(participacion)}
                             className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                             title="Eliminar participación"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
                 </div>
       </div>

       {/* Modal de Edición */}
       {editingParticipacion && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                   <Edit className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900">Editar Participación</h3>
               </div>
               <button
                 onClick={handleCancelarEdicion}
                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="p-6">
               <form onSubmit={(e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 handleGuardarEdicion({
                   nro_certificado: formData.get('nro_certificado'),
                   estado_pago: formData.get('estado_pago')
                 });
               }} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Evento
                   </label>
                   <input
                     type="text"
                     value={editingParticipacion.nombre_evento}
                     disabled
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Número de Certificado
                   </label>
                   <input
                     type="text"
                     name="nro_certificado"
                     defaultValue={editingParticipacion.nro_certificado}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                     placeholder="Ingresa el número de certificado"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Estado de Pago
                   </label>
                   <select
                     name="estado_pago"
                     defaultValue={editingParticipacion.estado_pago}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                     required
                   >
                     <option value="pendiente">Pendiente</option>
                     <option value="pagado">Pagado</option>
                   </select>
                 </div>
                 
                 <div className="flex space-x-3 pt-4">
                   <button
                     type="button"
                     onClick={handleCancelarEdicion}
                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                   >
                     Cancelar
                   </button>
                   <button
                     type="submit"
                     className="flex-1 px-4 py-3 bg-[#cf152d] text-white rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer"
                   >
                     Guardar Cambios
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Confirmación de Eliminación */}
       {showDeleteConfirm && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                   <Trash2 className="w-6 h-6 text-red-600" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900">Eliminar Participación</h3>
               </div>
               <button
                 onClick={handleCancelarEliminacion}
                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="p-6">
               <div className="text-center">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Trash2 className="w-8 h-8 text-red-600" />
                 </div>
                 <h4 className="text-lg font-medium text-gray-900 mb-2">
                   ¿Eliminar participación?
                 </h4>
                 <p className="text-gray-600 mb-6">
                   ¿Estás seguro de que quieres eliminar la participación en{' '}
                   <span className="font-semibold">{showDeleteConfirm.nombre_evento}</span>?
                   Esta acción no se puede deshacer.
                 </p>
                 <div className="flex space-x-3">
                   <button
                     onClick={handleCancelarEliminacion}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                   >
                     Cancelar
                   </button>
                   <button
                     onClick={handleConfirmarEliminacion}
                     className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                   >
                     Eliminar
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Agregar Participación */}
       {showAddParticipacion && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-[#cf152d]/10 rounded-lg flex items-center justify-center">
                   <Plus className="w-6 h-6 text-[#cf152d]" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900">Agregar Participación</h3>
               </div>
               <button
                 onClick={handleCancelarAgregar}
                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="p-6">
               <form onSubmit={(e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 handleGuardarNuevaParticipacion({
                   evento_id: formData.get('evento_id'),
                   nro_certificado: formData.get('nro_certificado'),
                   estado_pago: formData.get('estado_pago')
                 });
               }} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Usuario
                   </label>
                   <input
                     type="text"
                     value={`${user?.nombre} ${user?.apellido} (${user?.usuario})`}
                     disabled
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Evento
                   </label>
                   <select
                     name="evento_id"
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                     required
                   >
                     <option value="">Selecciona un evento</option>
                     <option value="1">JETS 2022</option>
                     <option value="2">JETS 2023</option>
                     <option value="3">JETS 2024</option>
                     <option value="4">JETS 2025</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Número de Certificado
                   </label>
                   <input
                     type="text"
                     name="nro_certificado"
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                     placeholder="Ingresa el número de certificado"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Estado de Pago
                   </label>
                   <select
                     name="estado_pago"
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                     required
                   >
                     <option value="pendiente">Pendiente</option>
                     <option value="pagado">Pagado</option>
                   </select>
                 </div>
                 
                 <div className="flex space-x-3 pt-4">
                   <button
                     type="button"
                     onClick={handleCancelarAgregar}
                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                   >
                     Cancelar
                   </button>
                   <button
                     type="submit"
                     className="flex-1 px-4 py-3 bg-[#cf152d] text-white rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer"
                   >
                     Agregar Participación
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };



export default ModalParticipaciones; 