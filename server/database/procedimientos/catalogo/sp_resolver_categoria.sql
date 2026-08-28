

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_resolver_categoria;

DELIMITER $$

CREATE PROCEDURE sp_resolver_categoria(IN p_valor VARCHAR(255))
BEGIN
  SELECT id FROM categorias WHERE (nombre = p_valor OR id = p_valor) AND activo = 1 LIMIT 1;
END$$

DELIMITER ;
