<?php
include("conexion.php");

$idProducto = $_POST['idProducto'];

$sql = "CALL Eliminar_Producto(?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idProducto);

if ($stmt->execute()) {
    echo "Producto eliminado correctamente.";
} else {
    echo "Error al eliminar el producto: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
