import crypto from "crypto";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import pool from "../database/db.js";
import { crearUsuarioTabla } from "../models/tablaUsuario.js";
import { crearRolTabla } from "../models/tablaRol.js";
import { esEmail } from "../utils/validaciones.js";

const preguntar = async (rl, etiqueta, valorPorDefecto) => {
  if (valorPorDefecto) return valorPorDefecto;
  const respuesta = await rl.question(etiqueta);
  return respuesta.trim();
};

const validar = ({ nombre, email, contrasena }) => {
  if (nombre.length < 3 || nombre.length > 100) {
    return "El nombre debe tener entre 3 y 100 caracteres.";
  }
  if (!esEmail(email)) {
    return "El correo electrónico no es válido.";
  }
  if (contrasena.length < 8 || contrasena.length > 16) {
    return "La contraseña debe tener entre 8 y 16 caracteres.";
  }
  return null;
};

const promoverExistente = async (usuario, idRolAdmin) => {
  if (usuario.id_rol === idRolAdmin) {
    console.log(`El usuario ${usuario.email} ya es administrador.`);
    return;
  }
  await pool.query(`UPDATE usuarios SET id_rol = ? WHERE id = ?`, [idRolAdmin, usuario.id]);
  console.log(`Usuario ${usuario.email} promovido a administrador.`);
};

const crearNuevo = async ({ nombre, email, contrasena }, idRolAdmin) => {
  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(contrasena, 10);

  await pool.query(
    `INSERT INTO usuarios (id, nombre, email, contraseña, id_rol)
     VALUES (?, ?, ?, ?, ?)`,
    [id, nombre, email, hash, idRolAdmin]
  );

  console.log(`Administrador creado: ${email}`);
};

const main = async () => {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    await crearRolTabla();
    await crearUsuarioTabla();

    const [roles] = await pool.query(`SELECT id FROM roles WHERE nombre = 'Admin' LIMIT 1`);
    if (roles.length === 0) {
      console.error("El rol Admin no existe en la base de datos.");
      process.exitCode = 1;
      return;
    }
    const idRolAdmin = roles[0].id;

    const datos = {
      nombre: await preguntar(rl, "Nombre: ", process.env.ADMIN_NOMBRE),
      email: (
        await preguntar(rl, "Email: ", process.env.ADMIN_EMAIL)
      ).toLowerCase(),
      contrasena: await preguntar(rl, "Contraseña: ", process.env.ADMIN_PASSWORD),
    };

    const error = validar(datos);
    if (error) {
      console.error(error);
      process.exitCode = 1;
      return;
    }

    const [existentes] = await pool.query(
      `SELECT id, email, id_rol FROM usuarios WHERE email = ? LIMIT 1`,
      [datos.email]
    );

    if (existentes.length > 0) {
      await promoverExistente(existentes[0], idRolAdmin);
    } else {
      await crearNuevo(datos, idRolAdmin);
    }
  } catch (error) {
    console.error("No se pudo crear el administrador:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await pool.end();
  }
};

main();
