<?php
// Configuración de seguridad
error_reporting(0);
ini_set('display_errors', 0);

// Headers de seguridad
header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Validar parámetros requeridos
if (!isset($_GET['userId']) || !isset($_GET['certificateId'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos para generar el certificado']);
    exit;
}

// Sanitizar y validar parámetros
$userId = filter_var($_GET['userId'], FILTER_VALIDATE_INT);
$nroCertificado = filter_var($_GET['certificateId'], FILTER_SANITIZE_STRING);

if ($userId === false || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']);
    exit;
}

if (empty($nroCertificado) || strlen($nroCertificado) > 50) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Número de certificado inválido']);
    exit;
}

// Verificar que el número de certificado solo contenga caracteres válidos
if (!preg_match('/^[A-Za-z0-9\-_]+$/', $nroCertificado)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formato de certificado inválido']);
    exit;
}

try {
    require_once '../conexion.php';
    require_once './library/vendor/tecnickcom/tcpdf/tcpdf.php';

    $database = new Database();
    $db = $database->getConnection();
    
    // Consulta segura para obtener información del certificado
    $query = "SELECT 
                u.nombre,
                u.apellido,
                p.nro_certificado,
                e.nombre_evento,
                e.imagen_certificado
              FROM usuarios u
              INNER JOIN participaciones p ON u.id = p.usuario_id
              INNER JOIN eventos e ON p.evento_id = e.id
              WHERE u.id = :userId AND p.nro_certificado = :nroCertificado";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":userId", $userId, PDO::PARAM_INT);
    $stmt->bindParam(":nroCertificado", $nroCertificado, PDO::PARAM_STR);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Certificado no encontrado']);
        exit;
    }

    // Validar y sanitizar el nombre del archivo de imagen
    $imagenCertificado = $result['imagen_certificado'];
    
    // Verificar que el nombre del archivo sea seguro
    if (empty($imagenCertificado) || 
        !preg_match('/^[A-Za-z0-9\-_\.]+\.(jpg|jpeg|png)$/i', $imagenCertificado) ||
        strpos($imagenCertificado, '..') !== false ||
        strpos($imagenCertificado, '/') !== false ||
        strpos($imagenCertificado, '\\') !== false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la configuración del certificado']);
        exit;
    }

    // Ruta segura para las imágenes (solo directorio específico)
    $certificatesDir = __DIR__ . '/certificates/';
    $imageFile = $certificatesDir . basename($imagenCertificado);
    
    // Verificar que el archivo esté dentro del directorio permitido
    $realImagePath = realpath($imageFile);
    $realCertificatesDir = realpath($certificatesDir);
    
    if ($realImagePath === false || 
        $realCertificatesDir === false || 
        strpos($realImagePath, $realCertificatesDir) !== 0) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la configuración del certificado']);
        exit;
    }

    // Verificar que el archivo existe y es legible
    if (!file_exists($imageFile) || !is_readable($imageFile)) {
        // Si no existe la imagen, crear un fondo blanco
        $useBackgroundImage = false;
    } else {
        $useBackgroundImage = true;
    }

    // Concatenar nombre completo y convertir a mayúsculas
    $nombreCompleto = mb_strtoupper($result['nombre'] . ' ' . $result['apellido'], 'UTF-8');
    $nombreEvento = $result['nombre_evento'];

    // Configurar PDF
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->SetMargins(0, 0, 0);
    $pdf->SetAutoPageBreak(false, 0);
    $pdf->AddPage();

    // Cargar imagen de fondo si existe
    if ($useBackgroundImage) {
        $pdf->Image($imageFile, 0, 0, $pdf->getPageWidth(), $pdf->getPageHeight(), '', '', '', false, 300, '', false, false, 0, false, false, false);
    } else {
        // Si no existe la imagen, crear un fondo blanco
        $pdf->SetFillColor(255, 255, 255);
        $pdf->Rect(0, 0, $pdf->getPageWidth(), $pdf->getPageHeight(), 'F');
    }

    // Configurar fuente y posición del nombre
    $pdf->SetFont('helvetica', 'B', 26);
    $yNombre = 125; // Posición Y por defecto
    
    // Ajustar posición Y según el evento si es necesario
    if (strpos($nombreEvento, 'JETS 2022') !== false) {
        $yNombre = 143;
    } elseif (strpos($nombreEvento, 'JETS 2024') !== false) {
        $yNombre = 128;
    } elseif (strpos($nombreEvento, 'JETS 2023') !== false) {
        $yNombre = 128;
    } else {
        // por defecto sin ningun evento definido
        $yNombre = 125;
    }

    // Centrar y escribir el nombre en mayúsculas
    $xNombre = ($pdf->getPageWidth() - $pdf->getStringWidth($nombreCompleto)) / 2;
    $pdf->Text($xNombre, $yNombre, $nombreCompleto);

    // Agregar número de certificado
    $pdf->SetFont('helvetica', 'B', 14);
    $xNroCertificado = $pdf->getPageWidth() - 25;
    $yNroCertificado = $pdf->getPageHeight() - 10;
    $pdf->Text($xNroCertificado, $yNroCertificado, 'Nro* ' . $nroCertificado);

    // Generar PDF y descargar
    $pdf->Output('certificado_' . $nroCertificado . '.pdf', 'D');
    exit;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    exit;
}
?>
