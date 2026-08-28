

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_pedido;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_pedido(IN p_id_pedido CHAR(36))
BEGIN
  DELETE FROM pedidos WHERE id = p_id_pedido;
  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
