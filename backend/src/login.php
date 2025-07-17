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
            // Hash MD5 de la contraseña
            $contrasena_hash = md5($contrasena);
            
            $query = "SELECT id, nombre, apellido, usuario FROM " . $this->table_name . 
                     " WHERE usuario = :usuario AND contrasena = :contrasena";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":usuario", $usuario);
            $stmt->bindParam(":contrasena", $contrasena_hash);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
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
            } else {
                return array(
                    "success" => false,
                    "message" => "Usuario o contraseña incorrectos"
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
