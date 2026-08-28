

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_info_envio_pedido;

DELIMITER $$

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

DELIMITER ;
