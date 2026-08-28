

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_pedido_actualizado;

DELIMITER $$

CREATE PROCEDURE sp_obtener_pedido_actualizado(IN p_id_pedido CHAR(36))
BEGIN
  SELECT * FROM pedidos WHERE id = p_id_pedido;
END$$

DELIMITER ;
