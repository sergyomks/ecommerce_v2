

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_wishlist;

DELIMITER $$

CREATE PROCEDURE sp_listar_wishlist(IN p_id_usuario CHAR(36))
BEGIN
  SELECT
     w.id AS wishlist_id,
     w.fecha_creacion AS agregado_en,
     p.id,
     p.nombre,
     p.descripcion,
     p.precio,
     c.nombre AS categoria,
     p.stock,
     p.imagenes,
     p.calificaciones
   FROM lista_deseos w
   INNER JOIN productos p ON p.id = w.id_producto
   INNER JOIN categorias c ON c.id = p.id_categoria
   WHERE w.id_usuario = p_id_usuario AND p.estado = 'activo'
   ORDER BY w.fecha_creacion DESC;
END$$

DELIMITER ;
