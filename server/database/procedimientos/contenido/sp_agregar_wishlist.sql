

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_agregar_wishlist;

DELIMITER $$

CREATE PROCEDURE sp_agregar_wishlist(IN p_id CHAR(36), IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  DECLARE v_activo INT;
  SELECT 1 INTO v_activo FROM productos WHERE id = p_id_producto AND estado = 'activo' LIMIT 1;

  IF v_activo IS NULL THEN
    SELECT 0 AS status, 'Producto no encontrado' AS message;
  ELSE
    BEGIN
      DECLARE CONTINUE HANDLER FOR 1062 SELECT 2 AS status, 'El producto ya está en tu lista de deseos' AS message;
      INSERT INTO lista_deseos (id, id_usuario, id_producto) VALUES (p_id, p_id_usuario, p_id_producto);
      SELECT 1 AS status, 'Producto agregado a la lista de deseos' AS message;
    END;
  END IF;
END$$

DELIMITER ;
