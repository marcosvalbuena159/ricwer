<?php
include("conexion.php");

$idRol = $_POST['idRol'];
$descripcion = $_POST['descripcion'];
$estado = $_POST['estado'];

$sql = "CALL Actualizar_RolUsuario(?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $idRol, $descripcion, $estado);

if ($stmt->execute()) {
    echo "Rol actualizado correctamente.";
} else {
    echo "Error al actualizar el rol: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
