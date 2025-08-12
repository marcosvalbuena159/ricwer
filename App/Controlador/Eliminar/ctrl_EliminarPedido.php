<?php
include("conexion.php");

$idPedido = $_POST['idPedido'];

$sql = "CALL Eliminar_Pedido(?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idPedido);

if ($stmt->execute()) {
    echo "Pedido eliminado correctamente.";
} else {
    echo "Error al eliminar el pedido: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
