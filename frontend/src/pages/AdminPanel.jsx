import React, { useState, useEffect } from 'react';
import Config from '../utils/Config.js';
import { Edit, Trash2, Eye, Settings, Shield, Plus, UserMinus, X, Upload, FileText } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import ModalParticipaciones from '../components/ModalParticipaciones.jsx';

const AdminPanelComponent = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina] = useState(15);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalParticipacionesOpen, setModalParticipacionesOpen] = useState(false);
  const [modalCodigoAdminOpen, setModalCodigoAdminOpen] = useState(false);
  const [modalSubirArchivoOpen, setModalSubirArchivoOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    filtrarUsuarios();
  }, [usuarios, filtro]);

  const cargarUsuarios = async (pagina = paginaActual) => {
    try {
      setLoading(true);
      const adminSession = localStorage.getItem('adminSession');
      if (!adminSession) {
        setError('No hay sesión de administrador');
        return;
      }

      const sessionData = JSON.parse(adminSession);
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'obtener_usuarios',
          admin_user_id: sessionData.user.id,
          pagina: pagina,
          por_pagina: porPagina
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.usuarios);
        setTotalUsuarios(data.total);
        setPaginaActual(data.pagina_actual);
        setTotalPaginas(data.total_paginas);
      } else {
        setError(data.message || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filtrarUsuarios = () => {
    let usuariosFiltrados = [];
    
    switch (filtro) {
      case 'administradores':
        usuariosFiltrados = usuarios.filter(usuario => usuario.es_admin === 1);
        break;
      case 'usuarios':
        usuariosFiltrados = usuarios.filter(usuario => usuario.es_admin === 0);
        break;
      default:
        usuariosFiltrados = usuarios;
        break;
    }
    
    setUsuariosFiltrados(usuariosFiltrados);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('adminSession');
    window.location.href = '/';
  };

  const handleEditar = (usuario) => {
    setSelectedUser(usuario);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleEliminar = (usuario) => {
    setSelectedUser(usuario);
    setModalMode('delete');
    setModalOpen(true);
  };

  const handleVerParticipaciones = (usuario) => {
    setSelectedUser(usuario);
    setModalParticipacionesOpen(true);
  };

  const handleVerOpcionesAdmin = (usuario) => {
    console.log('Ver opciones de admin para:', usuario);
    // Aquí irá la lógica para ver opciones de administrador
  };

  const handleDarAdmin = (usuario) => {
    setSelectedUser(usuario);
    setModalCodigoAdminOpen(true);
  };

  const handleCloseModalCodigoAdmin = () => {
    setModalCodigoAdminOpen(false);
    setSelectedUser(null);
  };

  const handleConfirmarDarAdmin = async (codigo) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'dar_admin',
          admin_user_id: sessionData.user.id,
          user_id: selectedUser.id,
          codigo: codigo
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar la lista de usuarios
        await cargarUsuarios();
        setModalCodigoAdminOpen(false);
        setSelectedUser(null);
        if (window.showToast) {
          await window.showToast.success('Usuario promovido a administrador correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al dar admin al usuario');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al dar admin:', error);
      if (window.showToast) {
        await window.showToast.error('Error al dar admin al usuario');
      }
    }
  };

  const handleQuitarAdmin = async (usuario) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'quitar_admin',
          admin_user_id: sessionData.user.id,
          user_id: usuario.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar la lista de usuarios
        await cargarUsuarios();
        if (window.showToast) {
          await window.showToast.success('Privilegios de administrador removidos correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al quitar admin al usuario');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al quitar admin:', error);
      if (window.showToast) {
        await window.showToast.error('Error al quitar admin al usuario');
      }
    }
  };

  const handleAgregarUsuario = () => {
    setSelectedUser(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseModalParticipaciones = () => {
    setModalParticipacionesOpen(false);
    setSelectedUser(null);
  };

  const handleSubirArchivo = () => {
    setModalSubirArchivoOpen(true);
  };

  const handleCloseModalSubirArchivo = () => {
    setModalSubirArchivoOpen(false);
    setSelectedFile(null);
    setFileName('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        if (window.showToast) {
          window.showToast.error('Solo se permiten archivos CSV y Excel (.xls, .xlsx)');
        }
        event.target.value = '';
        return;
      }
      
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        if (window.showToast) {
          window.showToast.error('El archivo es demasiado grande. Máximo 5MB');
        }
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      if (window.showToast) {
        window.showToast.error('Por favor selecciona un archivo');
      }
      return;
    }

    try {
      setUploading(true);
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('action', 'subir_usuarios_archivo');
      formData.append('admin_user_id', sessionData.user.id);
      formData.append('archivo', selectedFile);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        await cargarUsuarios();
        if (window.showToast) {
          await window.showToast.success(data.message);
        }
        handleCloseModalSubirArchivo();
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      if (window.showToast) {
        await window.showToast.error('Error al subir archivo');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      cargarUsuarios(nuevaPagina);
    }
  };

  const generarBotonesPaginacion = () => {
    const botones = [];
    const maxBotones = 5;
    
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
    
    if (fin - inicio + 1 < maxBotones) {
      inicio = Math.max(1, fin - maxBotones + 1);
    }
    
    // Botón "Anterior"
    if (paginaActual > 1) {
      botones.push(
        <button
          key="prev"
          onClick={() => handleCambiarPagina(paginaActual - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 cursor-pointer"
        >
          Anterior
        </button>
      );
    }
    
    // Botones de páginas
    for (let i = inicio; i <= fin; i++) {
      botones.push(
        <button
          key={i}
          onClick={() => handleCambiarPagina(i)}
          className={`px-3 py-2 text-sm font-medium border cursor-pointer ${
            i === paginaActual
              ? 'bg-[#cf152d] text-white border-[#cf152d]'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Botón "Siguiente"
    if (paginaActual < totalPaginas) {
      botones.push(
        <button
          key="next"
          onClick={() => handleCambiarPagina(paginaActual + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 cursor-pointer"
        >
          Siguiente
        </button>
      );
    }
    
    return botones;
  };

  const handleSaveUser = async (formData) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: modalMode === 'add' ? 'agregar_usuario' : 'editar_usuario',
          admin_user_id: sessionData.user.id,
          user_data: formData,
          user_id: modalMode === 'edit' ? selectedUser.id : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar la lista de usuarios
        await cargarUsuarios();
        if (window.showToast) {
          await window.showToast.success(data.message || 'Usuario guardado correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al guardar usuario');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (window.showToast) {
        await window.showToast.error('Error al guardar usuario');
      }
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'eliminar_usuario',
          admin_user_id: sessionData.user.id,
          user_id: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar la lista de usuarios
        await cargarUsuarios();
        if (window.showToast) {
          await window.showToast.success(data.message || 'Usuario eliminado correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al eliminar usuario');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      if (window.showToast) {
        await window.showToast.error('Error al eliminar usuario');
      }
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-6 w-6 text-[#cf152d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Cargando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={cargarUsuarios}
              className="mt-4 bg-[#cf152d] text-white px-4 py-2 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Card */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6 max-w-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">{totalUsuarios}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-200">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
               <h2 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h2>
               <div className="flex items-center space-x-4">
                 <button
                   onClick={handleAgregarUsuario}
                   className="bg-[#cf152d] text-white px-4 py-2 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer flex items-center space-x-2"
                 >
                   <Plus size={16} />
                   <span>Agregar Usuario</span>
                 </button>
                 <button
                   onClick={handleSubirArchivo}
                   className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-2"
                 >
                   <Upload size={16} />
                   <span>Subir Archivo</span>
                 </button>
                 <label htmlFor="filtro" className="text-sm font-medium text-gray-700">
                   Filtrar por:
                 </label>
                 <select
                   id="filtro"
                   value={filtro}
                   onChange={(e) => setFiltro(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200 text-sm"
                 >
                   <option value="todos">Todos los usuarios</option>
                   <option value="administradores">Solo administradores</option>
                   <option value="usuarios">Solo usuarios</option>
                 </select>
                 <span className="text-sm text-gray-500">
                   ({usuariosFiltrados.length} de {totalUsuarios})
                 </span>
               </div>
             </div>
           </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apellido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.usuario}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.es_admin === 1 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {usuario.es_admin === 1 ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <div className="flex items-center space-x-3">
                         <button
                           onClick={() => handleEditar(usuario)}
                           className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50 cursor-pointer"
                           title="Editar usuario"
                         >
                           <Edit size={18} />
                         </button>
                         <button
                           onClick={() => handleEliminar(usuario)}
                           className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                           title="Eliminar usuario"
                         >
                           <Trash2 size={18} />
                         </button>
                                                   {usuario.es_admin === 0 && (
                            <button
                              onClick={() => handleVerParticipaciones(usuario)}
                              className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-md hover:bg-green-50 cursor-pointer"
                              title="Ver participaciones"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                         {usuario.es_admin === 1 ? (
                           <button
                             onClick={() => handleQuitarAdmin(usuario)}
                             className="text-purple-600 hover:text-purple-800 transition-colors p-1 rounded-md hover:bg-purple-50 cursor-pointer"
                             title="Quitar admin"
                           >
                             <UserMinus size={18} />
                           </button>
                         ) : (
                           <button
                             onClick={() => handleDarAdmin(usuario)}
                             className="text-orange-600 hover:text-orange-800 transition-colors p-1 rounded-md hover:bg-orange-50 cursor-pointer"
                             title="Dar admin"
                           >
                             <Shield size={18} />
                           </button>
                         )}
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {usuariosFiltrados.length === 0 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filtro === 'todos' 
                  ? 'No hay usuarios registrados en el sistema.' 
                  : `No hay usuarios que coincidan con el filtro "${filtro}".`
                }
              </p>
            </div>
          )}
          
          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{((paginaActual - 1) * porPagina) + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(paginaActual * porPagina, totalUsuarios)}
                  </span>{' '}
                  de <span className="font-medium">{totalUsuarios}</span> usuarios
                </div>
                <div className="flex space-x-1">
                  {generarBotonesPaginacion()}
                </div>
              </div>
            </div>
          )}
                 </div>
       </main>

       {/* Modal */}
       <Modal
         isOpen={modalOpen}
         onClose={handleCloseModal}
         mode={modalMode}
         user={selectedUser}
         onSave={handleSaveUser}
         onDelete={handleDeleteUser}
       />

       {/* Modal Participaciones */}
               <ModalParticipaciones
          isOpen={modalParticipacionesOpen}
          onClose={handleCloseModalParticipaciones}
          user={selectedUser}
        />

        {/* Modal de Código de Administrador */}
        {modalCodigoAdminOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Dar Administrador</h3>
                </div>
                <button
                  onClick={handleCloseModalCodigoAdmin}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleConfirmarDarAdmin(formData.get('codigo'));
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={`${selectedUser?.nombre} ${selectedUser?.apellido} (${selectedUser?.usuario})`}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Administrador
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                      placeholder="Ingresa el código de administrador"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Este código será usado para acceder al panel de administración
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModalCodigoAdmin}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      Dar Administrador
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para subir archivo de usuarios */}
        {modalSubirArchivoOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Subir Usuarios desde Archivo</h3>
                </div>
                <button
                  onClick={handleCloseModalSubirArchivo}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Archivo
                    </label>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                    />
                    {fileName && (
                      <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg mt-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-sm text-green-700">{fileName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Formato requerido:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Archivo CSV con las columnas: <strong>nombre, apellido, usuario, contrasena</strong></p>
                      <p>• La primera fila debe ser el encabezado</p>
                      <p>• Las contraseñas se encriptarán automáticamente</p>
                      <p>• Usuarios duplicados serán omitidos</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModalSubirArchivo}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUploadFile}
                      disabled={!selectedFile || uploading}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Subir Archivo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default AdminPanelComponent;
