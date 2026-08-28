

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_detalles_pedido;

DELIMITER $$

CREATE PROCEDURE sp_obtener_detalles_pedido(IN p_id_pedido CHAR(36))
BEGIN
  SELECT id_producto, id_variante, talla, color, cantidad, titulo, precio
  FROM detalles_pedido WHERE id_pedido = p_id_pedido;
END$$

DELIMITER ;
