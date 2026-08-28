

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_productos_por_creador;

DELIMITER $$

CREATE PROCEDURE sp_contar_productos_por_creador(IN p_id_usuario CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM productos WHERE creado_por = p_id_usuario;
END$$

DELIMITER ;
