# Propuesta Comercial
## Texticode — Sistema de Gestión Textil

**Preparada para ISATEX J&M S.A.S** · Bogotá D.C., 25 de octubre de 2026

# 1. ENCABEZADO E IDENTIFICACIÓN

| **Proyecto**                    | Sistema de Gestión Textil — Texticode                                                                                        |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| **Cliente (razón social)**      | ISATEX J&M S.A.S                                                                                                             |
| **NIT del cliente**             | 901.579.899-8                                                                                                                |
| **Persona de contacto y cargo** | Diana María Gómez Vaca – Jefe                                                                                                |
| **Proveedor**                   | TEXTICODE — equipo de desarrollo de software                                                                                 |
| **Integrantes**                 | Andrés Lancheros · Camilo Tibambre · Kevin Castro · Kevin Montenegro (Tecnólogos en Análisis y Desarrollo de Software, SENA) |
| **Correo de contacto**          | Texticode2026@gmail.com                                                                                                      |
| **Teléfono / WhatsApp**         | 322 442 1303                                                                                                                 |
| **Fecha de emisión**            | 25 de octubre de 2026                                                                                                        |
| **Vigencia de la oferta**       | 30 días calendario (hasta el 24 de noviembre de 2026)                                                                        |

# 2. INTRODUCCIÓN Y OBJETIVO PRINCIPAL

**TEXTICODE** es un equipo de desarrolladores de software formado en el SENA (Tecnólogo en Análisis y Desarrollo de Software) que creó una plataforma web para empresas de confecciones. Integra en un único sistema el **inventario, la producción, los operarios y los clientes**, y reemplaza los controles manuales por información centralizada y en tiempo real.

Entendemos que **ISATEX J&M S.A.S** necesita entregar sus órdenes a tiempo, saber qué material tiene y qué le falta, y poder mostrarle a sus clientes en qué va su pedido, sin depender de papel, hojas de cálculo dispersas ni llamadas.

> **OBJETIVO PRINCIPAL**
>
> Reducir las pérdidas operativas de ISATEX J&M S.A.S de **$ 3.400.000** a **$ 1.010.000** al mes (**−70 %**) y **recuperar la inversión en aproximadamente 3,4 meses**.

# 3. DIAGNÓSTICO DE LA SITUACIÓN ACTUAL

Estos son los cinco problemas críticos que identificamos en la gestión manual de ISATEX J&M S.A.S, con la pérdida mensual estimada que generan:

| **\#** | **Problema crítico**                        | **Consecuencia operativa**                                                                            | **Pérdida mensual** | **Pérdida anual** |
|--------|---------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------|-------------------|
| 1      | ✗ **Retrasos en la entrega de órdenes**     | Sin alertas de vencimiento ni seguimiento por fase: descuentos, reclamos y riesgo de perder clientes. | \$ 1.000.000        | \$ 12.000.000     |
| 2      | ✗ **Inventario manual y sin alertas**       | Materiales que se agotan sin aviso, compras urgentes más caras y mermas sin trazabilidad.             | \$ 800.000          | \$ 9.600.000      |
| 3      | ✗ **Reportes y comprobantes manuales**      | Horas del personal administrativo en papel y hojas de cálculo, con errores de digitación.             | \$ 700.000          | \$ 8.400.000      |
| 4      | ✗ **Asignación desordenada de operarios**   | Cargas de trabajo desbalanceadas, reprocesos y ninguna medición de eficiencia.                        | \$ 600.000          | \$ 7.200.000      |
| 5      | ✗ **Clientes sin visibilidad de su pedido** | Llamadas constantes para consultar estados y pérdida de confianza del cliente.                        | \$ 300.000          | \$ 3.600.000      |
|        | **TOTAL PÉRDIDAS**                          |                                                                                                       | **\$ 3.400.000**    | **\$ 40.800.000** |

*Cifras redondeadas del documento 02.1 Análisis del problema de ISATEX J&M S.A.S (cálculo detallado: \$ 3.395.100 al mes). Parten de supuestos preliminares que se validarán con ISATEX J&M S.A.S en la fase de análisis y validación de requisitos.*

# 4. SOLUCIÓN PROPUESTA

El sistema se llama **Texticode — Sistema de Gestión Textil** y está compuesto por once módulos. Cada uno resuelve un problema concreto del diagnóstico:

| **Módulo**                           | **Funcionalidades clave**                                                                                                                                     | **Beneficio**                                                                       |
|--------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| **1. Gestión de usuarios**           | Alta, edición y desactivación con roles (Administrador, Operario, Cliente) y contraseñas seguras.                                                             | Cada persona ve solo lo que le corresponde y la información queda protegida.        |
| **2. Inventario**                    | Materiales por categoría, stock mínimo/máximo, alertas de stock bajo o agotado, historial de movimientos y vínculo con el cliente.                            | Evita quiebres de stock no advertidos y da trazabilidad completa de los materiales. |
| **3. Producción**                    | Órdenes con prioridad, dificultad, materiales y fases; varios operarios por fase; estados En Proceso, Completada y Retrasada (automático al vencer la fecha). | Elimina las órdenes vencidas sin alerta y da control del avance en tiempo real.     |
| **4. Panel del operario**            | Tareas asignadas, reporte de avance por fase, historial y cuenta personal.                                                                                    | Cada operario sabe qué hacer y reporta sin papel.                                   |
| **5. Eficiencia y carga de trabajo** | Prendas por día, rendimiento Alto/Medio/Bajo, tendencia, observaciones y reasignación de órdenes entre operarios.                                             | Decisiones basadas en datos, carga balanceada y menos reprocesos.                   |
| **6. Clientes y comprobantes**       | Directorio de clientes y comprobantes de entrega descargables en PDF.                                                                                         | Comprobantes en segundos y sin errores de digitación.                               |
| **7. Panel del cliente**             | Seguimiento de pedidos con barra de progreso, alertas de materiales y centro de soporte.                                                                      | Menos llamadas de consulta y mayor confianza del cliente.                           |
| **8. Reportes**                      | Reportes de pedidos, eficiencia e inventario por período, en PDF y Excel.                                                                                     | Reportes en minutos en lugar de horas.                                              |
| **9. Notificaciones por correo**     | Avisos de nueva tarea, cambio de estado y comprobante (SendGrid).                                                                                             | Todos informados al instante, sin llamadas.                                         |
| **10. Google Calendar**              | Sincronización de las fechas de entrega con el calendario de cada usuario (OAuth2).                                                                           | Las fechas de entrega siempre visibles y recordadas.                                |
| **11. Seguridad y acceso**           | Ingreso con usuario/correo o con Google, sesiones con JWT y recuperación de contraseña por correo.                                                            | Acceso seguro y autónomo para cada usuario.                                         |

**Fuera de alcance:** facturación electrónica DIAN, pasarela de pagos, contabilidad y cualquier módulo no pactado en esta propuesta.

# 5. CARACTERÍSTICAS TÉCNICAS Y ARQUITECTURA

## Tecnologías empleadas

| **Capa**                           | **Tecnología**                                                              |
|------------------------------------|-----------------------------------------------------------------------------|
| **Frontend**                       | Vue.js 3, Vite y Pinia (interfaz responsive: computador, tableta y celular) |
| **Backend**                        | Node.js y Express.js (API REST)                                             |
| **Base de datos y almacenamiento** | PostgreSQL alojado en Supabase                                              |
| **Autenticación**                  | JWT, bcrypt y Google OAuth2                                                 |
| **Notificaciones**                 | SendGrid (correo electrónico)                                               |
| **Calendario**                     | Google Calendar API                                                         |

## Seguridad y política de respaldos

- Contraseñas almacenadas con cifrado **bcrypt**; acceso restringido por rol.

- Sesiones con tokens firmados (**JWT**) y comunicación cifrada por **HTTPS**.

- **Copia de seguridad automática diaria** de la base de datos, con retención de **7 días** (plan Supabase Pro).

- **Copia completa mensual** exportada fuera de la plataforma, con retención de **12 meses**.

- **Prueba de restauración trimestral** para verificar que los respaldos funcionan.

## Marco normativo

- Tratamiento de datos personales conforme a la **Ley 1581 de 2012** (Colombia), con autorización y política de tratamiento de datos.

## Integraciones

- **SendGrid** para correos, **Google Calendar** para fechas de entrega y exportación de reportes a **PDF y Excel**.

# 6. BENEFICIOS CUANTIFICABLES Y RETORNO DE INVERSIÓN (ROI)

## Situación actual vs. situación con el sistema

| **Concepto**                          | **Situación actual** | **Con el sistema** | **Ahorro mensual** | **Reducción** |
|---------------------------------------|----------------------|--------------------|--------------------|---------------|
| Retrasos en la entrega de órdenes     | \$ 1.000.000         | \$ 300.000         | \$ 700.000         | 70 %          |
| Inventario manual y sin alertas       | \$ 800.000           | \$ 240.000         | \$ 560.000         | 70 %          |
| Reportes y comprobantes manuales      | \$ 700.000           | \$ 140.000         | \$ 560.000         | 80 %          |
| Asignación desordenada de operarios   | \$ 600.000           | \$ 240.000         | \$ 360.000         | 60 %          |
| Clientes sin visibilidad de su pedido | \$ 300.000           | \$ 90.000          | \$ 210.000         | 70 %          |
| **TOTAL**                             | **\$ 3.400.000**     | **\$ 1.010.000**   | **\$ 2.390.000**   | **70 %**      |

Al ahorro bruto de **\$ 2.390.000** se le descuenta el costo mensual de operación (\$ 375.000), para un **ahorro neto de \$ 2.015.000 al mes**.

## Punto de equilibrio

> **FÓRMULA**
>
> Punto de equilibrio (meses) = Inversión inicial ÷ Ahorro mensual neto = $ 6.783.000 ÷ $ 2.015.000 = **3,4 meses**

## Proyección del ROI

| **Horizonte** | **Ahorro neto acumulado** | **Inversión inicial** | **Beneficio neto / ROI**    |
|---------------|---------------------------|-----------------------|-----------------------------|
| **6 meses**   | \$ 12.090.000             | \$ 6.783.000          | \$ 5.307.000 (**78,2 %**)   |
| **12 meses**  | \$ 24.180.000             | \$ 6.783.000          | \$ 17.397.000 (**256,5 %**) |

*ROI = (Ahorro neto acumulado − Inversión inicial) ÷ Inversión inicial. Los cálculos usan la mensualidad; con la anualidad el ahorro es ligeramente mayor.*

## Beneficios cualitativos

- Automatización de tareas repetitivas y **eliminación de errores manuales**.

- Información disponible **desde cualquier lugar** con conexión a internet.

- Mejor servicio al cliente por la **transparencia** sobre el estado de cada pedido.

- Decisiones respaldadas por **datos** de eficiencia, inventario y carga de trabajo.

# 7. INVERSIÓN REQUERIDA Y MODELO DE COSTOS

## Pago único: desarrollo e implementación

| **Concepto**                            | **Incluye**                                                                                       | **Valor (COP)**  |
|-----------------------------------------|---------------------------------------------------------------------------------------------------|------------------|
| Desarrollo e implementación del sistema | Los 11 módulos, ajustes a los procesos de ISATEX, código fuente documentado y guía de instalación | \$ 4.500.000     |
| Configuración y carga inicial de datos  | Migración de usuarios, materiales y clientes; plan de respaldo                                    | \$ 700.000       |
| Capacitación por rol                    | Sesiones para administradores, operarios y clientes; manual de usuario                            | \$ 500.000       |
| **Subtotal**                            |                                                                                                   | **\$ 5.700.000** |
| IVA (19 %)                              |                                                                                                   | \$ 1.083.000     |
| **TOTAL**                               |                                                                                                   | **\$ 6.783.000** |

## Forma de pago

| **Hito**                | **Condición**                        | **Valor (COP)** |
|-------------------------|--------------------------------------|-----------------|
| **50 % anticipo**       | Al aprobar la propuesta              | \$ 3.391.500    |
| **50 % contra entrega** | Al entregar el sistema en producción | \$ 3.391.500    |

## Costos recurrentes de operación (SaaS)

| **Concepto**                     | **Detalle**                                                                 | **Valor mensual (COP)** |
|----------------------------------|-----------------------------------------------------------------------------|-------------------------|
| Hosting y base de datos          | Vercel Pro (USD 20) y Supabase Pro (USD 25) a TRM \$ 3.163,76, más IVA 19 % | \$ 169.000              |
| Servicio de correo               | SendGrid Essentials (USD 19,95) a TRM \$ 3.163,76, más IVA 19 %             | \$ 76.000               |
| Soporte y mantenimiento          | Soporte, parches de seguridad y respaldos                                   | \$ 130.000              |
| **TOTAL MENSUAL (IVA incluido)** |                                                                             | **\$ 375.000**          |

## Modalidad de pago de la operación

El cliente **elige** si paga los costos recurrentes de forma mensual o anual:

| **Modalidad**   | **Condición**                                                                                                  | **Valor (COP, IVA incluido)** |
|-----------------|----------------------------------------------------------------------------------------------------------------|-------------------------------|
| **Mensualidad** | Pago cada mes, durante los primeros 5 días hábiles.                                                            | \$ 375.000 / mes              |
| **Anualidad**   | Pago único anticipado por 12 meses, con 10 % de descuento (equivale a \$ 337.500 / mes; ahorro de \$ 450.000). | \$ 4.050.000 / año            |

## Servicios opcionales

- Sesión de capacitación adicional (2 horas): **\$ 100.000**.

- Desarrollo de módulos o ajustes no contemplados: se cotizan por aparte (hora de desarrollo: **\$ 40.000**).

# 8. CRONOGRAMA DE IMPLEMENTACIÓN

| **Fase** | **Actividad**                       | **Duración**  | **Entregable**                           |
|----------|-------------------------------------|---------------|------------------------------------------|
| 1        | Análisis y validación de requisitos | 1 semana      | Documento de requisitos aprobado         |
| 2        | Configuración y migración de datos  | 1 semana      | Sistema con los datos de ISATEX cargados |
| 3        | Pruebas con usuarios y ajustes      | 2 semanas     | Acta de aceptación                       |
| 4        | Capacitación por rol                | 1 semana      | Manual de usuario y acta de capacitación |
| 5        | Puesta en marcha y acompañamiento   | 2 semanas     | Sistema en operación                     |
|          | **TIEMPO TOTAL DEL PROYECTO**       | **7 semanas** |                                          |

**Entregables finales:** sistema funcionando, código fuente documentado, manual de usuario, guía de instalación y plan de respaldo.

# 9. SOPORTE, MANTENIMIENTO Y GARANTÍAS (SLA)

- **Canales:** correo (Texticode2026@gmail.com) y WhatsApp / teléfono (322 442 1303).

- **Horario de atención:** lunes a viernes, 8:00 a.m. a 6:00 p.m.

- **Garantía:** 90 días calendario desde la puesta en producción, para corrección de errores sin costo.

- **Mantenimiento programado:** domingos entre 11:00 p.m. y 2:00 a.m., con aviso previo de 48 horas.

## Tiempos de respuesta y resolución

| **Gravedad** | **Descripción**                                                           | **Respuesta máxima** | **Resolución máxima** |
|--------------|---------------------------------------------------------------------------|----------------------|-----------------------|
| **Crítica**  | El sistema no funciona o ningún usuario puede operar.                     | 1 hora hábil         | 4 horas hábiles       |
| **Alta**     | Un módulo principal (inventario, producción) falla y afecta la operación. | 4 horas hábiles      | 1 día hábil           |
| **Media**    | Falla parcial o error con una alternativa para seguir trabajando.         | 1 día hábil          | 3 días hábiles        |
| **Baja**     | Consultas, dudas de uso o ajustes menores.                                | 2 días hábiles       | 7 días hábiles        |

Los nuevos desarrollos y mejoras evolutivas se cotizan por separado.

# 10. CONDICIONES COMERCIALES Y CIERRE

- **Vigencia de la oferta:** 30 días calendario desde la fecha de emisión.

- **Renovación:** según la modalidad elegida, la operación se renueva mes a mes (mensualidad) o por períodos de 12 meses (anualidad). En ambos casos, cualquiera de las partes puede terminarla con aviso previo de 30 días antes del siguiente cobro.

- **Actualización de tarifas:** los valores recurrentes se ajustan una vez al año según el IPC.

- **Cambios de alcance:** cualquier cambio se cotiza por aparte.

## Responsabilidades del cliente

- Designar un responsable que valide los requisitos y apruebe las entregas.

- Suministrar la información inicial (usuarios, materiales y clientes).

- Contar con conexión a internet y dispositivos para los usuarios.

## Próximos pasos

1. Reunión de validación de alcance con ISATEX J&M S.A.S.

2. Aprobación de la propuesta comercial, elección de la modalidad de pago de la operación (mensual o anual) y pago del anticipo.

3. Carga inicial de datos (usuarios, materiales y clientes).

4. Capacitación por rol y puesta en marcha.

5. Acompañamiento y soporte posterior.

## Aceptación

Al firmar este documento, las partes aceptan los términos de la presente propuesta.

| **Por el cliente — ISATEX J&M S.A.S**                            | **Por el proveedor — TEXTICODE** |
|------------------------------------------------------------------|----------------------------------|
| **Modalidad de pago de la operación: \[ \] Mensual \[ \] Anual** |                                  |
| Nombre:                                                          | Nombre:                          |
| Cargo:                                                           | Cargo:                           |
| Firma:                                                           | Firma:                           |
| Fecha:                                                           | Fecha:                           |
