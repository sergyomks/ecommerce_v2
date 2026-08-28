

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_informacion_envio;

DELIMITER $$

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

DELIMITER ;
