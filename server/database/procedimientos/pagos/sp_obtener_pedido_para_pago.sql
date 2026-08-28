

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_pedido_para_pago;

DELIMITER $$

CREATE PROCEDURE sp_obtener_pedido_para_pago(IN p_id_pedido CHAR(36), IN p_id_comprador CHAR(36))
BEGIN
  SELECT id, precio_total, fecha_pagado, stock_reservado, estado_pedido
  FROM pedidos WHERE id = p_id_pedido AND id_comprador = p_id_comprador;
END$$

DELIMITER ;
