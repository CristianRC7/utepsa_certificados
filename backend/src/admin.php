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

    // Obtener todos los usuarios
    public function obtenerTodosUsuarios() {
        try {
            $query = "SELECT 
                        u.id,
                        u.nombre,
                        u.apellido,
                        u.usuario,
                        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as es_admin
                      FROM usuarios u
                      LEFT JOIN administradores a ON u.id = a.usuario_id AND a.activo = 1
                      ORDER BY u.apellido, u.nombre ASC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array(
                "success" => true,
                "usuarios" => $usuarios,
                "total" => count($usuarios)
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
                
                // 2. Eliminar participaciones en eventos (si existe)
                $query_participaciones = "DELETE FROM participaciones WHERE usuario_id = :user_id";
                $stmt_participaciones = $this->conn->prepare($query_participaciones);
                $stmt_participaciones->bindParam(":user_id", $userId, PDO::PARAM_INT);
                $stmt_participaciones->execute();
                
                // 3. Eliminar certificados (si existe)
                $query_certificados = "DELETE FROM certificados WHERE usuario_id = :user_id";
                $stmt_certificados = $this->conn->prepare($query_certificados);
                $stmt_certificados->bindParam(":user_id", $userId, PDO::PARAM_INT);
                $stmt_certificados->execute();
                
                // 4. Eliminar pagos (si existe)
                $query_pagos = "DELETE FROM pagos WHERE usuario_id = :user_id";
                $stmt_pagos = $this->conn->prepare($query_pagos);
                $stmt_pagos->bindParam(":user_id", $userId, PDO::PARAM_INT);
                $stmt_pagos->execute();
                
                // 5. Finalmente, eliminar el usuario
                $query_usuario = "DELETE FROM usuarios WHERE id = :id";
                $stmt_usuario = $this->conn->prepare($query_usuario);
                $stmt_usuario->bindParam(":id", $userId, PDO::PARAM_INT);
                $stmt_usuario->execute();
                
                // Confirmar transacción
                $this->conn->commit();
                
                return array(
                    "success" => true,
                    "message" => "Usuario y todos sus datos relacionados eliminados correctamente"
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
}

// Manejar la solicitud
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $database = new Database();
        $db = $database->getConnection();
        $admin = new Admin($db);
        
        // Obtener y validar datos del POST
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(array(
                "success" => false,
                "message" => "Datos JSON inválidos"
            ));
            exit;
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
                $result = $admin->obtenerTodosUsuarios();
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