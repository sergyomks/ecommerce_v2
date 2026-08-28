

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_pedido_para_eliminar;

DELIMITER $$

CREATE PROCEDURE sp_obtener_pedido_para_eliminar(IN p_id_pedido CHAR(36))
BEGIN
  SELECT id, fecha_pagado FROM pedidos WHERE id = p_id_pedido;
END$$

DELIMITER ;
