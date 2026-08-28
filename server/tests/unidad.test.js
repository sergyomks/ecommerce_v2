import test from "node:test";
import assert from "node:assert/strict";

import { extraerIgv, IGV_RATE } from "../utils/igv.js";
import { escaparHtml, urlSegura } from "../utils/escaparHtml.js";
import {
  esCodigoPostal,
  esEmail,
  esEnteroNoNegativo,
  esImporte,
  esNombrePersona,
  esTelefono,
  esUuid,
  normalizarTelefono,
  primerError,
} from "../utils/validaciones.js";
import { calcularDescuentoCupon } from "../utils/descuentoCupon.js";
import { importeCoincide } from "../utils/importes.js";

test("extraerIgv separa el impuesto sin inflar el total", () => {
  const { base, impuesto, gross } = extraerIgv(118);
  assert.equal(gross, 118);
  assert.equal(impuesto, 18);
  assert.equal(base, 100);
  assert.equal(IGV_RATE, 0.18);
});

test("extraerIgv nunca devuelve negativos", () => {
  assert.equal(extraerIgv(-50).gross, 0);
  assert.equal(extraerIgv(null).impuesto, 0);
  assert.equal(extraerIgv("no es número").base, 0);
});

test("escaparHtml neutraliza las etiquetas", () => {
  assert.equal(
    escaparHtml('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
  );
  assert.equal(escaparHtml(null), "");
  assert.equal(escaparHtml("O'Brien & hijos"), "O&#39;Brien &amp; hijos");
});

test("urlSegura solo acepta http y https", () => {
  assert.equal(urlSegura("https://tracking.test/x"), "https://tracking.test/x");
  assert.equal(urlSegura("javascript:alert(1)"), null);
  assert.equal(urlSegura("data:text/html,<script>"), null);
  assert.equal(urlSegura("no es una url"), null);
  assert.equal(urlSegura(null), null);
});

test("esUuid y esEmail validan lo esperado", () => {
  assert.ok(esUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301"));
  assert.ok(!esUuid("123"));
  assert.ok(!esUuid(null));
  assert.ok(esEmail("a@b.co"));
  assert.ok(!esEmail("a@b"));
  assert.ok(!esEmail("sin arroba"));
});

test("calcularDescuentoCupon nunca supera el subtotal", () => {
  assert.equal(calcularDescuentoCupon({ tipo: "porcentaje", valor: 10 }, 200), 20);
  assert.equal(calcularDescuentoCupon({ tipo: "fijo", valor: 30 }, 200), 30);
  assert.equal(calcularDescuentoCupon({ tipo: "fijo", valor: 500 }, 200), 200);
  assert.equal(calcularDescuentoCupon({ tipo: "porcentaje", valor: 100 }, 80), 80);
});

test("importeCoincide compara céntimos con tolerancia de redondeo", () => {
  assert.ok(importeCoincide(10000, 100.0));
  assert.ok(importeCoincide(10001, 100.0));
  assert.ok(!importeCoincide(9900, 100.0));
  assert.ok(!importeCoincide(null, 100.0));
  assert.ok(!importeCoincide(10000, "abc"));
});

test("esTelefono acepta formatos peruanos reales y rechaza texto", () => {
  for (const bueno of ["987654321", "+51 987 654 321", "987-654-321", "(01) 4471234", "4471234"]) {
    assert.equal(esTelefono(bueno), true, `debería aceptar ${bueno}`);
  }
  for (const malo of ["abcdefg", "12345", "987654321012345", "98765432a", "", "  "]) {
    assert.equal(esTelefono(malo), false, `debería rechazar ${malo}`);
  }

  assert.equal(esTelefono("887654321"), false);
});

test("normalizarTelefono deja solo dígitos y quita el prefijo de país", () => {
  assert.equal(normalizarTelefono("+51 987 654 321"), "987654321");
  assert.equal(normalizarTelefono("987-654-321"), "987654321");
  assert.equal(normalizarTelefono("(01) 4471234"), "14471234");
});

test("esCodigoPostal exige cinco dígitos", () => {
  assert.equal(esCodigoPostal("15074"), true);
  assert.equal(esCodigoPostal("1507"), false);
  assert.equal(esCodigoPostal("abcde"), false);
});

test("esNombrePersona acepta acentos y rechaza dígitos", () => {
  assert.equal(esNombrePersona("José García-López"), true);
  assert.equal(esNombrePersona("O'Brien"), true);
  assert.equal(esNombrePersona("Ana"), true);
  assert.equal(esNombrePersona("Usuario123"), false);
  assert.equal(esNombrePersona("Al"), false);
  assert.equal(esNombrePersona("<script>"), false);
});

test("esImporte y esEnteroNoNegativo no se dejan engañar por parseFloat", () => {

  assert.equal(esImporte("12abc"), false);
  assert.equal(esEnteroNoNegativo("5xyz"), false);
  assert.equal(esImporte("12.50"), true);
  assert.equal(esImporte("12,50"), true);
  assert.equal(esImporte("12.505"), false);
  assert.equal(esImporte("-1"), false);
  assert.equal(esEnteroNoNegativo("0"), true);
  assert.equal(esEnteroNoNegativo("3.5"), false);
  assert.equal(esEnteroNoNegativo(""), false);
});

test("primerError devuelve el primer mensaje que falla, o null", () => {
  const reglas = [
    ["987654321", esTelefono, "teléfono malo"],
    ["xxx", esCodigoPostal, "postal malo"],
  ];
  assert.equal(primerError(reglas), "postal malo");
  assert.equal(primerError([["15074", esCodigoPostal, "postal malo"]]), null);
});
