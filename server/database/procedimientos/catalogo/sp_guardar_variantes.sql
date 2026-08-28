

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_guardar_variantes;

DELIMITER $$

CREATE PROCEDURE sp_guardar_variantes(
  IN p_id_producto CHAR(36),
  IN p_variantes JSON
)
BEGIN
  IF JSON_LENGTH(p_variantes) IS NULL OR JSON_LENGTH(p_variantes) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTES_VACIAS';
  END IF;

  INSERT INTO variantes_producto
    (id, id_producto, talla, color, color_hex, sku, stock, activo)
  SELECT
    UUID(), p_id_producto, j.talla, j.color,
    NULLIF(j.color_hex, ''), NULLIF(j.sku, ''),
    GREATEST(COALESCE(j.stock, 0), 0), 1
  FROM JSON_TABLE(p_variantes, '$[*]' COLUMNS (
    talla     VARCHAR(20) PATH '$.talla',
    color     VARCHAR(40) PATH '$.color',
    color_hex VARCHAR(7)  PATH '$.color_hex',
    sku       VARCHAR(60) PATH '$.sku',
    stock     INT         PATH '$.stock'
  )) j
  WHERE j.talla IS NOT NULL AND j.color IS NOT NULL
  ON DUPLICATE KEY UPDATE
    stock               = VALUES(stock),
    color_hex           = VALUES(color_hex),
    sku                 = VALUES(sku),
    activo              = 1,
    fecha_actualizacion = NOW();

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = p_id_producto;

  SELECT id, talla, color, color_hex, sku, stock, activo
  FROM variantes_producto
  WHERE id_producto = p_id_producto
  ORDER BY color ASC, FIELD(talla, 'XS','S','M','L','XL','XXL'), talla ASC;
END$$

DELIMITER ;
