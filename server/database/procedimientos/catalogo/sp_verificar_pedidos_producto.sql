

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_pedidos_producto;

DELIMITER $$

CREATE PROCEDURE sp_verificar_pedidos_producto(IN p_id CHAR(36))
BEGIN
  SELECT 1 AS tiene_pedidos FROM detalles_pedido WHERE id_producto = p_id LIMIT 1;
END$$

DELIMITER ;
