<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once '../conexion.php';
require_once './library/vendor/tecnickcom/tcpdf/tcpdf.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

if (!isset($_GET['userId']) || !isset($_GET['certificateId'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos para generar el certificado']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $userId = $_GET['userId'];
    $nroCertificado = $_GET['certificateId'];

    // Consulta para obtener información del certificado
    $query = "SELECT 
                u.nombre,
                u.apellido,
                p.nro_certificado,
                e.nombre_evento,
                e.imagen_certificado
              FROM usuarios u
              INNER JOIN participaciones p ON u.id = p.usuario_id
              INNER JOIN eventos e ON p.evento_id = e.id
              WHERE u.id = ? AND p.nro_certificado = ?";

    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $userId);
    $stmt->bindParam(2, $nroCertificado);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        // Concatenar nombre completo y convertir a mayúsculas
        $nombreCompleto = mb_strtoupper($result['nombre'] . ' ' . $result['apellido'], 'UTF-8');
        $nombreEvento = $result['nombre_evento'];
        $imagenCertificado = $result['imagen_certificado'];

        // Configurar PDF
        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false, 0);
        $pdf->AddPage();

        // Cargar imagen de fondo según el evento
        $imageFile = "./certificates/" . $imagenCertificado;
        
        // Verificar si existe la imagen
        if (file_exists($imageFile)) {
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
        // Puedes agregar más condiciones según tus eventos específicos
        if (strpos($nombreEvento, '2022') !== false) {
            $yNombre = 143;
        } elseif (strpos($nombreEvento, '2024') !== false) {
            $yNombre = 128;
        } elseif (strpos($nombreEvento, '2023') !== false) {
            $yNombre = 130;
        } elseif (strpos($nombreEvento, '2025') !== false) {
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
        exit; // Importante: salir después de generar el PDF
        
    } else {
        echo json_encode(['success' => false, 'message' => 'No se encontró la información del certificado']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
