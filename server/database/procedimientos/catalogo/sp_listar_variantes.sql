

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_variantes;

DELIMITER $$

CREATE PROCEDURE sp_listar_variantes(
  IN p_id_producto CHAR(36),
  IN p_solo_disponibles INT
)
BEGIN
  SELECT id, id_producto, talla, color, color_hex, sku, stock, activo
  FROM variantes_producto
  WHERE id_producto = p_id_producto
    AND (p_solo_disponibles = 0 OR activo = 1)
  ORDER BY color ASC, FIELD(talla, 'XS','S','M','L','XL','XXL'), talla ASC;
END$$

DELIMITER ;
