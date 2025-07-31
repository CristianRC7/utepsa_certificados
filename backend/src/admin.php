<?php
// Configuración de seguridad
error_reporting(0);
ini_set('display_errors', 0);

// Headers de seguridad
header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
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

    // Obtener todas las participaciones con información de usuarios y eventos
    public function obtenerTodasParticipaciones() {
        try {
            $query = "SELECT 
                        p.id,
                        p.nro_certificado,
                        p.estado_pago,
                        u.id as usuario_id,
                        u.nombre,
                        u.apellido,
                        u.usuario,
                        e.id as evento_id,
                        e.nombre_evento
                      FROM participaciones p
                      INNER JOIN usuarios u ON p.usuario_id = u.id
                      INNER JOIN eventos e ON p.evento_id = e.id
                      ORDER BY u.apellido, u.nombre, e.nombre_evento ASC";
            
            $stmt = $this->conn->prepare($query);
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

    // Actualizar estado de pago de una participación
    public function actualizarEstadoPago($participacion_id, $estado_pago) {
        try {
            // Validar estado de pago
            $estados_validos = ['pendiente', 'pagado', 'cancelado'];
            if (!in_array($estado_pago, $estados_validos)) {
                return array(
                    "success" => false,
                    "message" => "Estado de pago inválido"
                );
            }

            $query = "UPDATE participaciones SET estado_pago = :estado_pago WHERE id = :participacion_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":estado_pago", $estado_pago, PDO::PARAM_STR);
            $stmt->bindParam(":participacion_id", $participacion_id, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return array(
                    "success" => true,
                    "message" => "Estado de pago actualizado correctamente"
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "No se encontró la participación especificada"
                );
            }
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Obtener estadísticas de pagos
    public function obtenerEstadisticasPagos() {
        try {
            $query = "SELECT 
                        estado_pago,
                        COUNT(*) as cantidad
                      FROM participaciones 
                      GROUP BY estado_pago";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $estadisticas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Obtener total de participaciones
            $query_total = "SELECT COUNT(*) as total FROM participaciones";
            $stmt_total = $this->conn->prepare($query_total);
            $stmt_total->execute();
            $total = $stmt_total->fetch(PDO::FETCH_ASSOC)['total'];
            
            return array(
                "success" => true,
                "estadisticas" => $estadisticas,
                "total_participaciones" => $total
            );
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
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
                        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_admin
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

    // Cambiar estado de administrador de un usuario
    public function cambiarEstadoAdmin($usuario_id, $is_admin) {
        try {
            if ($is_admin) {
                // Agregar como administrador
                $query = "INSERT IGNORE INTO administradores (usuario_id, codigo) 
                         VALUES (:usuario_id, MD5(CONCAT('ADMIN', :usuario_id, '2024')))";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    return array(
                        "success" => true,
                        "message" => "Usuario agregado como administrador correctamente"
                    );
                } else {
                    return array(
                        "success" => true,
                        "message" => "El usuario ya es administrador"
                    );
                }
            } else {
                // Remover como administrador
                $query = "UPDATE administradores SET activo = 0 WHERE usuario_id = :usuario_id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    return array(
                        "success" => true,
                        "message" => "Usuario removido como administrador correctamente"
                    );
                } else {
                    return array(
                        "success" => false,
                        "message" => "El usuario no era administrador"
                    );
                }
            }
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Obtener información de administradores
    public function obtenerAdministradores() {
        try {
            $query = "SELECT 
                        a.id,
                        a.usuario_id,
                        a.codigo,
                        a.fecha_creacion,
                        a.activo,
                        u.nombre,
                        u.apellido,
                        u.usuario
                      FROM administradores a
                      INNER JOIN usuarios u ON a.usuario_id = u.id
                      ORDER BY a.fecha_creacion DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $administradores = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array(
                "success" => true,
                "administradores" => $administradores,
                "total" => count($administradores)
            );
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Regenerar código de administrador
    public function regenerarCodigoAdmin($admin_id) {
        try {
            $query = "UPDATE administradores SET codigo = MD5(CONCAT('ADMIN', usuario_id, '2024', NOW())) 
                      WHERE id = :admin_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":admin_id", $admin_id, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                // Obtener el nuevo código
                $query_codigo = "SELECT codigo FROM administradores WHERE id = :admin_id";
                $stmt_codigo = $this->conn->prepare($query_codigo);
                $stmt_codigo->bindParam(":admin_id", $admin_id, PDO::PARAM_INT);
                $stmt_codigo->execute();
                $result = $stmt_codigo->fetch(PDO::FETCH_ASSOC);
                
                return array(
                    "success" => true,
                    "message" => "Código de administrador regenerado correctamente",
                    "nuevo_codigo" => $result['codigo']
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "No se encontró el administrador especificado"
                );
            }
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage()
            );
        }
    }

    // Activar/Desactivar administrador
    public function cambiarEstadoActivoAdmin($admin_id, $activo) {
        try {
            $query = "UPDATE administradores SET activo = :activo WHERE id = :admin_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":activo", $activo, PDO::PARAM_BOOL);
            $stmt->bindParam(":admin_id", $admin_id, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $estado_texto = $activo ? "activado" : "desactivado";
                return array(
                    "success" => true,
                    "message" => "Administrador {$estado_texto} correctamente"
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "No se encontró el administrador especificado"
                );
            }
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
            case 'obtener_participaciones':
                $result = $admin->obtenerTodasParticipaciones();
                break;
                
            case 'actualizar_estado_pago':
                if (!isset($data['participacion_id']) || !isset($data['estado_pago'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de participación y estado de pago requeridos"
                    ));
                    exit;
                }
                $result = $admin->actualizarEstadoPago($data['participacion_id'], $data['estado_pago']);
                break;
                
            case 'obtener_estadisticas':
                $result = $admin->obtenerEstadisticasPagos();
                break;
                
            case 'obtener_usuarios':
                $result = $admin->obtenerTodosUsuarios();
                break;
                
            case 'cambiar_estado_admin':
                if (!isset($data['usuario_id']) || !isset($data['is_admin'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de usuario y estado de administrador requeridos"
                    ));
                    exit;
                }
                $result = $admin->cambiarEstadoAdmin($data['usuario_id'], $data['is_admin']);
                break;
                
            case 'obtener_administradores':
                $result = $admin->obtenerAdministradores();
                break;
                
            case 'regenerar_codigo_admin':
                if (!isset($data['admin_id'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de administrador requerido"
                    ));
                    exit;
                }
                $result = $admin->regenerarCodigoAdmin($data['admin_id']);
                break;
                
            case 'cambiar_estado_activo_admin':
                if (!isset($data['admin_id']) || !isset($data['activo'])) {
                    http_response_code(400);
                    echo json_encode(array(
                        "success" => false,
                        "message" => "ID de administrador y estado activo requeridos"
                    ));
                    exit;
                }
                $result = $admin->cambiarEstadoActivoAdmin($data['admin_id'], $data['activo']);
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