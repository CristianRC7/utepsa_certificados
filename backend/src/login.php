<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once '../conexion.php';

class Login {
    private $conn;
    private $table_name = "usuarios";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function authenticate($usuario, $contrasena) {
        try {
            // Primero verificar si el usuario existe
            $query_usuario = "SELECT id, nombre, apellido, usuario, contrasena FROM " . $this->table_name . 
                            " WHERE usuario = :usuario";
            
            $stmt_usuario = $this->conn->prepare($query_usuario);
            $stmt_usuario->bindParam(":usuario", $usuario);
            $stmt_usuario->execute();
            
            if($stmt_usuario->rowCount() == 0) {
                return array(
                    "success" => false,
                    "message" => "El usuario no existe",
                    "error_type" => "user_not_found"
                );
            }
            
            // Si el usuario existe, verificar la contraseña
            $row = $stmt_usuario->fetch(PDO::FETCH_ASSOC);
            $contrasena_hash = md5($contrasena);
            
            if($row['contrasena'] !== $contrasena_hash) {
                return array(
                    "success" => false,
                    "message" => "Contraseña incorrecta",
                    "error_type" => "wrong_password"
                );
            }
            
            // Si llegamos aquí, la autenticación es exitosa
            return array(
                "success" => true,
                "message" => "Sesión iniciada correctamente",
                "user" => array(
                    "id" => $row['id'],
                    "nombre" => $row['nombre'],
                    "apellido" => $row['apellido'],
                    "usuario" => $row['usuario']
                )
            );
            
        } catch(PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error en la base de datos: " . $e->getMessage(),
                "error_type" => "database_error"
            );
        }
    }
}

// Manejar la solicitud
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $database = new Database();
    $db = $database->getConnection();
    $login = new Login($db);
    
    // Obtener datos del POST
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['usuario']) && isset($data['contrasena'])) {
        $result = $login->authenticate($data['usuario'], $data['contrasena']);
        echo json_encode($result);
    } else {
        echo json_encode(array(
            "success" => false,
            "message" => "Datos incompletos"
        ));
    }
} else {
    echo json_encode(array(
        "success" => false,
        "message" => "Método no permitido"
    ));
}
?>
