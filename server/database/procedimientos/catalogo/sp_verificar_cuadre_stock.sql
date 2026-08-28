

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_cuadre_stock;

DELIMITER $$

CREATE PROCEDURE sp_verificar_cuadre_stock()
BEGIN
  SELECT
    p.id,
    p.nombre,
    p.stock                          AS total_guardado,
    COALESCE(SUM(v.stock), 0)        AS suma_variantes,
    p.stock - COALESCE(SUM(v.stock), 0) AS diferencia
  FROM productos p
  LEFT JOIN variantes_producto v
    ON v.id_producto = p.id AND v.activo = 1
  WHERE p.estado = 'activo'
  GROUP BY p.id, p.nombre, p.stock
  HAVING p.stock <> COALESCE(SUM(v.stock), 0);
END$$

DELIMITER ;
