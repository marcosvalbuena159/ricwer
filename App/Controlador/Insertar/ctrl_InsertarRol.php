<?php
include("conexion.php");
include("cls_Rol.php");

$rol = new Rol();
$rol->setDescripRolUsuario($_POST['descripRolUsuario']);
$rol->setEstadoRolUsuario($_POST['estadoRolUsuario']);

$sql = "CALL Insertar_RolUsuario(?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", 
    $rol->getDescripRolUsuario(), 
    $rol->getEstadoRolUsuario()
);

if ($stmt->execute()) {
    echo "Rol insertado correctamente.";
} else {
    echo "Error al insertar rol: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
