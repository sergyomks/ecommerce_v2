

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_bloquear_variantes_pedido;

DELIMITER $$

CREATE PROCEDURE sp_bloquear_variantes_pedido(IN p_ids JSON)
BEGIN
  SELECT
    v.id            AS id_variante,
    v.id_producto,
    v.talla,
    v.color,
    v.stock         AS stock_variante,
    v.activo,
    p.nombre,
    p.imagenes,
    p.precio,
    fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo
  FROM variantes_producto v
  INNER JOIN productos p ON p.id = v.id_producto
  WHERE v.id IN (
      SELECT CONVERT(j.id USING utf8mb4) COLLATE utf8mb4_spanish2_ci
      FROM JSON_TABLE(p_ids, '$[*]' COLUMNS (id CHAR(36) PATH '$')) j
    )
    AND p.estado = 'activo' AND v.activo = 1
  ORDER BY v.id
  FOR UPDATE;
END$$

DELIMITER ;
