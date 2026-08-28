

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_subcategorias_por_categoria;

DELIMITER $$

CREATE PROCEDURE sp_contar_subcategorias_por_categoria(IN p_id_categoria CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM subcategorias WHERE id_categoria = p_id_categoria;
END$$

DELIMITER ;
