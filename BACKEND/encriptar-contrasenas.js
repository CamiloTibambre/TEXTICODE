// encriptar-contrasenas.js
// Ejecuta este script UNA SOLA VEZ para encriptar las contraseñas existentes
// Comando: node encriptar-contrasenas.js

import pool from './db.js'
import bcrypt from 'bcryptjs'

async function encriptarTodas() {
  try {
    console.log('🔐 Iniciando encriptación de contraseñas...\n')

    // Obtener todos los usuarios con contraseñas en texto plano
    const [usuarios] = await pool.query(
      `SELECT Id_Usuario, Nombre_Usuario, Contrasena FROM usuario`
    )

    let encriptados = 0
    let omitidos    = 0

    for (const u of usuarios) {
      // Si ya está encriptada con bcrypt, omitir
      if (u.Contrasena.startsWith('$2')) {
        console.log(`⏭️  ${u.Nombre_Usuario} — ya encriptada, omitiendo`)
        omitidos++
        continue
      }

      // Encriptar y actualizar en la BD
      const hash = await bcrypt.hash(u.Contrasena, 10)
      await pool.query(
        `UPDATE usuario SET Contrasena = ? WHERE Id_Usuario = ?`,
        [hash, u.Id_Usuario]
      )
      console.log(`✅ ${u.Nombre_Usuario} — encriptada correctamente`)
      encriptados++
    }

    console.log(`\n✔️  Listo: ${encriptados} encriptadas, ${omitidos} omitidas`)
    process.exit(0)

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

encriptarTodas()
