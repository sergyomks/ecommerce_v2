

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_actualizar_contrasena$$
CREATE PROCEDURE sp_actualizar_contrasena(IN p_id CHAR(36), IN p_hashed_password VARCHAR(255))
BEGIN
  UPDATE usuarios SET contraseña = p_hashed_password, reset_contraseña_token = NULL, reset_contraseña_expire = NULL WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_perfil$$
CREATE PROCEDURE sp_actualizar_perfil(IN p_id CHAR(36), IN p_nombre VARCHAR(100), IN p_email VARCHAR(100), IN p_imagen JSON)
BEGIN
  IF p_imagen IS NOT NULL THEN
    UPDATE usuarios SET nombre = p_nombre, email = p_email, imagen = p_imagen WHERE id = p_id;
  ELSE
    UPDATE usuarios SET nombre = p_nombre, email = p_email WHERE id = p_id;
  END IF;

  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_reset_token$$
CREATE PROCEDURE sp_actualizar_reset_token(IN p_id CHAR(36), IN p_token VARCHAR(255), IN p_expire DATETIME)
BEGIN
  UPDATE usuarios SET reset_contraseña_token = p_token, reset_contraseña_expire = p_expire WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_contar_pedidos_pagados_por_usuario$$
CREATE PROCEDURE sp_contar_pedidos_pagados_por_usuario(IN p_id_usuario CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM pedidos WHERE id_comprador = p_id_usuario AND fecha_pagado IS NOT NULL;
END$$

DROP PROCEDURE IF EXISTS sp_contar_productos_por_creador$$
CREATE PROCEDURE sp_contar_productos_por_creador(IN p_id_usuario CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM productos WHERE creado_por = p_id_usuario;
END$$

DROP PROCEDURE IF EXISTS sp_contar_usuarios_por_rol$$
CREATE PROCEDURE sp_contar_usuarios_por_rol(IN p_rol_nombre VARCHAR(50))
BEGIN
  SELECT COUNT(*) AS total_usuarios
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE r.nombre = p_rol_nombre;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_usuario$$
CREATE PROCEDURE sp_eliminar_usuario(IN p_id CHAR(36))
BEGIN
  DELETE FROM usuarios WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_limpiar_intentos_fallidos$$
CREATE PROCEDURE sp_limpiar_intentos_fallidos(IN p_id CHAR(36))
BEGIN

  UPDATE usuarios
  SET intentos_fallidos = 0, bloqueado_hasta = NULL
  WHERE id = p_id AND (intentos_fallidos <> 0 OR bloqueado_hasta IS NOT NULL);

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_limpiar_reset_token$$
CREATE PROCEDURE sp_limpiar_reset_token(IN p_id CHAR(36))
BEGIN
  UPDATE usuarios SET reset_contraseña_token = NULL, reset_contraseña_expire = NULL WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_listar_usuarios_paginado$$
CREATE PROCEDURE sp_listar_usuarios_paginado(
  IN p_rol_nombre VARCHAR(50),
  IN p_limite INT,
  IN p_offset INT
)
BEGIN
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE r.nombre = p_rol_nombre
  ORDER BY u.fecha_creacion DESC
  LIMIT p_limite OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_rol_por_nombre$$
CREATE PROCEDURE sp_obtener_rol_por_nombre(IN p_nombre VARCHAR(50))
BEGIN
  SELECT id FROM roles WHERE nombre = p_nombre LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_email_nombre$$
CREATE PROCEDURE sp_obtener_usuario_email_nombre(IN p_id CHAR(36))
BEGIN
  SELECT nombre, email FROM usuarios WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_nombre$$
CREATE PROCEDURE sp_obtener_usuario_nombre(IN p_id CHAR(36))
BEGIN
  SELECT nombre FROM usuarios WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_email$$
CREATE PROCEDURE sp_obtener_usuario_por_email(IN p_email VARCHAR(100))
BEGIN
  SELECT u.id, u.nombre, u.email, u.contraseña, r.nombre AS rol, u.imagen, u.fecha_creacion,
         u.intentos_fallidos, u.bloqueado_hasta,
         u.google_id,
         (u.contraseña IS NOT NULL) AS tiene_contrasena,
         (u.google_id IS NOT NULL) AS tiene_google,
         (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS esta_bloqueado,
         TIMESTAMPDIFF(SECOND, NOW(), u.bloqueado_hasta) AS segundos_restantes
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.email = p_email
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_google$$

CREATE PROCEDURE sp_obtener_usuario_por_google(
  IN p_google_id VARCHAR(64),
  IN p_email VARCHAR(100)
)
BEGIN
  SELECT u.id, u.nombre, u.email, u.imagen, u.google_id, r.nombre AS rol,
         u.fecha_creacion,
         (u.contraseña IS NOT NULL) AS tiene_contrasena,
         (u.google_id  IS NOT NULL) AS tiene_google,
         (u.google_id IS NOT NULL AND u.google_id = p_google_id) AS coincide_google
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.google_id = p_google_id OR u.email = p_email
  ORDER BY (u.google_id = p_google_id) DESC
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_id$$
CREATE PROCEDURE sp_obtener_usuario_por_id(IN p_id CHAR(36))
BEGIN
  SELECT u.id, u.nombre, u.email, u.contraseña, r.nombre AS rol, u.imagen,
         u.reset_contraseña_token, u.reset_contraseña_expire, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.id = p_id
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_reset_token$$
CREATE PROCEDURE sp_obtener_usuario_por_reset_token(IN p_token VARCHAR(255))
BEGIN
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.reset_contraseña_token = p_token AND u.reset_contraseña_expire > NOW();
END$$

DROP PROCEDURE IF EXISTS sp_registrar_intento_fallido$$
CREATE PROCEDURE sp_registrar_intento_fallido(
  IN p_email VARCHAR(100),
  IN p_max_intentos INT,
  IN p_minutos_bloqueo INT
)
BEGIN

  UPDATE usuarios
  SET bloqueado_hasta = IF(intentos_fallidos + 1 >= p_max_intentos,
                           NOW() + INTERVAL p_minutos_bloqueo MINUTE,
                           bloqueado_hasta),
      intentos_fallidos = IF(intentos_fallidos + 1 >= p_max_intentos,
                             0,
                             intentos_fallidos + 1)
  WHERE email = p_email;

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_registrar_usuario$$
CREATE PROCEDURE sp_registrar_usuario(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_contrasena TEXT,
  IN p_id_rol INT
)
BEGIN
  INSERT INTO usuarios (id, nombre, email, contraseña, id_rol)
  VALUES (p_id, p_nombre, p_email, p_contrasena, p_id_rol);
END$$

DROP PROCEDURE IF EXISTS sp_registrar_usuario_google$$

CREATE PROCEDURE sp_registrar_usuario_google(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_google_id VARCHAR(64),
  IN p_imagen JSON,
  IN p_id_rol INT
)
BEGIN
  INSERT INTO usuarios (id, nombre, email, contraseña, google_id, imagen, id_rol)
  VALUES (p_id, p_nombre, p_email, NULL, p_google_id, p_imagen, p_id_rol);

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_email_en_uso$$
CREATE PROCEDURE sp_verificar_email_en_uso(IN p_email VARCHAR(100), IN p_id CHAR(36))
BEGIN
  SELECT id FROM usuarios WHERE email = p_email AND id <> p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_vincular_google$$

CREATE PROCEDURE sp_vincular_google(
  IN p_id CHAR(36),
  IN p_google_id VARCHAR(64)
)
BEGIN
  UPDATE usuarios
  SET google_id = p_google_id
  WHERE id = p_id AND google_id IS NULL;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'GOOGLE_YA_VINCULADO';
  END IF;

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
