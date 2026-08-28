

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_wishlist;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_wishlist(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  DELETE FROM lista_deseos WHERE id_usuario = p_id_usuario AND id_producto = p_id_producto;
  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
