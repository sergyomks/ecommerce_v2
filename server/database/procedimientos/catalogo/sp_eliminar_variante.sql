

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_variante;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_variante(IN p_id CHAR(36))
BEGIN
  DECLARE v_id_producto CHAR(36);
  DECLARE v_con_pedidos INT DEFAULT 0;

  SELECT id_producto INTO v_id_producto
  FROM variantes_producto WHERE id = p_id;

  IF v_id_producto IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTE_NO_ENCONTRADA';
  END IF;

  SELECT COUNT(*) INTO v_con_pedidos
  FROM detalles_pedido WHERE id_variante = p_id;

  IF v_con_pedidos > 0 THEN
    UPDATE variantes_producto
    SET activo = 0, stock = 0, fecha_actualizacion = NOW()
    WHERE id = p_id;
  ELSE
    DELETE FROM variantes_producto WHERE id = p_id;
  END IF;

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = v_id_producto;

  SELECT v_con_pedidos > 0 AS desactivada, v_con_pedidos AS pedidos_afectados;
END$$

DELIMITER ;
