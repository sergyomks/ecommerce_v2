import connection from '../database/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, resolve);
  });
}

async function limpiarDatos() {
  try {
    console.log('\n🗑️  Script de Limpieza de Datos de Prueba\n');
    console.log('Este script eliminará TODOS los datos excepto:');
    console.log('  ✓ Usuario administrador');
    console.log('  ✓ Estructura de la base de datos');
    console.log('  ✓ Procedimientos almacenados');
    console.log('  ✓ Ubigeo del Perú\n');

    const [admins] = await connection.query(
      'SELECT id, email, nombre, rol FROM usuarios WHERE rol = ?',
      ['administrador']
    );

    if (admins.length === 0) {
      console.log('❌ No se encontró ningún usuario administrador.');
      console.log('   Crea uno primero con: npm run crear-admin');
      process.exit(1);
    }

    console.log('Administradores encontrados:');
    admins.forEach((admin, idx) => {
      console.log(`  ${idx + 1}. ${admin.email} (${admin.nombre})`);
    });

    const emailAdmin = await pregunta(
      '\n📧 Ingresa el EMAIL del admin que quieres MANTENER: '
    );

    const adminExiste = admins.find(a => a.email === emailAdmin.trim());
    if (!adminExiste) {
      console.log('❌ El email ingresado no corresponde a ningún administrador.');
      process.exit(1);
    }

    console.log(`\n✓ Se mantendrá: ${adminExiste.email} (${adminExiste.nombre})`);

    const confirmacion = await pregunta(
      '\n⚠️  ¿ESTÁS SEGURO? Esta acción NO se puede deshacer. (escribe "SI" para continuar): '
    );

    if (confirmacion.trim().toUpperCase() !== 'SI') {
      console.log('❌ Operación cancelada.');
      process.exit(0);
    }

    console.log('\n🔄 Iniciando limpieza...\n');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const [countAntes] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS usuarios,
        (SELECT COUNT(*) FROM productos) AS productos,
        (SELECT COUNT(*) FROM pedidos) AS pedidos,
        (SELECT COUNT(*) FROM carrito) AS carrito,
        (SELECT COUNT(*) FROM wishlist) AS wishlist
    `);

    console.log('📊 Registros antes de la limpieza:');
    console.log(`   Usuarios: ${countAntes[0].usuarios}`);
    console.log(`   Productos: ${countAntes[0].productos}`);
    console.log(`   Pedidos: ${countAntes[0].pedidos}`);
    console.log(`   Carritos: ${countAntes[0].carrito}`);
    console.log(`   Wishlists: ${countAntes[0].wishlist}\n`);

    console.log('🗑️  Eliminando datos transaccionales...');

    await connection.query('DELETE FROM detalles_pedido');
    console.log('   ✓ Detalles de pedido');

    await connection.query('DELETE FROM informacion_envio');
    console.log('   ✓ Información de envío');

    await connection.query('DELETE FROM pagos');
    console.log('   ✓ Pagos');

    await connection.query('DELETE FROM webhooks_procesados');
    console.log('   ✓ Webhooks procesados');

    await connection.query('DELETE FROM pedidos');
    console.log('   ✓ Pedidos');

    console.log('\n🗑️  Eliminando carritos y listas de deseos...');
    await connection.query('DELETE FROM carrito');
    console.log('   ✓ Carritos');

    await connection.query('DELETE FROM wishlist');
    console.log('   ✓ Listas de deseos');

    console.log('\n🗑️  Eliminando productos...');
    await connection.query('DELETE FROM resenas_producto');
    console.log('   ✓ Reseñas de productos');

    await connection.query('DELETE FROM variantes_producto');
    console.log('   ✓ Variantes de productos');

    await connection.query('DELETE FROM productos');
    console.log('   ✓ Productos');

    console.log('\n🗑️  Eliminando usuarios no-admin...');
    const [resultUsuarios] = await connection.query(
      'DELETE FROM usuarios WHERE email != ?',
      [emailAdmin.trim()]
    );
    console.log(`   ✓ ${resultUsuarios.affectedRows} usuarios eliminados`);

    console.log('\n🗑️  Limpiando otros datos...');
    await connection.query('DELETE FROM cupones');
    console.log('   ✓ Cupones');

    await connection.query('DELETE FROM mensajes_contacto');
    console.log('   ✓ Mensajes de contacto');

    await connection.query('DELETE FROM newsletter');
    console.log('   ✓ Newsletter');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    const [countDespues] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS usuarios,
        (SELECT COUNT(*) FROM productos) AS productos,
        (SELECT COUNT(*) FROM pedidos) AS pedidos,
        (SELECT COUNT(*) FROM carrito) AS carrito,
        (SELECT COUNT(*) FROM wishlist) AS wishlist
    `);

    console.log('\n✅ Limpieza completada!\n');
    console.log('📊 Registros después de la limpieza:');
    console.log(`   Usuarios: ${countDespues[0].usuarios} (solo admin)`);
    console.log(`   Productos: ${countDespues[0].productos}`);
    console.log(`   Pedidos: ${countDespues[0].pedidos}`);
    console.log(`   Carritos: ${countDespues[0].carrito}`);
    console.log(`   Wishlists: ${countDespues[0].wishlist}\n`);

    const [adminFinal] = await connection.query(
      'SELECT email, nombre, rol FROM usuarios WHERE rol = ?',
      ['administrador']
    );

    console.log('👤 Usuario administrador restante:');
    console.log(`   Email: ${adminFinal[0].email}`);
    console.log(`   Nombre: ${adminFinal[0].nombre}`);
    console.log(`   Rol: ${adminFinal[0].rol}\n`);

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await connection.end();
  }
}

limpiarDatos();
