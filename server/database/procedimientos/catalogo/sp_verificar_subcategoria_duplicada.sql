

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_subcategoria_duplicada;

DELIMITER $$

CREATE PROCEDURE sp_verificar_subcategoria_duplicada(IN p_nombre VARCHAR(100), IN p_slug VARCHAR(120), IN p_id CHAR(36))
BEGIN
  IF p_id IS NULL THEN
    SELECT id FROM subcategorias WHERE (nombre = p_nombre OR slug = p_slug) LIMIT 1;
  ELSE
    SELECT id FROM subcategorias WHERE (nombre = p_nombre OR slug = p_slug) AND id <> p_id LIMIT 1;
  END IF;
END$$

DELIMITER ;
