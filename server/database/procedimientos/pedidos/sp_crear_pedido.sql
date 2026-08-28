

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_pedido;

DELIMITER $$

CREATE PROCEDURE sp_crear_pedido(
  IN p_id CHAR(36), IN p_id_comprador CHAR(36), IN p_precio_total DECIMAL(10,2),
  IN p_impuesto DECIMAL(10,2), IN p_precio_envio DECIMAL(10,2),
  IN p_descuento DECIMAL(10,2), IN p_id_cupon CHAR(36), IN p_stock_reservado INT,
  IN p_estado_pedido VARCHAR(20)
)
BEGIN
  INSERT INTO pedidos (
    id, id_comprador, precio_total, impuesto, precio_envio,
    descuento, id_cupon, stock_reservado, estado_pedido
  ) VALUES (
    p_id, p_id_comprador, p_precio_total, p_impuesto, p_precio_envio,
    p_descuento, p_id_cupon, p_stock_reservado, p_estado_pedido
  );
END$$

DELIMITER ;
