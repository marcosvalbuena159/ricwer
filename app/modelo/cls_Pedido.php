<?php
require_once ('../../config/Cls_conexion.php');
class clsPedido extends clsConexion
{
    //Variables del usuario
    private $idPedido;
    private $fechaPedido;
    private $horaPedido;
    private $totalPedido;
    private $pedidoaDomicilio;
    private $idUsuariofk;
    private $db;

    public function __construct() //construct lleva dos guiones bajos
    {
        $this->db=parent:: __construct();
    }

    //Encapsulamiento de Variabls de Usuario
    public function setidPedido($idPe)
    {
        $this->idPedido = $idPe;
    }    
    public function getidPedido()
    {
        return $this->idPedido;
    }
    public function setfechaPedido($fecPed)
    {
        $this->fechaPedido = $fecPed;
    }    
    public function getfechaPedido()
    {
        return $this->fechaPedido;
    }
    public function sethoraPedido($horaPed)
    {
        $this->horaPedido = $horaPed;
    }    
    public function gethoraPedido()
    {
        return $this->horaPedido;
    }
    public function settotalPedido($totalPed)
    {
        $this->totalPedido = $totalPed;
    }    
    public function gettotalPedido()
    {
        return $this->totalPedido;
    }
    public function setpedidoaDomicilio($pedaDom)
    {
        $this->pedidoaDomicilio = $pedaDom;
    }    
    public function getpedidoaDomicilio()
    {
        return $this->pedidoaDomicilio;
    }
    public function setidUsuariofk($idUfk)
    {
        $this->idUsuariofk = $idUfk;
    }    
    public function getidUsuariofk()
    {
        return $this->idUsuariofk;
    }


    public function consultar_pedido()
    {
        $Consulta = $this->db->prepare("SELECT `idPedido`, `fechaPedido`, `horaPedido`, `totalPedido`, `pedidoaDomicilio`, `idUsuariofk` FROM `pedido`");
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
