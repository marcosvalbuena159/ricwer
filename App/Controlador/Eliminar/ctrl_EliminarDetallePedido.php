<?php
include("conexion.php");

$idDetalle = $_POST['idDetallePedido'];

$sql = "CALL Eliminar_DetallePedido(?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idDetalle);

if ($stmt->execute()) {
    echo "Detalle del pedido eliminado correctamente.";
} else {
    echo "Error al eliminar el detalle: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
