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