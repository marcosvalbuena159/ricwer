<?php
require_once('../../modelo/Cls_Producto.php');
$idPr = $_GET['ID'];
//echo $idU;

$objUsuario = new clsUsuario();
$objUsuario->setidProducto($idPr);

//echo $objUsuario->getidUsuario();

$filas = $objUsuario->Consultar_UsuariosE();

foreach($filas as $fila)
{
    //`idUsuario`, `tipoDocUsuario`, `numdocUsuario`, `nombreUsuario`, `apellidoUsuario`, `direccionUsuario`, `telefonoUsuario`, `correoUsuario`
    $tipoDocU = $fila['tipoDocUsuario'];
    $numdocU = $fila['numdocUsuario'];

    header('location: ../../Vista/editar/EditarUsuario.php?mensaje=consulta&idUsuario='.$idU.'&tipoDocUsuario='
    .$tipoDocU.'&DocumentoUsuario='.$numdocU);
}
?>