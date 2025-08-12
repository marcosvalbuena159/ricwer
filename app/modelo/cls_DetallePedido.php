<?php
require_once ('../../config/Cls_conexion.php');
class clsDetallePedido extends clsConexion
{
    //Variables del usuario
    private $idDetallePedido;
    private $idProductoFK;
    private $cantidadProducto;
    private $precioProducto;
    private $subtotalProducto;
    private $idPedidoFK;
    private $db;

    public function __construct() //construct lleva dos guiones bajos
    {
        $this->db=parent:: __construct();
    }

    //Encapsulamiento de Variabls de Usuario
    public function setidDetallePedido($idDP)
    {
        $this->idDetallePedido = $idDP;
    }    
    public function getidDetallePedido()
    {
        return $this->idDetallePedido;
    }
    public function setidProductoFK($idPrFK)
    {
        $this->idProductoFK = $idPrFK;
    }    
    public function getidProductoFK()
    {
        return $this->idProductoFK;
    }
    public function setcantidadProducto($cantPr)
    {
        $this->cantidadProducto = $cantPr;
    }    
    public function getcantidadProducto()
    {
        return $this->cantidadProducto;
    }
    public function setprecioProducto($precPr)
    {
        $this->precioProducto = $precPr;
    }    
    public function getprecioProducto()
    {
        return $this->precioProducto;
    }
    public function setsubtotalProducto($subtPr)
    {
        $this->subtotalProducto = $subtPr;
    }    
    public function getsubtotalProducto()
    {
        return $this->subtotalProducto;
    }
    public function setidPedidoFK($idPeFK)
    {
        $this->idPedidoFK = $idPeFK;
    }    
    public function getidPedidoFK()
    {
        return $this->idPedidoFK;
    }


    public function consultar_detallepedido()
    {
        $Consulta = $this->db->prepare("SELECT `idDetallePedido`, `idProductoFK`, `cantidadProducto`, `precioProducto`, `subtotalProducto`, `idPedidoFK` FROM `detallepedido` ");
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
