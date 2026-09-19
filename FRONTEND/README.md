# 🧵 Texticode — Sistema de Inventario en Vue.js

## ✅ Estructura del proyecto
```
texticode-vue/
├── certs/                              ← Certificados HTTPS locales (NO se suben al repo)
│   ├── localhost.key                   ← Clave privada (generada localmente)
│   └── localhost.crt                   ← Certificado autofirmado (generado localmente)
├── src/
│   ├── views/
│   │   ├── LoginView.vue               ← Login con 3 roles
│   │   ├── admin/
│   │   │   ├── GestionUsuarios.vue     ← CRUD usuarios
│   │   │   ├── GestionClientes.vue     ← Clientes + comprobantes
│   │   │   ├── GestionInventario.vue   ← CRUD inventario
│   │   │   ├── Reportes.vue            ← Gráficos + reportes
│   │   │   └── GestionProduccion.vue   ← Órdenes de producción
│   │   ├── operario/
│   │   │   ├── CuentaPersonal.vue
│   │   │   ├── TareasAsignadas.vue
│   │   │   └── ReportarAvances.vue
│   │   └── cliente/
│   │       ├── CuentaPersonal.vue
│   │       ├── PedidosEntregas.vue
│   │       └── CentroSoporte.vue
│   ├── components/
│   │   └── AppSidebar.vue              ← Sidebar compartido (3 paneles)
│   ├── router/
│   │   └── index.js                    ← Rutas protegidas por rol
│   ├── stores/
│   │   └── auth.js                     ← Estado del usuario (Pinia)
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
└── package.json
```

## 🚀 Cómo correr el proyecto

### 1. Generar los certificados HTTPS locales

> ⚠️ Los certificados **no se incluyen en el repositorio**. Cada desarrollador debe generarlos en su máquina.
> En Windows se recomienda usar **Git Bash** para estos comandos.

```bash
# Crear la carpeta de certificados
mkdir certs

# Generar el certificado autofirmado (válido por 365 días)
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/localhost.key \
  -out certs/localhost.crt \
  -days 365 \
  -subj "/C=CO/ST=Bogota/L=Bogota/O=SENA/OU=Texticode/CN=localhost"
```

Para verificar que el certificado se generó correctamente:

```bash
openssl x509 -in certs/localhost.crt -text -noout | grep -E "Subject:|Not After"
```

### 2. Instalar dependencias y correr el proyecto

```bash
# Instalar dependencias
npm install

# Correr en desarrollo (HTTPS)
npm run dev
```

Luego abre **https://localhost:5173** en tu navegador.

> El navegador mostrará una advertencia de seguridad ("Tu conexión no es privada") — esto es normal
> para certificados autofirmados en desarrollo. Haz clic en **Avanzado → Continuar a localhost**.

---

## ⚠️ Riesgos del certificado autofirmado

| Riesgo | Descripción |
|--------|-------------|
| **No es de confianza pública** | No está firmado por una Autoridad Certificadora (CA) reconocida, por lo que los navegadores lo marcan como "no seguro". |
| **Vulnerable a ataques MITM** | Sin una CA que lo valide, un atacante podría suplantar el servidor sin que el cliente lo detecte. |
| **Solo para desarrollo local** | Nunca debe usarse en producción. En producción se deben usar certificados emitidos por CAs reconocidas (Let's Encrypt, DigiCert, etc.). |
| **Expira** | El certificado tiene fecha de vencimiento. Al expirar, el navegador bloqueará la conexión hasta que se regenere. |
| **No cubre subdominios** | El CN=localhost solo es válido para `localhost`, no para otros dominios o subdominios. |

---

## 🔐 Acceso de prueba (botones demo en el login)

| Rol      | Panel que ve                                         |
|----------|------------------------------------------------------|
| Admin    | Usuarios, Clientes, Inventario, Reportes, Producción |
| Operario | Cuenta Personal, Tareas Asignadas, Reportar Avances  |
| Cliente  | Cuenta Personal, Pedidos y Entregas, Centro Soporte  |

---

## 🗃️ Agregar imágenes del logo

Crea una carpeta `public/img/` y coloca:
- `LogoTexticode.png` — logo principal
- `LogoTexticodeMini.png` — favicon

---

## 🔌 Conectar con Supabase (próximo paso)

```bash
npm install @supabase/supabase-js
```

Crea `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  'TU_SUPABASE_URL',
  'TU_SUPABASE_ANON_KEY'
)
```

Luego en `src/stores/auth.js` reemplaza la función `login()` con:

```javascript
import { supabase } from '../lib/supabase'
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  usuario.value = data.user
}
```