

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_pedido_estado;

DELIMITER $$

CREATE PROCEDURE sp_obtener_pedido_estado(IN p_id_pedido CHAR(36))
BEGIN
  SELECT id, id_comprador, estado_pedido, fecha_pagado, fecha_entregado FROM pedidos WHERE id = p_id_pedido;
END$$

DELIMITER ;
