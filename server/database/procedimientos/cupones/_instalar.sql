

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_actualizar_cupon$$
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

DROP PROCEDURE IF EXISTS sp_contar_usos_cupon$$
CREATE PROCEDURE sp_contar_usos_cupon(IN p_id CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM pedidos WHERE id_cupon = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_cupon$$
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

DROP PROCEDURE IF EXISTS sp_eliminar_cupon$$
CREATE PROCEDURE sp_eliminar_cupon(IN p_id CHAR(36))
BEGIN
  DELETE FROM cupones WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_incrementar_uso_cupon$$
CREATE PROCEDURE sp_incrementar_uso_cupon(IN p_id_cupon CHAR(36))
BEGIN
  UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = p_id_cupon;
END$$

DROP PROCEDURE IF EXISTS sp_listar_cupones$$
CREATE PROCEDURE sp_listar_cupones()
BEGIN
  SELECT * FROM cupones ORDER BY fecha_creacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_cupon_por_codigo$$
CREATE PROCEDURE sp_obtener_cupon_por_codigo(IN p_codigo VARCHAR(50), IN p_lock INT)
BEGIN
  IF p_lock = 1 THEN
    SELECT * FROM cupones WHERE codigo = p_codigo LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * FROM cupones WHERE codigo = p_codigo LIMIT 1;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_cupon_por_id$$
CREATE PROCEDURE sp_obtener_cupon_por_id(IN p_id CHAR(36), IN p_lock INT)
BEGIN
  IF p_lock = 1 THEN
    SELECT * FROM cupones WHERE id = p_id LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * FROM cupones WHERE id = p_id LIMIT 1;
  END IF;
END$$

DELIMITER ;
