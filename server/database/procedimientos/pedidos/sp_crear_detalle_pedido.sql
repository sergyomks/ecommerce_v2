

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_detalle_pedido;

DELIMITER $$

CREATE PROCEDURE sp_crear_detalle_pedido(
  IN p_id CHAR(36), IN p_id_pedido CHAR(36), IN p_id_producto CHAR(36),
  IN p_titulo VARCHAR(255), IN p_precio DECIMAL(10,2), IN p_cantidad INT,
  IN p_imagen JSON,
  IN p_id_variante CHAR(36), IN p_talla VARCHAR(20), IN p_color VARCHAR(40)
)
BEGIN

  INSERT INTO detalles_pedido
    (id, id_pedido, id_producto, titulo, precio, cantidad, imagen,
     id_variante, talla, color)
  VALUES
    (p_id, p_id_pedido, p_id_producto, p_titulo, p_precio, p_cantidad, p_imagen,
     p_id_variante, p_talla, p_color);
END$$

DELIMITER ;
