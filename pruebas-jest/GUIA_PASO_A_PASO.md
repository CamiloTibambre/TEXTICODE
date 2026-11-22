# Pruebas Jest de Texticode

Esta guía corresponde a autenticación (RF-001 a RF-007), Google Calendar para administrador, operario y cliente (RF-044 a RF-047), Mis tareas (RF-055 a RF-061) e Historial (RF-062). Son 19 requisitos. Todos los casos locales usan datos ficticios. Solo se ejecutará un caso real dentro de AWS.

## 1 Verificar el entorno

Abre la terminal de VS Code en la carpeta del proyecto y ejecuta:

```powershell
cd C:\Users\camil\Desktop\TEXTICODE
node --version
npm --version
git branch --show-current
```

Entorno observado al preparar las pruebas: Node v24.14.0, npm 11.9.0, rama La-rama-de-Camilo. No cambies de rama para copiar la del compañero.

Captura sugerida: la terminal mostrando las versiones y la rama, sin archivos .env abiertos.

## 2 Instalar Jest en el backend

Los comandos ya se ejecutaron al preparar el proyecto. Sirven para repetir la instalación en otra copia:

```powershell
cd C:\Users\camil\Desktop\TEXTICODE\BACKEND
npm install --save-dev jest@30 supertest
```

Jest ejecuta los casos; Supertest realiza solicitudes a las rutas Express sin levantar el servidor de producción. El script test:jest activa los módulos ESM de Node, que este proyecto utiliza. El script npm test original se conserva y ejecuta las pruebas anteriores de node:test.

## 3 Instalar Jest para las vistas Vue

```powershell
cd C:\Users\camil\Desktop\TEXTICODE\FRONTEND
npm install --save-dev jest@29 jest-environment-jsdom@29 @vue/test-utils@2 @vue/vue3-jest@29 babel-jest@29 @babel/core@7 @babel/preset-env@7
```

Se mantiene Jest 29 en las vistas por compatibilidad con @vue/vue3-jest 29. jsdom proporciona el navegador simulado; Vue Test Utils monta las vistas reales. Babel adapta los módulos y proporciona import.meta.env de prueba. Los datos de API, Google y correo están simulados. No se inicia sesión realmente en Google desde estas pruebas.

## 4 Entender los archivos agregados

Backend: jest.config.js configura las pruebas locales; jest.aws.config.js solo selecciona el caso AWS. __tests__/autenticacion.test.js cubre autenticación; calendar.test.js cubre Calendar; operario.test.js cubre tareas, avances, notas e historial. helpers/app.js monta las rutas reales y reemplaza únicamente la base de datos y el servicio de correo.

Frontend: jest.config.cjs, babel.config.cjs y tests/helpers preparan el entorno. tests/autenticacion.spec.js monta login, callback de Google, cambio de contraseña y menú lateral, y comprueba el router. tests/calendar.spec.js monta Calendar para los tres roles. tests/operario.spec.js monta TareasAsignadas y ReportarAvances, incluido Historial.

Los nombres de los casos llevan RF-xxx. Cada caso muestra el comportamiento comprobado. Una prueba aprobada con respuestas simuladas verifica el contrato y la lógica de aplicación; no demuestra que Google, SendGrid o una consulta SQL funcionen contra servicios reales.

## 5 Ejecutar backend local

```powershell
cd C:\Users\camil\Desktop\TEXTICODE\BACKEND
npm run test:jest -- --runInBand
```

Resultado esperado de la ejecución: cada archivo aparece como PASS y cada caso aprobado. Si un caso falla, conserva el nombre, el valor esperado y el recibido. Nunca cambies la expectativa solo para obtener PASS.

Para ejecutar un requisito y tomar una captura legible:

```powershell
npm run test:jest -- --runInBand -t RF-001
npm run test:jest -- --runInBand -t RF-044
npm run test:jest -- --runInBand -t RF-060
```

Cambia el código RF para revisar cada uno. Jest mostrará casos omitidos cuando se aplica el filtro; eso no significa que hayan fallado. RF-059 se comprueba en la vista porque sus filtros son locales.

## 6 Ejecutar frontend local

```powershell
cd C:\Users\camil\Desktop\TEXTICODE\FRONTEND
npm run test:jest -- --runInBand
npm run test:jest -- --runInBand -t RF-059
```

Puedes repetir el filtro para cada requisito. En Calendar, cada caso se repite para administrador, operario y cliente; la administración de vinculaciones se comprueba además con permisos exclusivos del administrador.

## 7 Ejecutar exactamente una prueba dentro de AWS Windows

La prueba elegida es RF-001: un usuario real inicia sesión en el backend de la propia instancia, recibe un token y la respuesta no expone su contraseña. Existe un único test de Jest; sus varias verificaciones son aserciones dentro de ese mismo caso.

1. Entra por Escritorio remoto y deja funcionando el backend en el puerto 3001.
2. Copia AWS_UNA_PRUEBA.zip a la instancia y extráelo en una carpeta propia, fuera de los archivos de producción.
3. Abre PowerShell en la carpeta extraída y ejecuta:

```powershell
.\Ejecutar-AWS.ps1
```

El ejecutor instala Jest si hace falta y solicita nombre de usuario y contraseña. Escribe la contraseña cuando la pida: no se verá ni quedará en el historial de comandos. Utiliza una cuenta activa de pruebas. No cambies políticas de seguridad si Windows bloquea el script; también puedes ejecutar las líneas del apartado alternativo con ayuda.

4. Toma una captura que muestre la sesión remota, el nombre del servidor y Tests: 1 passed, 1 total. No incluyas la contraseña ni tokens.
5. Devuelve resultados-aws.json, ejecucion-aws.txt y la captura a la carpeta de evidencias local. Solo entonces se puede cerrar el informe como ejecutado en AWS.

Esta prueba no crea, edita ni elimina registros de negocio. Sí realiza una petición de login real y puede generar registros técnicos del servidor.

## 8 Conservar resultados y evidencias

Los JSON originales de Jest permiten comprobar los nombres, resultados, tiempos y errores de cada caso. El informe revisado incluye capturas reales de PowerShell por requisito, de las dependencias y configuración, de los resúmenes completos y la captura original de AWS suministrada por Camilo. Se conservan en capturas-reales. Las pruebas locales de Google usan respuestas simuladas.

Para regenerar los resultados locales:

```powershell
cd C:\Users\camil\Desktop\TEXTICODE\BACKEND
npm run test:jest -- --runInBand --json --outputFile=../pruebas-jest/evidencias/resultados-backend.json
cd ..\FRONTEND
npm run test:jest -- --runInBand --json --outputFile=../pruebas-jest/evidencias/resultados-frontend.json
```

Los errores de consola esperados de los casos negativos no equivalen por sí mismos a pruebas fallidas. El resumen final de Jest y su JSON son la fuente del resultado. No publiques archivos .env, contraseñas, JWT, claves privadas o correos reales en las capturas.

## 9 Estructura del informe

Se conserva la organización del PDF de referencia: portada y contenido; 1 Introducción y objetivo; 2 Estrategia y herramientas; 3 Preparación del entorno; 4 Pruebas por requisito funcional; 5 Ejecución de las pruebas del backend local; 6 Ejecución de las pruebas del frontend local; 7 Prueba de integración en el servidor AWS EC2; 8 Resultados y matriz de trazabilidad; 9 Conclusiones.

AWS ya fue ejecutado por Camilo: su captura original muestra 1 prueba aprobada en Amazon EC2. Se incorpora esa evidencia al informe; no se recibió el JSON de AWS para verificarlo por separado. Los resultados del compañero no se usan como resultados de esta entrega.

Para reconstruir el informe con las capturas existentes, ejecutar con Python y las dependencias reportlab, python-docx y Pillow:

```powershell
python pruebas-jest/informe_capturas_reales.py
```

Documentación consultada: https://jestjs.io/docs/30.0/ecmascript-modules y https://github.com/vuejs/vue-jest.
