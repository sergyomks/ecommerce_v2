

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_resolver_subcategoria;

DELIMITER $$

CREATE PROCEDURE sp_resolver_subcategoria(IN p_valor VARCHAR(255))
BEGIN
  SELECT id, id_categoria FROM subcategorias WHERE (nombre = p_valor OR id = p_valor) AND activo = 1 LIMIT 1;
END$$

DELIMITER ;
