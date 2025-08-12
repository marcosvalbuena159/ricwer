<?php
require_once('../../modelo/Cls_Usuario.php');
$idU = $_GET['ID'];

$objUsuario = new clsUsuario();
$objUsuario->setidUsuario($idU);

$filas = $objUsuario->Consultar_UsuariosE();

foreach($filas as $fila)
{
    $tipoDocU = $fila['tipoDocUsuario'];
    $numdocU = $fila['numdocUsuario'];

    header('location: ../../Vista/editar/EditarUsuario.php?mensaje=consulta&idUsuario='.$idU.'&tipoDocUsuario='
    .$tipoDocU.'&DocumentoUsuario='.$numdocU);
}
?>