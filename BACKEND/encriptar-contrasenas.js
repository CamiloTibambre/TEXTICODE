// encriptar-contrasenas.js
// Encripta con bcrypt las contraseñas que sigan en texto plano.
// El login ya NO acepta contraseñas sin hash: ejecútalo en cada base (local, staging, Supabase).
// Es idempotente: las que ya tienen hash se omiten.
// Comando: node encriptar-contrasenas.js

import pool from './db.js'
import bcrypt from 'bcryptjs'

async function encriptarTodas() {
  try {
    console.log('🔐 Iniciando encriptación de contraseñas...\n')

    const { rows: usuarios } = await pool.query(
      `SELECT "Id_Usuario", "Nombre_Usuario", "Contrasena" FROM usuario`
    )

    let encriptados = 0
    let omitidos    = 0

    for (const u of usuarios) {
      if (!u.Contrasena || u.Contrasena.startsWith('$2')) {
        omitidos++
        continue
      }

      const hash = await bcrypt.hash(u.Contrasena, 10)
      // La condición evita pisar una contraseña que alguien cambió mientras corría el script.
      await pool.query(
        `UPDATE usuario SET "Contrasena" = $1 WHERE "Id_Usuario" = $2 AND "Contrasena" = $3`,
        [hash, u.Id_Usuario, u.Contrasena]
      )
      console.log(`✅ ${u.Nombre_Usuario} — encriptada correctamente`)
      encriptados++
    }

    console.log(`\n✔️  Listo: ${encriptados} encriptadas, ${omitidos} omitidas`)
    await pool.end()
    process.exit(0)

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

encriptarTodas()
