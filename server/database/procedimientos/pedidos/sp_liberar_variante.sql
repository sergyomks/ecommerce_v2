

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_liberar_variante;

DELIMITER $$

CREATE PROCEDURE sp_liberar_variante(
  IN p_id_variante CHAR(36),
  IN p_cantidad INT
)
BEGIN
  DECLARE v_id_producto CHAR(36);

  SELECT id_producto INTO v_id_producto
  FROM variantes_producto WHERE id = p_id_variante;

  IF v_id_producto IS NOT NULL AND p_cantidad > 0 THEN
    UPDATE variantes_producto
    SET stock = stock + p_cantidad, fecha_actualizacion = NOW()
    WHERE id = p_id_variante;

    UPDATE productos p
    SET p.stock = COALESCE((
          SELECT SUM(v.stock) FROM variantes_producto v
          WHERE v.id_producto = p.id AND v.activo = 1
        ), 0)
    WHERE p.id = v_id_producto;
  END IF;

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
