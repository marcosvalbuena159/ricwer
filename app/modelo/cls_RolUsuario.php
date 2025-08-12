<?php
require_once ('../../config/Cls_conexion.php');
class clsRolUsuario extends clsConexion
{
    //Variables del usuario
    private $idRolUsuario;
    private $descripRolUsuario;

    private $db;

    public function __construct() //construct lleva dos guiones bajos
    {
        $this->db=parent:: __construct();
    }

    //Encapsulamiento de Variabls de Usuario
    public function setidRolUsuario($idR)
    {
        $this->idRolUsuario = $idR;
    }    
    public function getidRolUsuario()
    {
        return $this->idRolUsuario;
    }
    public function setdescripRolUsuario($desRolU)
    {
        $this->descripRolUsuario = $desRolU;
    }    
    public function getdescripRolUsuario()
    {
        return $this->descripRolUsuario;
    }


    public function consultar_rolusuario()
    {
        $Consulta = $this->db->prepare("SELECT `idRolUsuario`, `descripRolUsuario` FROM `rolusuario`");
        $filas=null;
        $Consulta->execute();

        while($resultado = $Consulta->fetch())
        {
            $filas[]=$resultado;
        }
        return $filas;
    }
    public function Actualizar()
    {
        //$estado = 'Activo';

        try{
            $Consulta = $this->db->prepare("CALL Actualizar_UsuarioId(:idU,:tdoc, :numdoc)");
            /*INSERT INTO usuario (TipoDocUsuario, NumdocUsuario, nombreUsuario, apellidoUsuario,
            direccionUsuario, telefonoUsuario, correoUsuario, passwordUsuario, estadoUsuario, idRolUsuarioFK) VALUES (:tdoc, :numdoc, :nom,
            :ape, :dir, :tel, :cor, :pass, :est, :idR)");*/
            $Consulta->bindParam(':idU',$this->idUsuario);
            $Consulta->bindParam(':tdoc',$this->tipoDocumento);
            $Consulta->bindParam(':numdoc',$this->documento);
            /*$Consulta->bindParam(':nom',$this->nombre);
            $Consulta->bindParam(':ape',$this->apellido);
            $Consulta->bindParam(':dir',$this->direccion);
            $Consulta->bindParam(':tel',$this->telefono);
            $Consulta->bindParam(':cor',$this->correo);
            $Consulta->bindParam(':pass',$this->contrasena);
            $Consulta->bindParam(':est',$estado);
            $Consulta->bindParam(':idR',$this->idRol);*/
            $Consulta->execute();
            header('location:../vista/EditarRolUsuario.php?mensaje=actualizo');
        }
        catch(PDOException $error)
        {
            header('location:../vista/EditarRolUsuario.php?mensaje=noactualizo');
        }

    }
}
?> 

