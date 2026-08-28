

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_reservar_variante;

DELIMITER $$

CREATE PROCEDURE sp_reservar_variante(
  IN p_id_variante CHAR(36),
  IN p_cantidad INT
)
BEGIN
  DECLARE v_id_producto CHAR(36);

  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANTIDAD_INVALIDA';
  END IF;

  SELECT id_producto INTO v_id_producto
  FROM variantes_producto WHERE id = p_id_variante;

  IF v_id_producto IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTE_NO_ENCONTRADA';
  END IF;

  UPDATE variantes_producto
  SET stock = stock - p_cantidad,
      fecha_actualizacion = NOW()
  WHERE id = p_id_variante AND activo = 1 AND stock >= p_cantidad;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOCK_INSUFICIENTE';
  END IF;

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = v_id_producto;

  SELECT v.id, v.stock AS stock_variante, p.stock AS stock_producto
  FROM variantes_producto v JOIN productos p ON p.id = v.id_producto
  WHERE v.id = p_id_variante;
END$$

DELIMITER ;
