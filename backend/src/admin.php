<?php
// Configuración de seguridad
error_reporting(0);
ini_set('display_errors', 0);

// Headers de seguridad
header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../conexion.php';

class Admin {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Verificar si un usuario es administrador
    public function verificarAdmin($usuario_id) {
        try {
            $query = "SELECT COUNT(*) as es_admin FROM administradores 
                      WHERE usuario_id = :usuario_id AND activo = 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result && $result['es_admin'] > 0;
        } catch(PDOException $e) {
            return false;
        }
    }

    // Obtener todos los usuarios con paginación
    public function obtenerTodosUsuarios($pagina = 1, $porPagina = 15) {
        try {
            // Calcular offset
            $offset = ($pagina - 1) * $porPagina;
            
            // Obtener total de usuarios
            $queryTotal = "SELECT COUNT(*) as total FROM usuarios";
            $stmtTotal = $this->conn->prepare($queryTotal);
            $stmtTotal->execute();
            $totalResult = $stmtTotal->fetch(PDO::FETCH_ASSOC);
            $total = $totalResult['total'];
            
            // Obtener usuarios paginados
            $query = "SELECT 
                        u.id,
                        u.nombre,
                        u.apellido,
                        u.usuario,
                        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as es_admin
                      FROM usuarios u
                      LEFT JOIN administradores a ON u.id = a.usuario_id AND a.activo = 1
                      ORDER BY u.apellido, u.nombre ASC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":limit", $porPagina, PDO::PARAM_INT);
            $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array(
                "success" => true,
                "usuarios" => $usuarios,
                "total" => $total,
                "pagina_actual" => $pagina,
                "por_pagina" => $porPagina,
                "total_paginas" => ceil($total / $porPagina)
            );
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Verificar código de administrador
    public function verificarCodigoAdmin($usuario_id, $codigo) {
        try {
            $query = "SELECT a.codigo, a.activo 
                      FROM administradores a 
                      WHERE a.usuario_id = :usuario_id AND a.activo = 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return array(
                    "success" => false,
                    "message" => "No tienes permisos de administrador"
                );
            }
            
            // Convertir el código ingresado a MD5 para comparar con el almacenado
            $codigo_md5 = md5($codigo);
            
            if ($result['codigo'] === $codigo_md5) {
                return array(
                    "success" => true,
                    "message" => "Código verificado correctamente"
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "Código de administrador incorrecto"
                );
            }
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Agregar usuario
    public function agregarUsuario($userData) {
        try {
            // Verificar si el usuario ya existe
            $query_check = "SELECT COUNT(*) as existe FROM usuarios WHERE usuario = :usuario";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->bindParam(":usuario", $userData['usuario']);
            $stmt_check->execute();
            
            $result_check = $stmt_check->fetch(PDO::FETCH_ASSOC);
            if ($result_check['existe'] > 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario ya existe"
                );
            }
            
            // Insertar nuevo usuario
            $query = "INSERT INTO usuarios (nombre, apellido, usuario, contrasena) 
                      VALUES (:nombre, :apellido, :usuario, :contrasena)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":nombre", $userData['nombre']);
            $stmt->bindParam(":apellido", $userData['apellido']);
            $stmt->bindParam(":usuario", $userData['usuario']);
            $contrasena_hash = md5($userData['contrasena']);
            $stmt->bindParam(":contrasena", $contrasena_hash);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Usuario agregado correctamente"
            );
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Editar usuario
    public function editarUsuario($userData, $userId) {
        try {
            // Verificar si el usuario existe
            $query_check = "SELECT COUNT(*) as existe FROM usuarios WHERE id = :id";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->bindParam(":id", $userId, PDO::PARAM_INT);
            $stmt_check->execute();
            
            $result_check = $stmt_check->fetch(PDO::FETCH_ASSOC);
            if ($result_check['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no existe"
                );
            }
            
            // Verificar si el nuevo usuario ya existe (excluyendo el actual)
            $query_check_user = "SELECT COUNT(*) as existe FROM usuarios WHERE usuario = :usuario AND id != :id";
            $stmt_check_user = $this->conn->prepare($query_check_user);
            $stmt_check_user->bindParam(":usuario", $userData['usuario']);
            $stmt_check_user->bindParam(":id", $userId, PDO::PARAM_INT);
            $stmt_check_user->execute();
            
            $result_check_user = $stmt_check_user->fetch(PDO::FETCH_ASSOC);
            if ($result_check_user['existe'] > 0) {
                return array(
                    "success" => false,
                    "message" => "El nombre de usuario ya existe"
                );
            }
            
            // Actualizar usuario
            if (!empty($userData['contrasena'])) {
                // Si se proporciona contraseña, actualizar también
                $query = "UPDATE usuarios SET nombre = :nombre, apellido = :apellido, 
                          usuario = :usuario, contrasena = :contrasena WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $contrasena_hash = md5($userData['contrasena']);
                $stmt->bindParam(":contrasena", $contrasena_hash);
            } else {
                // Si no se proporciona contraseña, no actualizar
                $query = "UPDATE usuarios SET nombre = :nombre, apellido = :apellido, 
                          usuario = :usuario WHERE id = :id";
                $stmt = $this->conn->prepare($query);
            }
            
            $stmt->bindParam(":nombre", $userData['nombre']);
            $stmt->bindParam(":apellido", $userData['apellido']);
            $stmt->bindParam(":usuario", $userData['usuario']);
            $stmt->bindParam(":id", $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Usuario actualizado correctamente"
            );
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Eliminar usuario
    public function eliminarUsuario($userId) {
        try {
            // Verificar si el usuario existe
            $query_check = "SELECT COUNT(*) as existe FROM usuarios WHERE id = :id";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->bindParam(":id", $userId, PDO::PARAM_INT);
            $stmt_check->execute();
            
            $result_check = $stmt_check->fetch(PDO::FETCH_ASSOC);
            if ($result_check['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no existe"
                );
            }
            
            // Iniciar transacción para asegurar integridad de datos
            $this->conn->beginTransaction();
            
            try {
                // 1. Eliminar registros de administradores (si existe)
                $query_admin = "DELETE FROM administradores WHERE usuario_id = :user_id";
                $stmt_admin = $this->conn->prepare($query_admin);
                $stmt_admin->bindParam(":user_id", $userId, PDO::PARAM_INT);
                $stmt_admin->execute();
                
                // 2. Eliminar participaciones en eventos
                $query_participaciones = "DELETE FROM participaciones WHERE usuario_id = :user_id";
                $stmt_participaciones = $this->conn->prepare($query_participaciones);
                $stmt_participaciones->bindParam(":user_id", $userId, PDO::PARAM_INT);
                $stmt_participaciones->execute();
                
                // 3. Finalmente, eliminar el usuario
                $query_usuario = "DELETE FROM usuarios WHERE id = :id";
                $stmt_usuario = $this->conn->prepare($query_usuario);
                $stmt_usuario->bindParam(":id", $userId, PDO::PARAM_INT);
                $stmt_usuario->execute();
                
                // Confirmar transacción
                $this->conn->commit();
                
                return array(
                    "success" => true,
                    "message" => "Usuario, participaciones y permisos de administrador eliminados correctamente"
                );
                
            } catch(PDOException $e) {
                // Revertir transacción en caso de error
                $this->conn->rollBack();
                throw $e;
            }
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Obtener participaciones de un usuario específico
    public function obtenerParticipacionesUsuario($userId) {
        try {
            $query = "SELECT 
                        p.id,
                        p.nro_certificado,
                        p.estado_pago,
                        e.nombre_evento
                      FROM participaciones p
                      INNER JOIN eventos e ON p.evento_id = e.id
                      WHERE p.usuario_id = :user_id
                      ORDER BY e.nombre_evento ASC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $participaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array(
                "success" => true,
                "participaciones" => $participaciones,
                "total" => count($participaciones)
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Editar participación
    public function editarParticipacion($participacionId, $nroCertificado, $estadoPago) {
        try {
            // Verificar si la participación existe
            $query_check = "SELECT COUNT(*) as existe FROM participaciones WHERE id = :id";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->bindParam(":id", $participacionId, PDO::PARAM_INT);
            $stmt_check->execute();
            
            $result_check = $stmt_check->fetch(PDO::FETCH_ASSOC);
            if ($result_check['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "La participación no existe"
                );
            }
            
            // Verificar si el número de certificado ya existe en el mismo evento (excluyendo la participación actual)
            $query_check_cert = "SELECT COUNT(*) as existe FROM participaciones p 
                                INNER JOIN participaciones p2 ON p.evento_id = p2.evento_id 
                                WHERE p.nro_certificado = :nro_certificado 
                                AND p.evento_id = (SELECT evento_id FROM participaciones WHERE id = :id)
                                AND p.id != :id";
            $stmt_check_cert = $this->conn->prepare($query_check_cert);
            $stmt_check_cert->bindParam(":nro_certificado", $nroCertificado);
            $stmt_check_cert->bindParam(":id", $participacionId, PDO::PARAM_INT);
            $stmt_check_cert->execute();
            
            $result_check_cert = $stmt_check_cert->fetch(PDO::FETCH_ASSOC);
            if ($result_check_cert['existe'] > 0) {
                return array(
                    "success" => false,
                    "message" => "El número de certificado ya existe en este evento"
                );
            }
            
            // Actualizar participación
            $query = "UPDATE participaciones SET nro_certificado = :nro_certificado, estado_pago = :estado_pago WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":nro_certificado", $nroCertificado);
            $stmt->bindParam(":estado_pago", $estadoPago);
            $stmt->bindParam(":id", $participacionId, PDO::PARAM_INT);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Participación actualizada correctamente"
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Eliminar participación
    public function eliminarParticipacion($participacionId) {
        try {
            // Verificar si la participación existe
            $query_check = "SELECT COUNT(*) as existe FROM participaciones WHERE id = :id";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->bindParam(":id", $participacionId, PDO::PARAM_INT);
            $stmt_check->execute();
            
            $result_check = $stmt_check->fetch(PDO::FETCH_ASSOC);
            if ($result_check['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "La participación no existe"
                );
            }
            
            // Eliminar participación
            $query = "DELETE FROM participaciones WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $participacionId, PDO::PARAM_INT);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Participación eliminada correctamente"
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Agregar participación
    public function agregarParticipacion($userId, $eventoId, $nroCertificado, $estadoPago) {
        try {
            // Verificar si el usuario existe
            $query_check_user = "SELECT COUNT(*) as existe FROM usuarios WHERE id = :user_id";
            $stmt_check_user = $this->conn->prepare($query_check_user);
            $stmt_check_user->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt_check_user->execute();
            
            $result_check_user = $stmt_check_user->fetch(PDO::FETCH_ASSOC);
            if ($result_check_user['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no existe"
                );
            }
            
            // Verificar si el evento existe
            $query_check_evento = "SELECT COUNT(*) as existe FROM eventos WHERE id = :evento_id";
            $stmt_check_evento = $this->conn->prepare($query_check_evento);
            $stmt_check_evento->bindParam(":evento_id", $eventoId, PDO::PARAM_INT);
            $stmt_check_evento->execute();
            
            $result_check_evento = $stmt_check_evento->fetch(PDO::FETCH_ASSOC);
            if ($result_check_evento['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El evento no existe"
                );
            }
            
            // Verificar si el número de certificado ya existe en el mismo evento
            $query_check_cert = "SELECT COUNT(*) as existe FROM participaciones WHERE nro_certificado = :nro_certificado AND evento_id = :evento_id";
            $stmt_check_cert = $this->conn->prepare($query_check_cert);
            $stmt_check_cert->bindParam(":nro_certificado", $nroCertificado);
            $stmt_check_cert->bindParam(":evento_id", $eventoId, PDO::PARAM_INT);
            $stmt_check_cert->execute();
            
            $result_check_cert = $stmt_check_cert->fetch(PDO::FETCH_ASSOC);
            if ($result_check_cert['existe'] > 0) {
                return array(
                    "success" => false,
                    "message" => "El número de certificado ya existe en este evento"
                );
            }
            
            // Verificar si el usuario ya participa en este evento
            $query_check_participacion = "SELECT COUNT(*) as existe FROM participaciones WHERE usuario_id = :user_id AND evento_id = :evento_id";
            $stmt_check_participacion = $this->conn->prepare($query_check_participacion);
            $stmt_check_participacion->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt_check_participacion->bindParam(":evento_id", $eventoId, PDO::PARAM_INT);
            $stmt_check_participacion->execute();
            
            $result_check_participacion = $stmt_check_participacion->fetch(PDO::FETCH_ASSOC);
            if ($result_check_participacion['existe'] > 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario ya participa en este evento"
                );
            }
            
            // Insertar nueva participación
            $query = "INSERT INTO participaciones (usuario_id, evento_id, nro_certificado, estado_pago) VALUES (:user_id, :evento_id, :nro_certificado, :estado_pago)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->bindParam(":evento_id", $eventoId, PDO::PARAM_INT);
            $stmt->bindParam(":nro_certificado", $nroCertificado);
            $stmt->bindParam(":estado_pago", $estadoPago);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Participación agregada correctamente"
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Dar admin a un usuario
    public function darAdmin($userId, $codigo) {
        try {
            // Verificar si el usuario existe
            $query_check_user = "SELECT COUNT(*) as existe FROM usuarios WHERE id = :user_id";
            $stmt_check_user = $this->conn->prepare($query_check_user);
            $stmt_check_user->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt_check_user->execute();
            
            $result_check_user = $stmt_check_user->fetch(PDO::FETCH_ASSOC);
            if ($result_check_user['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no existe"
                );
            }
            
            // Verificar si ya es administrador
            $query_check_admin = "SELECT COUNT(*) as existe FROM administradores WHERE usuario_id = :user_id AND activo = 1";
            $stmt_check_admin = $this->conn->prepare($query_check_admin);
            $stmt_check_admin->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt_check_admin->execute();
            
            $result_check_admin = $stmt_check_admin->fetch(PDO::FETCH_ASSOC);
            if ($result_check_admin['existe'] > 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario ya es administrador"
                );
            }
            
            // Validar que el código no esté vacío
            if (empty($codigo)) {
                return array(
                    "success" => false,
                    "message" => "El código de administrador es requerido"
                );
            }
            
            // Insertar como administrador con el código proporcionado
            $query = "INSERT INTO administradores (usuario_id, codigo, activo) VALUES (:user_id, :codigo, 1)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->bindParam(":codigo", $codigo);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Usuario promovido a administrador correctamente"
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Quitar admin a un usuario
    public function quitarAdmin($userId) {
        try {
            // Verificar si el usuario existe
            $query_check_user = "SELECT COUNT(*) as existe FROM usuarios WHERE id = :user_id";
            $stmt_check_user = $this->conn->prepare($query_check_user);
            $stmt_check_user->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt_check_user->execute();
            
            $result_check_user = $stmt_check_user->fetch(PDO::FETCH_ASSOC);
            if ($result_check_user['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no existe"
                );
            }
            
            // Verificar si es administrador
            $query_check_admin = "SELECT COUNT(*) as existe FROM administradores WHERE usuario_id = :user_id AND activo = 1";
            $stmt_check_admin = $this->conn->prepare($query_check_admin);
            $stmt_check_admin->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt_check_admin->execute();
            
            $result_check_admin = $stmt_check_admin->fetch(PDO::FETCH_ASSOC);
            if ($result_check_admin['existe'] == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no es administrador"
                );
            }
            
            // Eliminar completamente el registro de administrador
            $query = "DELETE FROM administradores WHERE usuario_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Privilegios de administrador removidos correctamente"
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Obtener todos los eventos con paginación
    public function obtenerTodosEventos($pagina = 1, $porPagina = 15) {
        try {
            // Calcular offset
            $offset = ($pagina - 1) * $porPagina;
            
            // Obtener total de eventos
            $queryTotal = "SELECT COUNT(*) as total FROM eventos";
            $stmtTotal = $this->conn->prepare($queryTotal);
            $stmtTotal->execute();
            $totalResult = $stmtTotal->fetch(PDO::FETCH_ASSOC);
            $total = $totalResult['total'];
            
            // Obtener eventos paginados
            $query = "SELECT 
                        id,
                        nombre_evento,
                        imagen_certificado
                      FROM eventos
                      ORDER BY nombre_evento ASC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":limit", $porPagina, PDO::PARAM_INT);
            $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array(
                "success" => true,
                "eventos" => $eventos,
                "total" => $total,
                "pagina_actual" => $pagina,
                "por_pagina" => $porPagina,
                "total_paginas" => ceil($total / $porPagina)
            );
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Agregar un nuevo evento
    public function agregarEvento($eventoData, $imagenFile = null) {
        try {
            // Validar datos requeridos
            if (empty($eventoData['nombre_evento'])) {
                return array(
                    "success" => false,
                    "message" => "El nombre del evento es requerido"
                );
            }

            $imagen_certificado = null;
            
            // Procesar imagen si se subió
            if ($imagenFile && $imagenFile['error'] === UPLOAD_ERR_OK) {
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                $maxSize = 15 * 1024 * 1024; // 15MB
                
                // Validar tipo de archivo
                if (!in_array($imagenFile['type'], $allowedTypes)) {
                    return array(
                        "success" => false,
                        "message" => "Solo se permiten archivos PNG y JPG"
                    );
                }
                
                // Validar tamaño
                if ($imagenFile['size'] > $maxSize) {
                    return array(
                        "success" => false,
                        "message" => "El archivo es demasiado grande. Máximo 15MB"
                    );
                }
                
                // Generar nombre único para el archivo
                $extension = pathinfo($imagenFile['name'], PATHINFO_EXTENSION);
                $imagen_certificado = uniqid() . '_' . time() . '.' . $extension;
                $uploadPath = __DIR__ . '/certificates/' . $imagen_certificado;
                
                // Crear directorio si no existe
                if (!is_dir(__DIR__ . '/certificates/')) {
                    mkdir(__DIR__ . '/certificates/', 0755, true);
                }
                
                // Mover archivo
                if (!move_uploaded_file($imagenFile['tmp_name'], $uploadPath)) {
                    return array(
                        "success" => false,
                        "message" => "Error al subir el archivo"
                    );
                }
            }

            $query = "INSERT INTO eventos (nombre_evento, imagen_certificado) VALUES (:nombre_evento, :imagen_certificado)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":nombre_evento", $eventoData['nombre_evento'], PDO::PARAM_STR);
            $stmt->bindParam(":imagen_certificado", $imagen_certificado, PDO::PARAM_STR);
            $stmt->execute();
            
            return array(
                "success" => true,
                "message" => "Evento agregado correctamente",
                "id" => $this->conn->lastInsertId()
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Editar un evento existente
    public function editarEvento($eventoData, $eventoId, $imagenFile = null) {
        try {
            // Validar datos requeridos
            if (empty($eventoData['nombre_evento'])) {
                return array(
                    "success" => false,
                    "message" => "El nombre del evento es requerido"
                );
            }

            // Obtener imagen actual si existe
            $queryCurrent = "SELECT imagen_certificado FROM eventos WHERE id = :id";
            $stmtCurrent = $this->conn->prepare($queryCurrent);
            $stmtCurrent->bindParam(":id", $eventoId, PDO::PARAM_INT);
            $stmtCurrent->execute();
            $currentEvent = $stmtCurrent->fetch(PDO::FETCH_ASSOC);
            
            $imagen_certificado = $currentEvent['imagen_certificado'];
            
            // Procesar nueva imagen si se subió
            if ($imagenFile && $imagenFile['error'] === UPLOAD_ERR_OK) {
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                $maxSize = 15 * 1024 * 1024; // 15MB
                
                // Validar tipo de archivo
                if (!in_array($imagenFile['type'], $allowedTypes)) {
                    return array(
                        "success" => false,
                        "message" => "Solo se permiten archivos PNG y JPG"
                    );
                }
                
                // Validar tamaño
                if ($imagenFile['size'] > $maxSize) {
                    return array(
                        "success" => false,
                        "message" => "El archivo es demasiado grande. Máximo 15MB"
                    );
                }
                
                // Eliminar imagen anterior si existe
                if ($currentEvent['imagen_certificado']) {
                    $oldImagePath = __DIR__ . '/certificates/' . $currentEvent['imagen_certificado'];
                    if (file_exists($oldImagePath)) {
                        unlink($oldImagePath);
                    }
                }
                
                // Generar nombre único para el archivo
                $extension = pathinfo($imagenFile['name'], PATHINFO_EXTENSION);
                $imagen_certificado = uniqid() . '_' . time() . '.' . $extension;
                $uploadPath = __DIR__ . '/certificates/' . $imagen_certificado;
                
                // Crear directorio si no existe
                if (!is_dir(__DIR__ . '/certificates/')) {
                    mkdir(__DIR__ . '/certificates/', 0755, true);
                }
                
                // Mover archivo
                if (!move_uploaded_file($imagenFile['tmp_name'], $uploadPath)) {
                    return array(
                        "success" => false,
                        "message" => "Error al subir el archivo"
                    );
                }
            }

            $query = "UPDATE eventos SET nombre_evento = :nombre_evento, imagen_certificado = :imagen_certificado WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":nombre_evento", $eventoData['nombre_evento'], PDO::PARAM_STR);
            $stmt->bindParam(":imagen_certificado", $imagen_certificado, PDO::PARAM_STR);
            $stmt->bindParam(":id", $eventoId, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return array(
                    "success" => true,
                    "message" => "Evento actualizado correctamente"
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "No se encontró el evento o no se realizaron cambios"
                );
            }
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Eliminar un evento
    public function eliminarEvento($eventoId) {
        try {
            // Verificar si hay participaciones asociadas
            $queryCheck = "SELECT COUNT(*) as total FROM participaciones WHERE evento_id = :evento_id";
            $stmtCheck = $this->conn->prepare($queryCheck);
            $stmtCheck->bindParam(":evento_id", $eventoId, PDO::PARAM_INT);
            $stmtCheck->execute();
            $result = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($result['total'] > 0) {
                return array(
                    "success" => false,
                    "message" => "No se puede eliminar el evento porque tiene participaciones asociadas"
                );
            }

            // Obtener información de la imagen antes de eliminar
            $queryImage = "SELECT imagen_certificado FROM eventos WHERE id = :id";
            $stmtImage = $this->conn->prepare($queryImage);
            $stmtImage->bindParam(":id", $eventoId, PDO::PARAM_INT);
            $stmtImage->execute();
            $evento = $stmtImage->fetch(PDO::FETCH_ASSOC);

            // Eliminar el evento de la base de datos
            $query = "DELETE FROM eventos WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $eventoId, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                // Eliminar la imagen del servidor si existe
                if ($evento && $evento['imagen_certificado']) {
                    $imagePath = __DIR__ . '/certificates/' . $evento['imagen_certificado'];
                    if (file_exists($imagePath)) {
                        unlink($imagePath);
                    }
                }
                
                return array(
                    "success" => true,
                    "message" => "Evento eliminado correctamente"
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "No se encontró el evento"
                );
            }
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Eliminar solo la imagen de un evento
    public function eliminarImagenEvento($eventoId) {
        try {
            // Obtener información de la imagen
            $query = "SELECT imagen_certificado FROM eventos WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $eventoId, PDO::PARAM_INT);
            $stmt->execute();
            $evento = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$evento) {
                return array(
                    "success" => false,
                    "message" => "No se encontró el evento"
                );
            }
            
            if (!$evento['imagen_certificado']) {
                return array(
                    "success" => false,
                    "message" => "El evento no tiene imagen asociada"
                );
            }
            
            // Eliminar la imagen del servidor
            $imagePath = __DIR__ . '/certificates/' . $evento['imagen_certificado'];
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
            
            // Actualizar la base de datos para eliminar la referencia
            $queryUpdate = "UPDATE eventos SET imagen_certificado = NULL WHERE id = :id";
            $stmtUpdate = $this->conn->prepare($queryUpdate);
            $stmtUpdate->bindParam(":id", $eventoId, PDO::PARAM_INT);
            $stmtUpdate->execute();
            
            return array(
                "success" => true,
                "message" => "Imagen eliminada correctamente"
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Subir usuarios desde archivo Excel/CSV
    public function subirUsuariosDesdeArchivo($archivo) {
        try {
            // Validar archivo
            if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
                return array(
                    "success" => false,
                    "message" => "Error al subir el archivo"
                );
            }

            $allowedTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            
            if (!in_array($archivo['type'], $allowedTypes)) {
                return array(
                    "success" => false,
                    "message" => "Solo se permiten archivos CSV y Excel (.xls, .xlsx)"
                );
            }

            $maxSize = 5 * 1024 * 1024; // 5MB
            if ($archivo['size'] > $maxSize) {
                return array(
                    "success" => false,
                    "message" => "El archivo es demasiado grande. Máximo 5MB"
                );
            }

            // Procesar archivo según su tipo
            $datos = array();
            $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
            
            if ($extension === 'csv') {
                $datos = $this->procesarCSV($archivo['tmp_name']);
            } else {
                $datos = $this->procesarExcel($archivo['tmp_name']);
            }

            if (!$datos['success']) {
                return $datos;
            }

            // Validar estructura de datos
            $usuarios = $datos['data'];
            $errores = array();
            $exitosos = 0;
            $duplicados = 0;

            foreach ($usuarios as $index => $usuario) {
                $fila = $index + 2; // +2 porque la primera fila es el header y los arrays empiezan en 0
                
                // Validar campos requeridos
                if (empty($usuario['nombre']) || empty($usuario['apellido']) || 
                    empty($usuario['usuario']) || empty($usuario['contrasena'])) {
                    $errores[] = "Fila $fila: Todos los campos son requeridos";
                    continue;
                }

                // Validar longitud de campos
                if (strlen($usuario['nombre']) > 100 || strlen($usuario['apellido']) > 100) {
                    $errores[] = "Fila $fila: Nombre y apellido no pueden exceder 100 caracteres";
                    continue;
                }

                if (strlen($usuario['usuario']) > 50) {
                    $errores[] = "Fila $fila: Usuario no puede exceder 50 caracteres";
                    continue;
                }

                // Verificar si el usuario ya existe
                $queryCheck = "SELECT COUNT(*) as existe FROM usuarios WHERE usuario = :usuario";
                $stmtCheck = $this->conn->prepare($queryCheck);
                $stmtCheck->bindParam(":usuario", $usuario['usuario'], PDO::PARAM_STR);
                $stmtCheck->execute();
                $result = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($result['existe'] > 0) {
                    $duplicados++;
                    continue;
                }

                // Insertar usuario
                try {
                    $query = "INSERT INTO usuarios (nombre, apellido, usuario, contrasena) VALUES (:nombre, :apellido, :usuario, :contrasena)";
                    $stmt = $this->conn->prepare($query);
                    $stmt->bindParam(":nombre", $usuario['nombre'], PDO::PARAM_STR);
                    $stmt->bindParam(":apellido", $usuario['apellido'], PDO::PARAM_STR);
                    $stmt->bindParam(":usuario", $usuario['usuario'], PDO::PARAM_STR);
                    $contrasenaMD5 = md5($usuario['contrasena']);
                    $stmt->bindParam(":contrasena", $contrasenaMD5, PDO::PARAM_STR);
                    $stmt->execute();
                    $exitosos++;
                } catch (PDOException $e) {
                    $errores[] = "Fila $fila: Error al insertar usuario - " . $e->getMessage();
                }
            }

            $mensaje = "Proceso completado. ";
            if ($exitosos > 0) {
                $mensaje .= "$exitosos usuarios agregados exitosamente. ";
            }
            if ($duplicados > 0) {
                $mensaje .= "$duplicados usuarios duplicados omitidos. ";
            }
            if (count($errores) > 0) {
                $mensaje .= count($errores) . " errores encontrados.";
            }

            return array(
                "success" => true,
                "message" => $mensaje,
                "exitosos" => $exitosos,
                "duplicados" => $duplicados,
                "errores" => $errores
            );

        } catch (Exception $e) {
            return array(
                "success" => false,
                "message" => "Error al procesar el archivo: " . $e->getMessage()
            );
        }
    }

    // Procesar archivo CSV
    private function procesarCSV($archivo) {
        try {
            $datos = array();
            $handle = fopen($archivo, 'r');
            
            if (!$handle) {
                return array(
                    "success" => false,
                    "message" => "No se pudo abrir el archivo CSV"
                );
            }

            // Leer header
            $header = fgetcsv($handle);
            if (!$header || count($header) < 4) {
                fclose($handle);
                return array(
                    "success" => false,
                    "message" => "El archivo CSV debe tener las columnas: nombre, apellido, usuario, contrasena"
                );
            }

            // Normalizar nombres de columnas
            $header = array_map('strtolower', array_map('trim', $header));
            
            // Verificar que las columnas requeridas estén presentes
            $columnasRequeridas = ['nombre', 'apellido', 'usuario', 'contrasena'];
            foreach ($columnasRequeridas as $columna) {
                if (!in_array($columna, $header)) {
                    fclose($handle);
                    return array(
                        "success" => false,
                        "message" => "Columna requerida no encontrada: $columna"
                    );
                }
            }

            // Leer datos
            $fila = 2; // Empezar en 2 porque la fila 1 es el header
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= 4) {
                    $datos[] = array(
                        'nombre' => trim($row[array_search('nombre', $header)]),
                        'apellido' => trim($row[array_search('apellido', $header)]),
                        'usuario' => trim($row[array_search('usuario', $header)]),
                        'contrasena' => trim($row[array_search('contrasena', $header)])
                    );
                }
                $fila++;
            }

            fclose($handle);

            return array(
                "success" => true,
                "data" => $datos
            );

        } catch (Exception $e) {
            return array(
                "success" => false,
                "message" => "Error al procesar CSV: " . $e->getMessage()
            );
        }
    }

    // Procesar archivo Excel
    private function procesarExcel($archivo) {
        try {
            // Para Excel necesitaríamos una librería como PhpSpreadsheet
            // Por ahora, retornamos error indicando que solo CSV está soportado
            return array(
                "success" => false,
                "message" => "Soporte para Excel será implementado próximamente. Por favor use archivos CSV."
            );
        } catch (Exception $e) {
            return array(
                "success" => false,
                "message" => "Error al procesar Excel: " . $e->getMessage()
            );
        }
    }
}

// Manejar la solicitud
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $database = new Database();
        $db = $database->getConnection();
        $admin = new Admin($db);
        
        // Obtener y validar datos del POST
        $data = $_POST;
        
        // Si no hay datos POST, intentar con JSON
        if (empty($data)) {
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(array(
                    "success" => false,
                    "message" => "Datos inválidos"
                ));
                exit;
            }
        }
        
        if (!isset($data['action'])) {
            http_response_code(400);
            echo json_encode(array(
                "success" => false,
                "message" => "Acción requerida"
            ));
            exit;
        }

        // Verificar que el usuario sea administrador para todas las acciones
        if (!isset($data['admin_user_id'])) {
            http_response_code(401);
            echo json_encode(array(
                "success" => false,
                "message" => "ID de administrador requerido"
            ));
            exit;
        }

        if (!$admin->verificarAdmin($data['admin_user_id'])) {
            http_response_code(403);
            echo json_encode(array(
                "success" => false,
                "message" => "Acceso denegado. Se requieren permisos de administrador"
            ));
            exit;
        }

        // Procesar acciones según el tipo
        switch ($data['action']) {
            case 'obtener_usuarios':
                $pagina = isset($data['pagina']) ? (int)$data['pagina'] : 1;
                $porPagina = isset($data['por_pagina']) ? (int)$data['por_pagina'] : 15;
                $result = $admin->obtenerTodosUsuarios($pagina, $porPagina);
                break;
                
            case 'agregar_usuario':
                if (!isset($data['user_data'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "Datos de usuario requeridos"
                    ));
                    exit;
                }
                $result = $admin->agregarUsuario($data['user_data']);
                break;
                
            case 'editar_usuario':
                if (!isset($data['user_data']) || !isset($data['user_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "Datos de usuario e ID requeridos"
                    ));
                    exit;
                }
                $result = $admin->editarUsuario($data['user_data'], $data['user_id']);
                break;
                
            case 'eliminar_usuario':
                if (!isset($data['user_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario requerido"
                    ));
                    exit;
                }
                $result = $admin->eliminarUsuario($data['user_id']);
                break;
                
            case 'obtener_participaciones_usuario':
                if (!isset($data['user_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario requerido"
                    ));
                    exit;
                }
                $result = $admin->obtenerParticipacionesUsuario($data['user_id']);
                break;
                
            case 'editar_participacion':
                if (!isset($data['participacion_id']) || !isset($data['nro_certificado']) || !isset($data['estado_pago'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de participación, número de certificado y estado de pago requeridos"
                    ));
                    exit;
                }
                $result = $admin->editarParticipacion($data['participacion_id'], $data['nro_certificado'], $data['estado_pago']);
                break;
                
            case 'eliminar_participacion':
                if (!isset($data['participacion_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de participación requerido"
                    ));
                    exit;
                }
                $result = $admin->eliminarParticipacion($data['participacion_id']);
                break;
                
            case 'agregar_participacion':
                if (!isset($data['user_id']) || !isset($data['evento_id']) || !isset($data['nro_certificado']) || !isset($data['estado_pago'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario, ID de evento, número de certificado y estado de pago requeridos"
                    ));
                    exit;
                }
                $result = $admin->agregarParticipacion($data['user_id'], $data['evento_id'], $data['nro_certificado'], $data['estado_pago']);
                break;
                
            case 'dar_admin':
                if (!isset($data['user_id']) || !isset($data['codigo'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario y código de administrador requeridos"
                    ));
                    exit;
                }
                $result = $admin->darAdmin($data['user_id'], $data['codigo']);
                break;
                
            case 'quitar_admin':
                if (!isset($data['user_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario requerido"
                    ));
                    exit;
                }
                $result = $admin->quitarAdmin($data['user_id']);
                break;
                
            case 'verificar_codigo_admin':
                if (!isset($data['admin_user_id']) || !isset($data['codigo'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario y código requeridos"
                    ));
                    exit;
                }
                $result = $admin->verificarCodigoAdmin($data['admin_user_id'], $data['codigo']);
                break;
                
            case 'obtener_eventos':
                $pagina = isset($data['pagina']) ? (int)$data['pagina'] : 1;
                $porPagina = isset($data['por_pagina']) ? (int)$data['por_pagina'] : 15;
                $result = $admin->obtenerTodosEventos($pagina, $porPagina);
                break;
                
            case 'agregar_evento':
                if (!isset($data['evento_data'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "Datos de evento requeridos"
                    ));
                    exit;
                }
                $imagenFile = isset($_FILES['imagen']) ? $_FILES['imagen'] : null;
                $eventoData = array(
                    'nombre_evento' => $data['evento_data']['nombre_evento']
                );
                $result = $admin->agregarEvento($eventoData, $imagenFile);
                break;
                
            case 'editar_evento':
                if (!isset($data['evento_data']) || !isset($data['evento_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "Datos de evento e ID requeridos"
                    ));
                    exit;
                }
                $imagenFile = isset($_FILES['imagen']) ? $_FILES['imagen'] : null;
                $eventoData = array(
                    'nombre_evento' => $data['evento_data']['nombre_evento']
                );
                $result = $admin->editarEvento($eventoData, $data['evento_id'], $imagenFile);
                break;
                
            case 'eliminar_evento':
                if (!isset($data['evento_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de evento requerido"
                    ));
                    exit;
                }
                $result = $admin->eliminarEvento($data['evento_id']);
                break;
                
            case 'eliminar_imagen_evento':
                if (!isset($data['evento_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de evento requerido"
                    ));
                    exit;
                }
                $result = $admin->eliminarImagenEvento($data['evento_id']);
                break;
                
            case 'subir_usuarios_archivo':
                $archivo = isset($_FILES['archivo']) ? $_FILES['archivo'] : null;
                $result = $admin->subirUsuariosDesdeArchivo($archivo);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(array(
                    "success" => false,
                    "message" => "Acción no válida"
                ));
                exit;
        }
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array(
            "success" => false,
            "message" => "Error interno del servidor"
        ));
    }
} else {
    http_response_code(405);
    echo json_encode(array(
        "success" => false,
        "message" => "Método no permitido"
    ));
}
?> 