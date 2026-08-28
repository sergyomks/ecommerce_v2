

SET NAMES utf8mb4;

DROP FUNCTION IF EXISTS fn_precio_efectivo;

DELIMITER $$

CREATE FUNCTION fn_precio_efectivo(
  p_precio        DECIMAL(10,2),
  p_precio_oferta DECIMAL(10,2),
  p_inicio        DATETIME,
  p_fin           DATETIME,
  p_ahora         DATETIME
) RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
  IF p_precio_oferta IS NULL
     OR p_precio_oferta <= 0
     OR p_precio_oferta >= p_precio
     OR (p_inicio IS NOT NULL AND p_ahora < p_inicio)
     OR (p_fin    IS NOT NULL AND p_ahora > p_fin)
  THEN
    RETURN p_precio;
  END IF;

  RETURN p_precio_oferta;
END$$

DELIMITER ;
