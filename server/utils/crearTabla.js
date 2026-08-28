import { crearRolTabla } from "../models/tablaRol.js";
import {
  crearUsuarioTabla,
  migrarRolAFK,
  asegurarColumnasIntentosAcceso,
  asegurarColumnasGoogle,
} from "../models/tablaUsuario.js";
import { crearCategoriaTabla } from "../models/tablaCategoria.js";
import { crearSubcategoriaTabla, migrarSubcategorias } from "../models/tablaSubcategoria.js";
import { crearUbigeoTablas } from "../models/tablaUbigeo.js";
import { cargarUbigeo } from "../database/ubigeo/cargarUbigeo.js";
import {
  crearProductoTabla,
  migrarCategoriaAFK,
  asegurarColumnaSubcategoriaProducto,
  asegurarColumnasOferta,
} from "../models/tablaProducto.js";
import { crearResenaProductoTabla } from "../models/tablaResenaProducto.js";
import {
  crearPedidoDetalleTabla,
  asegurarColumnasVarianteDetalle,
} from "../models/tablaPedidoDetalle.js";
import {
  crearPedidoTabla,
  asegurarColumnaStockReservado,
  asegurarColumnaPagoIniciado,
} from "../models/tablaPedido.js";
import {
  crearPagoTabla,
  asegurarPagosMultiplesIntentos,
} from "../models/tablaPago.js";
import { crearInformacionEnvioTabla, migrarInformacionEnvioAFK } from "../models/tablaInformacionEnvio.js";
import { crearWebhookProcesadoTabla } from "../models/tablaWebhookProcesado.js";
import { crearContactoTabla } from "../models/tablaContacto.js";
import { quitarTablaSuscriptoresNewsletter } from "../models/tablaNewsletter.js";
import { crearWishlistTabla } from "../models/tablaWishlist.js";
import {
  crearCuponTabla,
  asegurarColumnasPedidoCupon,
  migrarCodigoCuponAFK,
} from "../models/tablaCupon.js";
import {
  crearTarifaEnvioTabla,
  migrarTarifasEnvioAFK,
  quitarColumnasTrackingEnvio,
} from "../models/tablaTarifaEnvio.js";
import {
  crearVarianteTabla,
  migrarProductosAVariantes,
  recalcularStockTotal,
  migrarDetallesAVariantes,
} from "../models/tablaVariante.js";
import { asegurarIndices } from "../models/indices.js";
import { verificarProcedimientos } from "../database/procedimientos/aplicar.js";

export const crearTablas = async () => {
  await crearRolTabla();
  await crearUsuarioTabla();
  await migrarRolAFK();
  await asegurarColumnasIntentosAcceso();
  await asegurarColumnasGoogle();

  await crearUbigeoTablas();

  await cargarUbigeo({ silencioso: true });

  await crearCategoriaTabla();
  await crearSubcategoriaTabla();

  await crearProductoTabla();
  await migrarCategoriaAFK();
  await asegurarColumnaSubcategoriaProducto();
  await asegurarColumnasOferta();

  await migrarSubcategorias();

  await crearVarianteTabla();

  await crearResenaProductoTabla();
  await crearCuponTabla();
  await crearPedidoTabla();
  await crearPedidoDetalleTabla();
  await asegurarColumnasVarianteDetalle();
  await crearPagoTabla();
  await asegurarPagosMultiplesIntentos();

  await crearInformacionEnvioTabla();
  await migrarInformacionEnvioAFK();

  await crearWebhookProcesadoTabla();
  await crearContactoTabla();
  await quitarTablaSuscriptoresNewsletter();
  await crearWishlistTabla();

  await asegurarColumnasPedidoCupon();
  await migrarCodigoCuponAFK();
  await asegurarColumnaStockReservado();
  await asegurarColumnaPagoIniciado();

  await crearTarifaEnvioTabla();
  await migrarTarifasEnvioAFK();
  await quitarColumnasTrackingEnvio();

  await migrarProductosAVariantes();
  await migrarDetallesAVariantes();
  await recalcularStockTotal();

  await asegurarIndices();
  console.log("Tablas creadas y migradas exitosamente.");

  await comprobarProcedimientos();
};

const comprobarProcedimientos = async () => {
  const { total, faltantes } = await verificarProcedimientos();

  if (faltantes.length === 0) {
    console.log(`Procedimientos almacenados: ${total} verificados.`);
    return;
  }

  const listado = faltantes
    .map((p) => `  - ${p.dominio}/${p.nombre}`)
    .join("\n");

  throw new Error(
    `Faltan ${faltantes.length} de ${total} procedimientos almacenados en la ` +
      `base de datos:\n${listado}\n\n` +
      `Instálalos con:\n` +
      `  mysql -u <usuario> -p <base> < database/procedimientos/instalar.sql\n` +
      `o desde Node con:\n` +
      `  npm run db:sp`
  );
};