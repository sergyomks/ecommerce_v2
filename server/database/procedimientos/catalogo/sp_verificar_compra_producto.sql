

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_compra_producto;

DELIMITER $$

CREATE PROCEDURE sp_verificar_compra_producto(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  SELECT dp.id_producto
  FROM detalles_pedido dp
  JOIN pedidos p ON p.id = dp.id_pedido
  WHERE p.id_comprador = p_id_usuario
  AND dp.id_producto = p_id_producto
  AND p.fecha_pagado IS NOT NULL
  AND p.estado_pedido <> 'Cancelado'
  LIMIT 1;
END$$

DELIMITER ;
