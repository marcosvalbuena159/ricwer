<?php
include("conexion.php");

$idDetalle = $_POST['idDetallePedido'];

$sql = "SELECT * FROM detallePedido WHERE idDetallePedido = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idDetalle);

if ($stmt->execute()) {
    $resultado = $stmt->get_result();
    if ($fila = $resultado->fetch_assoc()) {
        echo json_encode($fila);
    } else {
        echo json_encode(["error" => "Detalle no encontrado."]);
    }
} else {
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
