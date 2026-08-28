

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_cupon;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_cupon(
  IN p_id CHAR(36), IN p_codigo VARCHAR(50), IN p_tipo VARCHAR(20), IN p_valor DECIMAL(10,2),
  IN p_minimo_compra DECIMAL(10,2), IN p_usos_max INT, IN p_fecha_inicio DATETIME,
  IN p_fecha_fin DATETIME, IN p_activo INT
)
BEGIN
  UPDATE cupones
  SET codigo = p_codigo, tipo = p_tipo, valor = p_valor,
      minimo_compra = p_minimo_compra, usos_maximos = p_usos_max,
      fecha_inicio = p_fecha_inicio, fecha_fin = p_fecha_fin, activo = p_activo
  WHERE id = p_id;

  SELECT * FROM cupones WHERE id = p_id;
END$$

DELIMITER ;
