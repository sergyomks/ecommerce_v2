

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_oferta_producto;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_oferta_producto(
  IN p_id CHAR(36),
  IN p_precio_oferta DECIMAL(10,2),
  IN p_inicio DATETIME,
  IN p_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL AND p_fin IS NOT NULL
     AND p_inicio IS NOT NULL AND p_fin < p_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  UPDATE productos
  SET precio_oferta = p_precio_oferta,
      oferta_inicio = IF(p_precio_oferta IS NULL, NULL, p_inicio),
      oferta_fin    = IF(p_precio_oferta IS NULL, NULL, p_fin)
  WHERE id = p_id
    AND estado = 'activo'
    AND (p_precio_oferta IS NULL OR (p_precio_oferta > 0 AND p_precio_oferta < precio));

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_NO_APLICABLE';
  END IF;

  SELECT id, precio, precio_oferta, oferta_inicio, oferta_fin,
         fn_precio_efectivo(precio, precio_oferta, oferta_inicio, oferta_fin, NOW()) AS precio_efectivo
  FROM productos WHERE id = p_id;
END$$

DELIMITER ;
