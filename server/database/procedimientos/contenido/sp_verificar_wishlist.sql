

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_wishlist;

DELIMITER $$

CREATE PROCEDURE sp_verificar_wishlist(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  SELECT id FROM lista_deseos WHERE id_usuario = p_id_usuario AND id_producto = p_id_producto LIMIT 1;
END$$

DELIMITER ;
