

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_actualizar_tarifa_envio$$
CREATE PROCEDURE sp_actualizar_tarifa_envio(
  IN p_id CHAR(36), IN p_precio DECIMAL(10,2), IN p_activo INT
)
BEGIN
  UPDATE tarifas_envio SET precio = p_precio, activo = p_activo, fecha_actualizacion = NOW() WHERE id = p_id;

  SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
  FROM tarifas_envio t
  INNER JOIN departamentos d ON d.id = t.id_departamento
  WHERE t.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_informacion_envio$$
CREATE PROCEDURE sp_crear_informacion_envio(
  IN p_id CHAR(36), IN p_id_pedido CHAR(36), IN p_id_distrito INT,
  IN p_nombre_completo VARCHAR(100),
  IN p_direccion VARCHAR(255), IN p_referencia VARCHAR(255),
  IN p_codigo_postal VARCHAR(20), IN p_telefono VARCHAR(20)
)
BEGIN

  INSERT INTO informacion_envio (
    id, id_pedido, id_distrito, nombre_completo,
    direccion, referencia, codigo_postal, telefono
  ) VALUES (
    p_id, p_id_pedido, p_id_distrito, p_nombre_completo,
    p_direccion, p_referencia, p_codigo_postal, p_telefono
  );
END$$

DROP PROCEDURE IF EXISTS sp_crear_tarifa_envio$$
CREATE PROCEDURE sp_crear_tarifa_envio(
  IN p_id CHAR(36), IN p_id_departamento CHAR(2), IN p_precio DECIMAL(10,2), IN p_activo INT
)
BEGIN
  INSERT INTO tarifas_envio (id, id_departamento, precio, activo)
  VALUES (p_id, p_id_departamento, p_precio, p_activo);

  SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
  FROM tarifas_envio t
  INNER JOIN departamentos d ON d.id = t.id_departamento
  WHERE t.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_tarifa_envio$$
CREATE PROCEDURE sp_eliminar_tarifa_envio(IN p_id CHAR(36))
BEGIN
  DELETE FROM tarifas_envio WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_listar_departamentos$$
CREATE PROCEDURE sp_listar_departamentos()
BEGIN
  SELECT id, nombre, ubigeo FROM departamentos ORDER BY nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_distritos_por_provincia$$
CREATE PROCEDURE sp_listar_distritos_por_provincia(IN p_id_provincia INT)
BEGIN
  SELECT id, nombre, id_provincia, ubigeo FROM distritos WHERE id_provincia = p_id_provincia ORDER BY nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_provincias_por_departamento$$
CREATE PROCEDURE sp_listar_provincias_por_departamento(IN p_id_departamento INT)
BEGIN
  SELECT id, nombre, id_departamento, ubigeo FROM provincias WHERE id_departamento = p_id_departamento ORDER BY nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_tarifas_envio$$
CREATE PROCEDURE sp_listar_tarifas_envio(IN p_solo_activas INT)
BEGIN
  IF p_solo_activas = 1 THEN
    SELECT d.nombre AS departamento, t.precio
    FROM tarifas_envio t
    INNER JOIN departamentos d ON d.id = t.id_departamento
    WHERE t.activo = 1
    ORDER BY d.nombre ASC;
  ELSE
    SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
    FROM tarifas_envio t
    INNER JOIN departamentos d ON d.id = t.id_departamento
    ORDER BY d.nombre ASC;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_departamento_por_nombre$$
CREATE PROCEDURE sp_obtener_departamento_por_nombre(IN p_nombre VARCHAR(255))
BEGIN
  SELECT id FROM departamentos WHERE nombre = p_nombre LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_distrito_por_id$$

CREATE PROCEDURE sp_obtener_distrito_por_id(IN p_id INT)
BEGIN
  SELECT di.id, di.nombre AS distrito, di.ubigeo,
         pr.id AS id_provincia, pr.nombre AS provincia,
         de.id AS id_departamento, de.nombre AS departamento
  FROM distritos di
  INNER JOIN provincias pr ON pr.id = di.id_provincia
  INNER JOIN departamentos de ON de.id = pr.id_departamento
  WHERE di.id = p_id
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_distrito_por_nombres$$
CREATE PROCEDURE sp_obtener_distrito_por_nombres(
  IN p_distrito VARCHAR(100), IN p_provincia VARCHAR(100), IN p_departamento VARCHAR(100)
)
BEGIN
  SELECT di.id
  FROM distritos di
  JOIN provincias pr ON di.id_provincia = pr.id
  JOIN departamentos de ON pr.id_departamento = de.id
  WHERE di.nombre = p_distrito AND pr.nombre = p_provincia AND de.nombre = p_departamento
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_info_envio_pedido$$
CREATE PROCEDURE sp_obtener_info_envio_pedido(IN p_id_pedido CHAR(36))
BEGIN
  SELECT ie.nombre_completo, ie.direccion,
         pr.nombre AS provincia, di.nombre AS distrito,
         ie.telefono
  FROM informacion_envio ie
  INNER JOIN distritos di ON di.id = ie.id_distrito
  INNER JOIN provincias pr ON pr.id = di.id_provincia
  WHERE ie.id_pedido = p_id_pedido
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_tarifa_envio$$
CREATE PROCEDURE sp_obtener_tarifa_envio(IN p_id CHAR(36))
BEGIN
  SELECT * FROM tarifas_envio WHERE id = p_id LIMIT 1;
END$$

DELIMITER ;
