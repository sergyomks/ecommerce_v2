

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_marcar_stock_reservado;

DELIMITER $$

CREATE PROCEDURE sp_marcar_stock_reservado(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET stock_reservado = 1 WHERE id = p_id_pedido;
END$$

DELIMITER ;
