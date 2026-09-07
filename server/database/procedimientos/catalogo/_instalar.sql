

SET NAMES utf8mb4;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_precio_efectivo$$

CREATE FUNCTION fn_precio_efectivo(
  p_precio        DECIMAL(10,2),
  p_precio_oferta DECIMAL(10,2),
  p_inicio        DATETIME,
  p_fin           DATETIME,
  p_ahora         DATETIME
) RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
  IF p_precio_oferta IS NULL
     OR p_precio_oferta <= 0
     OR p_precio_oferta >= p_precio
     OR (p_inicio IS NOT NULL AND p_ahora < p_inicio)
     OR (p_fin    IS NOT NULL AND p_ahora > p_fin)
  THEN
    RETURN p_precio;
  END IF;

  RETURN p_precio_oferta;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_categoria$$
CREATE PROCEDURE sp_actualizar_categoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  UPDATE categorias
  SET nombre = p_nombre, slug = p_slug, imagen = p_imagen, activo = p_activo, fecha_actualizacion = NOW()
  WHERE id = p_id;

  SELECT c.* FROM categorias c WHERE c.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_oferta_producto$$

CREATE PROCEDURE sp_actualizar_oferta_producto(
  IN p_id CHAR(36),
  IN p_precio_oferta DECIMAL(10,2),
  IN p_inicio DATETIME,
  IN p_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL AND p_fin IS NOT NULL
     AND p_inicio IS NOT NULL AND p_fin < p_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  UPDATE productos
  SET precio_oferta = p_precio_oferta,
      oferta_inicio = IF(p_precio_oferta IS NULL, NULL, p_inicio),
      oferta_fin    = IF(p_precio_oferta IS NULL, NULL, p_fin)
  WHERE id = p_id
    AND estado = 'activo'
    AND (p_precio_oferta IS NULL OR (p_precio_oferta > 0 AND p_precio_oferta < precio));

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_NO_APLICABLE';
  END IF;

  SELECT id, precio, precio_oferta, oferta_inicio, oferta_fin,
         fn_precio_efectivo(precio, precio_oferta, oferta_inicio, oferta_fin, NOW()) AS precio_efectivo
  FROM productos WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_producto_completo$$
CREATE PROCEDURE sp_actualizar_producto_completo(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_precio DECIMAL(10,2),
  IN p_id_categoria CHAR(36),
  IN p_id_subcategoria CHAR(36),
  IN p_stock INT,
  IN p_imagenes JSON,
  IN p_precio_oferta DECIMAL(10,2),
  IN p_oferta_inicio DATETIME,
  IN p_oferta_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL
     AND (p_precio_oferta <= 0 OR p_precio_oferta >= p_precio) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PRECIO_OFERTA_INVALIDO';
  END IF;

  IF p_precio_oferta IS NOT NULL
     AND p_oferta_inicio IS NOT NULL
     AND p_oferta_fin IS NOT NULL
     AND p_oferta_fin < p_oferta_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  UPDATE productos
  SET nombre = p_nombre, descripcion = p_descripcion, precio = p_precio,
      id_categoria = p_id_categoria, id_subcategoria = p_id_subcategoria,
      stock = p_stock, imagenes = p_imagenes,
      precio_oferta = p_precio_oferta,
      oferta_inicio = p_oferta_inicio,
      oferta_fin = p_oferta_fin
  WHERE id = p_id;

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
         fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
         (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_subcategoria$$
CREATE PROCEDURE sp_actualizar_subcategoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_id_categoria CHAR(36),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  UPDATE subcategorias
  SET nombre = p_nombre, slug = p_slug, id_categoria = p_id_categoria, imagen = p_imagen, activo = p_activo, fecha_actualizacion = NOW()
  WHERE id = p_id;

  SELECT s.*, c.nombre AS categoria_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE s.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_buscar_productos$$
CREATE PROCEDURE sp_buscar_productos(
  IN p_disponibilidad VARCHAR(20),
  IN p_min_precio DECIMAL(10,2),
  IN p_max_precio DECIMAL(10,2),
  IN p_categoria VARCHAR(255),
  IN p_calificaciones DECIMAL(3,2),
  IN p_buscar VARCHAR(255),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
      p.*,
      COALESCE(s.nombre, c.nombre) AS categoria,
      s.nombre AS subcategoria,
      c.nombre AS categoria_padre,
      COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.estado = 'activo'
    AND (p_disponibilidad IS NULL OR
         (p_disponibilidad = 'en_stock' AND p.stock > 5) OR
         (p_disponibilidad = 'limitado' AND p.stock > 0 AND p.stock <= 5) OR
         (p_disponibilidad = 'agotado' AND p.stock = 0))
    AND (p_min_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) >= p_min_precio)
    AND (p_max_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) <= p_max_precio)
    AND (p_categoria IS NULL OR c.nombre = p_categoria OR s.nombre = p_categoria OR c.id = p_categoria OR s.id = p_categoria)
    AND (p_calificaciones IS NULL OR p.calificaciones >= p_calificaciones)
    AND (p_buscar IS NULL OR p.nombre LIKE CONCAT('%', p_buscar, '%') OR p.descripcion LIKE CONCAT('%', p_buscar, '%'))
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_buscar_productos_ia$$
CREATE PROCEDURE sp_buscar_productos_ia(IN p_regex_keywords TEXT)
BEGIN
  SELECT p.*, c.nombre AS categoria
  FROM productos p
  INNER JOIN categorias c ON c.id = p.id_categoria
  WHERE p.estado = 'activo'
  AND (p.nombre REGEXP p_regex_keywords OR p.descripcion REGEXP p_regex_keywords OR c.nombre REGEXP p_regex_keywords)
  LIMIT 200;
END$$

DROP PROCEDURE IF EXISTS sp_contar_buscar_productos$$
CREATE PROCEDURE sp_contar_buscar_productos(
  IN p_disponibilidad VARCHAR(20),
  IN p_min_precio DECIMAL(10,2),
  IN p_max_precio DECIMAL(10,2),
  IN p_categoria VARCHAR(255),
  IN p_calificaciones DECIMAL(3,2),
  IN p_buscar VARCHAR(255)
)
BEGIN
  SELECT COUNT(*) as total
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.estado = 'activo'
    AND (p_disponibilidad IS NULL OR
         (p_disponibilidad = 'en_stock' AND p.stock > 5) OR
         (p_disponibilidad = 'limitado' AND p.stock > 0 AND p.stock <= 5) OR
         (p_disponibilidad = 'agotado' AND p.stock = 0))
    AND (p_min_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) >= p_min_precio)
    AND (p_max_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) <= p_max_precio)
    AND (p_categoria IS NULL OR c.nombre = p_categoria OR s.nombre = p_categoria OR c.id = p_categoria OR s.id = p_categoria)
    AND (p_calificaciones IS NULL OR p.calificaciones >= p_calificaciones)
    AND (p_buscar IS NULL OR p.nombre LIKE CONCAT('%', p_buscar, '%') OR p.descripcion LIKE CONCAT('%', p_buscar, '%'));
END$$

DROP PROCEDURE IF EXISTS sp_contar_productos_por_categoria$$
CREATE PROCEDURE sp_contar_productos_por_categoria(IN p_id_categoria CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM productos WHERE id_categoria = p_id_categoria AND estado = 'activo';
END$$

DROP PROCEDURE IF EXISTS sp_contar_subcategorias_por_categoria$$
CREATE PROCEDURE sp_contar_subcategorias_por_categoria(IN p_id_categoria CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM subcategorias WHERE id_categoria = p_id_categoria;
END$$

DROP PROCEDURE IF EXISTS sp_crear_categoria$$
CREATE PROCEDURE sp_crear_categoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_imagen JSON
)
BEGIN
  INSERT INTO categorias (id, nombre, slug, imagen, activo)
  VALUES (p_id, p_nombre, p_slug, p_imagen, 1);

  SELECT c.* FROM categorias c WHERE c.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_producto$$
CREATE PROCEDURE sp_crear_producto(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_precio DECIMAL(10,2),
  IN p_id_categoria CHAR(36),
  IN p_id_subcategoria CHAR(36),
  IN p_stock INT,
  IN p_imagenes JSON,
  IN p_creado_por CHAR(36),
  IN p_precio_oferta DECIMAL(10,2),
  IN p_oferta_inicio DATETIME,
  IN p_oferta_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL
     AND (p_precio_oferta <= 0 OR p_precio_oferta >= p_precio) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PRECIO_OFERTA_INVALIDO';
  END IF;

  IF p_precio_oferta IS NOT NULL
     AND p_oferta_inicio IS NOT NULL
     AND p_oferta_fin IS NOT NULL
     AND p_oferta_fin < p_oferta_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  INSERT INTO productos (
    id, nombre, descripcion, precio, id_categoria, id_subcategoria, stock, imagenes, creado_por,
    precio_oferta, oferta_inicio, oferta_fin
  )
  VALUES (
    p_id, p_nombre, p_descripcion, p_precio, p_id_categoria, p_id_subcategoria, p_stock, p_imagenes, p_creado_por,
    p_precio_oferta, p_oferta_inicio, p_oferta_fin
  );

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
         fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
         (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_subcategoria$$
CREATE PROCEDURE sp_crear_subcategoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_id_categoria CHAR(36),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  INSERT INTO subcategorias (id, nombre, slug, id_categoria, imagen, activo)
  VALUES (p_id, p_nombre, p_slug, p_id_categoria, p_imagen, p_activo);

  SELECT s.*, c.nombre AS categoria_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE s.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_desactivar_categoria$$
CREATE PROCEDURE sp_desactivar_categoria(IN p_id CHAR(36))
BEGIN
  UPDATE categorias SET activo = 0, fecha_actualizacion = NOW() WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_categoria$$
CREATE PROCEDURE sp_eliminar_categoria(IN p_id CHAR(36))
BEGIN
  DELETE FROM categorias WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_resena$$
CREATE PROCEDURE sp_eliminar_resena(IN p_id_producto CHAR(36), IN p_id_usuario CHAR(36))
BEGIN
  DECLARE v_existe INT;
  DECLARE v_promedio DECIMAL(3,2);

  SELECT COUNT(id) INTO v_existe FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

  IF v_existe > 0 THEN
    DELETE FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

    SELECT ROUND(AVG(calificacion), 2) INTO v_promedio FROM resenas_productos WHERE id_producto = p_id_producto;
    UPDATE productos SET calificaciones = COALESCE(v_promedio, 0) WHERE id = p_id_producto;
  END IF;

  SELECT v_existe AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_subcategoria$$
CREATE PROCEDURE sp_eliminar_subcategoria(IN p_id CHAR(36))
BEGIN
  DELETE FROM subcategorias WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_variante$$

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

DROP PROCEDURE IF EXISTS sp_guardar_variantes$$

CREATE PROCEDURE sp_guardar_variantes(
  IN p_id_producto CHAR(36),
  IN p_variantes JSON
)
BEGIN
  IF JSON_LENGTH(p_variantes) IS NULL OR JSON_LENGTH(p_variantes) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTES_VACIAS';
  END IF;

  INSERT INTO variantes_producto
    (id, id_producto, talla, color, color_hex, sku, stock, activo)
  SELECT
    UUID(), p_id_producto, j.talla, j.color,
    NULLIF(j.color_hex, ''), NULLIF(j.sku, ''),
    GREATEST(COALESCE(j.stock, 0), 0), 1
  FROM JSON_TABLE(p_variantes, '$[*]' COLUMNS (
    talla     VARCHAR(20) PATH '$.talla',
    color     VARCHAR(40) PATH '$.color',
    color_hex VARCHAR(7)  PATH '$.color_hex',
    sku       VARCHAR(60) PATH '$.sku',
    stock     INT         PATH '$.stock'
  )) j
  WHERE j.talla IS NOT NULL AND j.color IS NOT NULL
  ON DUPLICATE KEY UPDATE
    stock               = VALUES(stock),
    color_hex           = VALUES(color_hex),
    sku                 = VALUES(sku),
    activo              = 1,
    fecha_actualizacion = NOW();

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = p_id_producto;

  SELECT id, talla, color, color_hex, sku, stock, activo
  FROM variantes_producto
  WHERE id_producto = p_id_producto
  ORDER BY color ASC, FIELD(talla, 'XS','S','M','L','XL','XXL'), talla ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_categorias$$
CREATE PROCEDURE sp_listar_categorias(IN p_solo_activas INT)
BEGIN
  IF p_solo_activas = 1 THEN
    SELECT c.* FROM categorias c WHERE c.activo = 1 ORDER BY c.nombre ASC;
  ELSE
    SELECT c.* FROM categorias c ORDER BY c.nombre ASC;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_listar_subcategorias$$
CREATE PROCEDURE sp_listar_subcategorias(IN p_categoria_id CHAR(36), IN p_solo_activas INT)
BEGIN
  SELECT s.*, c.nombre AS categoria_padre_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE (p_categoria_id IS NULL OR s.id_categoria = p_categoria_id)
    AND (p_solo_activas = 0 OR (s.activo = 1 AND c.activo = 1))
  ORDER BY c.nombre ASC, s.nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_variantes$$

CREATE PROCEDURE sp_listar_variantes(
  IN p_id_producto CHAR(36),
  IN p_solo_disponibles INT
)
BEGIN
  SELECT id, id_producto, talla, color, color_hex, sku, stock, activo
  FROM variantes_producto
  WHERE id_producto = p_id_producto
    AND (p_solo_disponibles = 0 OR activo = 1)
  ORDER BY color ASC, FIELD(talla, 'XS','S','M','L','XL','XXL'), talla ASC;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_producto_eliminado$$
CREATE PROCEDURE sp_marcar_producto_eliminado(IN p_id CHAR(36))
BEGIN
  UPDATE productos SET estado = 'eliminado', fecha_eliminacion = NOW() WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_categoria_o_subcategoria$$
CREATE PROCEDURE sp_obtener_categoria_o_subcategoria(IN p_criterio VARCHAR(255))
BEGIN
  SELECT id, id_categoria AS id_categoria_padre, 'subcategoria' AS tipo
  FROM subcategorias
  WHERE (nombre = p_criterio OR id = p_criterio) AND activo = 1
  LIMIT 1;

  SELECT id, NULL AS id_categoria_padre, 'categoria' AS tipo
  FROM categorias
  WHERE (nombre = p_criterio OR id = p_criterio) AND activo = 1
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_categoria_por_id$$
CREATE PROCEDURE sp_obtener_categoria_por_id(IN p_id CHAR(36))
BEGIN
  SELECT * FROM categorias WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_detalle_producto$$
CREATE PROCEDURE sp_obtener_detalle_producto(IN p_id CHAR(36))
BEGIN
  SELECT
      p.id, p.nombre, p.descripcion, p.precio,
      p.precio_oferta, p.oferta_inicio, p.oferta_fin,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta,
      COALESCE(s.nombre, c.nombre) AS categoria,
      s.nombre AS subcategoria, c.nombre AS categoria_padre,
      p.calificaciones, p.imagenes, p.stock, p.estado, p.fecha_creacion, p.creado_por,
      COUNT(DISTINCT r.id) AS review_count,
      ROUND(AVG(r.calificacion), 2) AS promedio_calificacion,
      u.nombre AS vendedor_nombre, u.email AS vendedor_email
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  LEFT JOIN usuarios u ON p.creado_por = u.id
  WHERE p.id = p_id AND p.estado = 'activo'
  GROUP BY p.id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_nuevos_productos$$
CREATE PROCEDURE sp_obtener_nuevos_productos()
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.fecha_creacion >= NOW() - INTERVAL 30 DAY AND p.estado = 'activo'
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC
  LIMIT 8;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_producto_por_id$$
CREATE PROCEDURE sp_obtener_producto_por_id(IN p_id CHAR(36))
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_resenas_producto$$
CREATE PROCEDURE sp_obtener_resenas_producto(IN p_id CHAR(36))
BEGIN
  SELECT r.id, r.id_usuario, r.calificacion, r.comentario, r.fecha_creacion, u.nombre AS usuario_nombre, u.imagen AS usuario_imagen
  FROM resenas_productos r
  LEFT JOIN usuarios u ON r.id_usuario = u.id
  WHERE r.id_producto = p_id
  ORDER BY r.fecha_creacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_subcategoria_por_id$$
CREATE PROCEDURE sp_obtener_subcategoria_por_id(IN p_id CHAR(36))
BEGIN
  SELECT * FROM subcategorias WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_top_calificados$$
CREATE PROCEDURE sp_obtener_top_calificados()
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.calificaciones >= 4.5 AND p.estado = 'activo'
  GROUP BY p.id
  ORDER BY p.calificaciones DESC, p.fecha_creacion DESC
  LIMIT 8;
END$$

DROP PROCEDURE IF EXISTS sp_publicar_resena$$
CREATE PROCEDURE sp_publicar_resena(
  IN p_id_resena CHAR(36),
  IN p_id_producto CHAR(36),
  IN p_id_usuario CHAR(36),
  IN p_calificacion INT,
  IN p_comentario TEXT
)
BEGIN
  DECLARE v_existe INT;
  DECLARE v_promedio DECIMAL(3,2);

  SELECT COUNT(id) INTO v_existe FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

  IF v_existe > 0 THEN
    UPDATE resenas_productos SET calificacion = p_calificacion, comentario = p_comentario WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;
  ELSE
    INSERT INTO resenas_productos (id, id_producto, id_usuario, calificacion, comentario) VALUES (p_id_resena, p_id_producto, p_id_usuario, p_calificacion, p_comentario);
  END IF;

  SELECT ROUND(AVG(calificacion), 2) INTO v_promedio FROM resenas_productos WHERE id_producto = p_id_producto;
  UPDATE productos SET calificaciones = COALESCE(v_promedio, 0) WHERE id = p_id_producto;

  SELECT * FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_resolver_categoria$$
CREATE PROCEDURE sp_resolver_categoria(IN p_valor VARCHAR(255))
BEGIN
  SELECT id FROM categorias WHERE (nombre = p_valor OR id = p_valor) AND activo = 1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_resolver_subcategoria$$
CREATE PROCEDURE sp_resolver_subcategoria(IN p_valor VARCHAR(255))
BEGIN
  SELECT id, id_categoria FROM subcategorias WHERE (nombre = p_valor OR id = p_valor) AND activo = 1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_categoria_duplicada$$
CREATE PROCEDURE sp_verificar_categoria_duplicada(IN p_nombre VARCHAR(100), IN p_slug VARCHAR(120), IN p_id CHAR(36))
BEGIN
  IF p_id IS NULL THEN
    SELECT id FROM categorias WHERE (nombre = p_nombre OR slug = p_slug) LIMIT 1;
  ELSE
    SELECT id FROM categorias WHERE (nombre = p_nombre OR slug = p_slug) AND id <> p_id LIMIT 1;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_compra_producto$$
CREATE PROCEDURE sp_verificar_compra_producto(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  SELECT dp.id_producto
  FROM detalles_pedido dp
  JOIN pedidos p ON p.id = dp.id_pedido
  WHERE p.id_comprador = p_id_usuario
  AND dp.id_producto = p_id_producto
  AND p.fecha_pagado IS NOT NULL
  AND p.estado_pedido <> 'Cancelado'
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_cuadre_stock$$

CREATE PROCEDURE sp_verificar_cuadre_stock()
BEGIN
  SELECT
    p.id,
    p.nombre,
    p.stock                          AS total_guardado,
    COALESCE(SUM(v.stock), 0)        AS suma_variantes,
    p.stock - COALESCE(SUM(v.stock), 0) AS diferencia
  FROM productos p
  LEFT JOIN variantes_producto v
    ON v.id_producto = p.id AND v.activo = 1
  WHERE p.estado = 'activo'
  GROUP BY p.id, p.nombre, p.stock
  HAVING p.stock <> COALESCE(SUM(v.stock), 0);
END$$

DROP PROCEDURE IF EXISTS sp_verificar_pedidos_producto$$
CREATE PROCEDURE sp_verificar_pedidos_producto(IN p_id CHAR(36))
BEGIN
  SELECT 1 AS tiene_pedidos FROM detalles_pedido WHERE id_producto = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_subcategoria_duplicada$$
CREATE PROCEDURE sp_verificar_subcategoria_duplicada(IN p_nombre VARCHAR(100), IN p_slug VARCHAR(120), IN p_id CHAR(36))
BEGIN
  IF p_id IS NULL THEN
    SELECT id FROM subcategorias WHERE (nombre = p_nombre OR slug = p_slug) LIMIT 1;
  ELSE
    SELECT id FROM subcategorias WHERE (nombre = p_nombre OR slug = p_slug) AND id <> p_id LIMIT 1;
  END IF;
END$$

DELIMITER ;
