<?php
include("conexion.php");

$idRol = $_POST['idRol'];

$sql = "CALL Eliminar_RolUsuario(?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idRol);

if ($stmt->execute()) {
    echo "Rol eliminado correctamente.";
} else {
    echo "Error al eliminar el rol: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
