import ExcelJS from "exceljs";

const AZUL = "FF1D4E89";
const AZUL_SUAVE = "FFE7EEF8";
const GRIS_BANDA = "FFF5F7FA";
const BORDE = "FFDCE2EB";
const TINTA = "FF121722";
const APAGADO = "FF5A6478";

const MONEDA = '"S/" #,##0.00';
const FECHA = "dd/mm/yyyy";
const FECHA_HORA = "dd/mm/yyyy hh:mm";

const COLUMNAS = [
  { header: "Fecha de pago", key: "fecha_pagado", width: 18, tipo: "fechaHora" },
  { header: "Pedido", key: "pedido", width: 12 },
  { header: "Cliente", key: "cliente", width: 26 },
  { header: "Correo", key: "correo", width: 30 },
  { header: "Departamento", key: "departamento", width: 16 },
  { header: "Provincia", key: "provincia", width: 16 },
  { header: "Distrito", key: "distrito", width: 20 },
  { header: "Estado", key: "estado_pedido", width: 13 },
  { header: "Unid.", key: "unidades", width: 8, tipo: "entero" },
  { header: "Subtotal", key: "subtotal", width: 13, tipo: "moneda" },
  { header: "Descuento", key: "descuento", width: 13, tipo: "moneda" },
  { header: "Cupón", key: "codigo_cupon", width: 14 },
  { header: "Envío", key: "precio_envio", width: 12, tipo: "moneda" },
  { header: "Total", key: "precio_total", width: 14, tipo: "moneda" },
  { header: "IGV incluido", key: "igv_incluido", width: 14, tipo: "moneda" },
];

const COL_TOTALES = ["unidades", "subtotal", "descuento", "precio_envio", "precio_total", "igv_incluido"];

const comoFechaLocal = (d) => {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(`${d}T00:00:00`);
  }
  return new Date(d);
};

const formatearFecha = (d) => {
  const fecha = comoFechaLocal(d);
  return fecha
    ? fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";
};

export async function construirReporteVentas({ filas, desde, hasta, nombreTienda }) {
  const libro = new ExcelJS.Workbook();
  libro.creator = nombreTienda || "Tienda";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Ventas", {
    views: [{ state: "frozen", ySplit: 5 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  hoja.columns = COLUMNAS.map(({ header, key, width }) => ({ header, key, width }));

  const ultimaCol = COLUMNAS.length;
  const letraFinal = hoja.getColumn(ultimaCol).letter;

  hoja.mergeCells(`A1:${letraFinal}1`);
  const titulo = hoja.getCell("A1");
  titulo.value = `${nombreTienda || "Tienda"} · Reporte de ventas`;
  titulo.font = { name: "Calibri", size: 16, bold: true, color: { argb: TINTA } };
  titulo.alignment = { vertical: "middle" };
  hoja.getRow(1).height = 26;

  hoja.mergeCells(`A2:${letraFinal}2`);
  const periodo = hoja.getCell("A2");
  periodo.value =
    desde || hasta
      ? `Pedidos pagados del ${formatearFecha(desde)} al ${formatearFecha(hasta)}`
      : "Todos los pedidos pagados";
  periodo.font = { name: "Calibri", size: 11, color: { argb: APAGADO } };

  hoja.mergeCells(`A3:${letraFinal}3`);
  const generado = hoja.getCell("A3");
  generado.value = `Generado el ${new Date().toLocaleString("es-PE")} · ${filas.length} pedido(s)`;
  generado.font = { name: "Calibri", size: 10, italic: true, color: { argb: APAGADO } };

  hoja.getRow(4).height = 6;

  const cabecera = hoja.getRow(5);
  COLUMNAS.forEach((col, i) => {
    const celda = cabecera.getCell(i + 1);
    celda.value = col.header;
    celda.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    celda.alignment = { vertical: "middle", horizontal: col.tipo ? "right" : "left", wrapText: true };
    celda.border = { bottom: { style: "thin", color: { argb: AZUL } } };
  });
  cabecera.height = 22;

  let fila = 6;
  for (const [indice, f] of filas.entries()) {
    const r = hoja.getRow(fila);

    COLUMNAS.forEach((col, i) => {
      const celda = r.getCell(i + 1);
      let valor;

      switch (col.key) {
        case "pedido":
          valor = `#${String(f.id || "").slice(0, 8)}`;
          break;
        case "fecha_pagado":
          valor = f.fecha_pagado ? new Date(f.fecha_pagado) : null;
          break;
        case "codigo_cupon":
          valor = f.codigo_cupon || "—";
          break;
        default:
          valor = f[col.key];
      }

      if (col.tipo === "moneda") {
        celda.value = Number(valor ?? 0);
        celda.numFmt = MONEDA;
        celda.alignment = { horizontal: "right" };
      } else if (col.tipo === "entero") {
        celda.value = Number(valor ?? 0);
        celda.numFmt = "#,##0";
        celda.alignment = { horizontal: "right" };
      } else if (col.tipo === "fechaHora") {
        celda.value = valor;
        celda.numFmt = FECHA_HORA;
        celda.alignment = { horizontal: "left" };
      } else {
        celda.value = valor ?? "—";
      }

      celda.font = { name: "Calibri", size: 10, color: { argb: TINTA } };
      celda.border = { bottom: { style: "hair", color: { argb: BORDE } } };

      if (indice % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_BANDA } };
      }
    });

    if (f.estado_pedido === "Cancelado") {
      const celdaEstado = r.getCell(COLUMNAS.findIndex((c) => c.key === "estado_pedido") + 1);
      celdaEstado.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFA82016" } };
      celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBEBE9" } };
    }

    fila += 1;
  }

  const filaTotales = hoja.getRow(fila);
  filaTotales.getCell(1).value = "TOTALES";
  filaTotales.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: TINTA } };

  COLUMNAS.forEach((col, i) => {
    const celda = filaTotales.getCell(i + 1);
    celda.border = { top: { style: "medium", color: { argb: AZUL } } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_SUAVE } };

    if (COL_TOTALES.includes(col.key) && filas.length > 0) {
      const letra = hoja.getColumn(i + 1).letter;

      celda.value = { formula: `SUM(${letra}6:${letra}${fila - 1})` };
      celda.numFmt = col.tipo === "entero" ? "#,##0" : MONEDA;
      celda.alignment = { horizontal: "right" };
      celda.font = { name: "Calibri", size: 11, bold: true, color: { argb: TINTA } };
    }
  });
  filaTotales.height = 20;

  hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(fila - 1, 6), column: ultimaCol } };

  if (filas.length === 0) {
    hoja.mergeCells(`A6:${letraFinal}6`);
    const vacio = hoja.getCell("A6");
    vacio.value = "No hay pedidos pagados en este periodo.";
    vacio.font = { name: "Calibri", size: 11, italic: true, color: { argb: APAGADO } };
    vacio.alignment = { horizontal: "center" };
  }

  return libro.xlsx.writeBuffer();
}

export const nombreArchivoVentas = (desde, hasta) => {

  const parte = (d, respaldo) =>
    typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : respaldo;
  return `ventas_${parte(desde, "inicio")}_a_${parte(hasta, "hoy")}.xlsx`;
};
