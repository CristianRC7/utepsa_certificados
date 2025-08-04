import React, { useState, useEffect } from 'react';
import Config from '../utils/Config.js';
import { Edit, Trash2, Plus, Search, Eye, X, Upload, Image as ImageIcon } from 'lucide-react';

const EventsPanelComponent = () => {
  const [eventos, setEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [totalEventos, setTotalEventos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina] = useState(15);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalImagenOpen, setModalImagenOpen] = useState(false);
  const [selectedImagen, setSelectedImagen] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    filtrarEventos();
  }, [eventos, busqueda]);

  const cargarEventos = async (pagina = paginaActual) => {
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
          action: 'obtener_eventos',
          admin_user_id: sessionData.user.id,
          pagina: pagina,
          por_pagina: porPagina
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setEventos(data.eventos);
        setTotalEventos(data.total);
        setPaginaActual(data.pagina_actual);
        setTotalPaginas(data.total_paginas);
      } else {
        setError(data.message || 'Error al cargar eventos');
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setError('Error de conexión al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const filtrarEventos = () => {
    let eventosFiltrados = eventos;
    
    if (busqueda.trim()) {
      eventosFiltrados = eventos.filter(evento => 
        evento.nombre_evento.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    
    setEventosFiltrados(eventosFiltrados);
  };

  const handleEditar = (evento) => {
    setSelectedEvent(evento);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleEliminar = (evento) => {
    setSelectedEvent(evento);
    setModalMode('delete');
    setModalOpen(true);
  };

  const handleVerImagen = (evento) => {
    if (evento.imagen_certificado) {
      setSelectedImagen(Config.getCertificatesImageUrl(evento.imagen_certificado));
      setModalImagenOpen(true);
    }
  };

  const handleAgregarEvento = () => {
    setSelectedEvent(null);
    setModalMode('add');
    setModalOpen(true);
  };



  const handleCloseModalImagen = () => {
    setModalImagenOpen(false);
    setSelectedImagen('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        if (window.showToast) {
          window.showToast.error('Solo se permiten archivos PNG y JPG');
        }
        event.target.value = '';
        return;
      }
      
      // Validar tamaño (15MB)
      if (file.size > 15 * 1024 * 1024) {
        if (window.showToast) {
          window.showToast.error('El archivo es demasiado grande. Máximo 15MB');
        }
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedFile(null);
    setFileName('');
  };

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      cargarEventos(nuevaPagina);
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

  const handleDeleteImage = async (evento) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'eliminar_imagen_evento',
          admin_user_id: sessionData.user.id,
          evento_id: evento.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await cargarEventos();
        if (window.showToast) {
          await window.showToast.success(data.message || 'Imagen eliminada correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al eliminar imagen');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      if (window.showToast) {
        await window.showToast.error('Error al eliminar imagen');
      }
    }
  };

  const handleSaveEvent = async (formData) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      formDataToSend.append('action', modalMode === 'add' ? 'agregar_evento' : 'editar_evento');
      formDataToSend.append('admin_user_id', sessionData.user.id);
      formDataToSend.append('evento_data[nombre_evento]', formData.nombre_evento);
      
      if (modalMode === 'edit') {
        formDataToSend.append('evento_id', selectedEvent.id);
      }
      
      // Agregar archivo si se seleccionó
      if (formData.imagen && formData.imagen instanceof File) {
        formDataToSend.append('imagen', formData.imagen);
      }
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.success) {
        await cargarEventos();
        if (window.showToast) {
          await window.showToast.success(data.message || 'Evento guardado correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al guardar evento');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al guardar evento:', error);
      if (window.showToast) {
        await window.showToast.error('Error al guardar evento');
      }
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      const sessionData = JSON.parse(adminSession);
      
      const response = await fetch(Config.getAdminUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'eliminar_evento',
          admin_user_id: sessionData.user.id,
          evento_id: eventId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await cargarEventos();
        if (window.showToast) {
          await window.showToast.success(data.message || 'Evento eliminado correctamente');
        }
      } else {
        if (window.showToast) {
          await window.showToast.error(data.message || 'Error al eliminar evento');
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      if (window.showToast) {
        await window.showToast.error('Error al eliminar evento');
      }
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-6 w-6 text-[#cf152d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Cargando eventos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={cargarEventos}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                <p className="text-2xl font-semibold text-gray-900">{totalEventos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Eventos</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAgregarEvento}
                  className="bg-[#cf152d] text-white px-4 py-2 rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Agregar Evento</span>
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200 text-sm"
                  />
                </div>
                <span className="text-sm text-gray-500">
                  ({eventosFiltrados.length} de {totalEventos})
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventosFiltrados.map((evento) => (
                  <tr key={evento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evento.nombre_evento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evento.imagen_certificado ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon size={16} className="text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-600">{evento.imagen_certificado}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin imagen</span>
                      )}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <div className="flex items-center space-x-3">
                         {evento.imagen_certificado && (
                           <>
                             <button
                               onClick={() => handleVerImagen(evento)}
                               className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-md hover:bg-green-50 cursor-pointer"
                               title="Ver imagen"
                             >
                               <Eye size={18} />
                             </button>
                             <button
                               onClick={() => handleDeleteImage(evento)}
                               className="text-orange-600 hover:text-orange-800 transition-colors p-1 rounded-md hover:bg-orange-50 cursor-pointer"
                               title="Eliminar imagen"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                               </svg>
                             </button>
                           </>
                         )}
                         <button
                           onClick={() => handleEditar(evento)}
                           className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50 cursor-pointer"
                           title="Editar evento"
                         >
                           <Edit size={18} />
                         </button>
                         <button
                           onClick={() => handleEliminar(evento)}
                           className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                           title="Eliminar evento"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {eventosFiltrados.length === 0 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron eventos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda ? `No hay eventos que coincidan con "${busqueda}".` : 'No hay eventos registrados en el sistema.'}
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
                    {Math.min(paginaActual * porPagina, totalEventos)}
                  </span>{' '}
                  de <span className="font-medium">{totalEventos}</span> eventos
                </div>
                <div className="flex space-x-1">
                  {generarBotonesPaginacion()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal para agregar/editar evento */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#cf152d] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {modalMode === 'add' ? 'Agregar Evento' : modalMode === 'edit' ? 'Editar Evento' : 'Eliminar Evento'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalMode === 'delete' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">¿Eliminar evento?</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      ¿Estás seguro de que quieres eliminar el evento "{selectedEvent?.nombre_evento}"? Esta acción no se puede deshacer.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteEvent(selectedEvent.id);
                        handleCloseModal();
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleSaveEvent({
                    nombre_evento: formData.get('nombre_evento'),
                    imagen: selectedFile
                  });
                  handleCloseModal();
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Evento
                    </label>
                    <input
                      type="text"
                      name="nombre_evento"
                      defaultValue={selectedEvent?.nombre_evento || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                      placeholder="Ej: JETS 2024"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen del Certificado
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200"
                      />
                      {fileName && (
                        <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span className="text-sm text-green-700">{fileName}</span>
                        </div>
                      )}
                      {selectedEvent?.imagen_certificado && !fileName && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-sm text-blue-700">Imagen actual: {selectedEvent.imagen_certificado}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(selectedEvent)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Solo se permiten archivos PNG y JPG. Máximo 15MB.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-[#cf152d] text-white rounded-lg hover:bg-[#cf152d]/90 transition-colors cursor-pointer"
                    >
                      {modalMode === 'add' ? 'Agregar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver imagen */}
      {modalImagenOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Vista Previa de Imagen</h3>
              </div>
              <button
                onClick={handleCloseModalImagen}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center">
                <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={selectedImagen} 
                    alt="Certificado" 
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden flex-col items-center justify-center p-4">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No se pudo cargar la imagen</p>
                  </div>
                </div>
              </div>
              

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPanelComponent;
