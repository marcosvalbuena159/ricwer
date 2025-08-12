<?php
include("conexion.php");

$idProducto = $_POST['idProducto'];
$nombre = $_POST['nombre'];
$descripcion = $_POST['descripcion'];
$precio = $_POST['precio'];
$descuento = $_POST['descuento'];
$categoria = $_POST['categoria'];
$estado = $_POST['estado'];

$sql = "CALL Actualizar_Producto(?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("issdiss", $idProducto, $nombre, $descripcion, $precio, $descuento, $categoria, $estado);

if ($stmt->execute()) {
    echo "Producto actualizado correctamente.";
} else {
    echo "Error al actualizar el producto: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
