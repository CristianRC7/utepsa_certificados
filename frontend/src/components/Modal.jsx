import React, { useState, useEffect } from 'react';
import { X, User, Edit, Trash2, Plus, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  mode, 
  user = null, 
  onSave, 
  onDelete 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    contrasena: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user && mode === 'edit') {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        usuario: user.usuario || '',
        contrasena: ''
      });
    } else if (isOpen && mode === 'add') {
      setFormData({
        nombre: '',
        apellido: '',
        usuario: '',
        contrasena: ''
      });
    }
    setErrors({});
  }, [isOpen, user, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }

    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El usuario es requerido';
    }

    if (mode === 'add' && !formData.contrasena.trim()) {
      newErrors.contrasena = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await onDelete(user.id);
      onClose();
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'add':
        return 'Agregar Usuario';
      case 'edit':
        return 'Editar Usuario';
      case 'delete':
        return 'Eliminar Usuario';
      default:
        return 'Modal';
    }
  };

  const getModalIcon = () => {
    switch (mode) {
      case 'add':
        return <Plus className="w-6 h-6" />;
      case 'edit':
        return <Edit className="w-6 h-6" />;
      case 'delete':
        return <Trash2 className="w-6 h-6" />;
      default:
        return <User className="w-6 h-6" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#cf152d]/10 rounded-lg flex items-center justify-center">
              {getModalIcon()}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'delete' ? (
            // Modal de confirmación de eliminación
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                ¿Eliminar usuario?
              </h4>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar al usuario{' '}
                <span className="font-semibold">{user?.nombre} {user?.apellido}</span>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ) : (
            // Modal de formulario (agregar/editar)
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingresa el nombre"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200 ${
                    errors.apellido ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingresa el apellido"
                />
                {errors.apellido && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200 ${
                    errors.usuario ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingresa el usuario"
                />
                {errors.usuario && (
                  <p className="mt-1 text-sm text-red-600">{errors.usuario}</p>
                )}
              </div>

                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Contraseña {mode === 'edit' && '(dejar vacío para no cambiar)'}
                 </label>
                 <div className="relative">
                   <input
                     type={showPassword ? "text" : "password"}
                     name="contrasena"
                     value={formData.contrasena}
                     onChange={handleInputChange}
                     className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#cf152d]/20 focus:border-[#cf152d] transition-all duration-200 ${
                       errors.contrasena ? 'border-red-500' : 'border-gray-300'
                     }`}
                     placeholder="Ingresa la contraseña"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                   >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                   </button>
                 </div>
                 {errors.contrasena && (
                   <p className="mt-1 text-sm text-red-600">{errors.contrasena}</p>
                 )}
               </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-[#cf152d] text-white rounded-lg hover:bg-[#cf152d]/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
