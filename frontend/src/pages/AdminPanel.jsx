import React, { useState, useEffect } from 'react';
import Config from '../utils/Config.js';
import { Edit, Trash2, Eye, Settings, Shield, Plus } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import ModalParticipaciones from '../components/ModalParticipaciones.jsx';

const AdminPanelComponent = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalParticipacionesOpen, setModalParticipacionesOpen] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    filtrarUsuarios();
  }, [usuarios, filtro]);

  const cargarUsuarios = async () => {
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
          admin_user_id: sessionData.user.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.usuarios);
        setTotalUsuarios(data.total);
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
    console.log('Dar admin a:', usuario);
    // Aquí irá la lógica para dar permisos de administrador
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#cf152d] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-600">Sistema de Certificados UTEPSA</p>
              </div>
            </div>
            <button
              onClick={cerrarSesion}
              className="text-sm text-[#cf152d] hover:text-[#cf152d]/80 transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

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
                             onClick={() => handleVerOpcionesAdmin(usuario)}
                             className="text-purple-600 hover:text-purple-800 transition-colors p-1 rounded-md hover:bg-purple-50 cursor-pointer"
                             title="Ver opciones de admin"
                           >
                             <Settings size={18} />
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
     </div>
   );
 };

export default AdminPanelComponent;
