

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_cupon;

DELIMITER $$

CREATE PROCEDURE sp_crear_cupon(
  IN p_id CHAR(36), IN p_codigo VARCHAR(50), IN p_tipo VARCHAR(20), IN p_valor DECIMAL(10,2),
  IN p_minimo_compra DECIMAL(10,2), IN p_usos_max INT, IN p_fecha_inicio DATETIME,
  IN p_fecha_fin DATETIME, IN p_activo INT
)
BEGIN
  INSERT INTO cupones (id, codigo, tipo, valor, minimo_compra, usos_maximos, fecha_inicio, fecha_fin, activo)
  VALUES (p_id, p_codigo, p_tipo, p_valor, p_minimo_compra, p_usos_max, p_fecha_inicio, p_fecha_fin, p_activo);

  SELECT * FROM cupones WHERE id = p_id;
END$$

DELIMITER ;
