<?php
require_once('../../modelo/Cls_Usuario.php');

if(isset($_POST)&&!empty($_POST))
{
    $idUsuario        =   $_POST['idUsuario'];  
    $tipoDocumento    =   $_POST['TDocUsuario'];
    $documento        =   $_POST['DocUsuario'];
    
    $objUsuario = new clsUsuario();

    $objUsuario->setidUsuario($idUsuario);
    $objUsuario->settipoDocumento($tipoDocumento);
    $objUsuario->setdocumento($documento);

    $objUsuario->Actualizar();

}
?>