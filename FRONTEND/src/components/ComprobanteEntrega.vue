<template>
  <BaseModal :open="!!orden" titulo="Comprobante de entrega" tamano="lg" @update:open="open => !open && $emit('cerrar')">
    <article v-if="orden" class="comprobante">
      <header class="cabecera">
        <img :src="logoTexticode" alt="Texticode">
        <div>
          <h2>Comprobante de entrega</h2>
          <span>N.º {{ orden.numero }}</span>
        </div>
      </header>

      <dl class="datos">
        <div>
          <dt>Cliente</dt>
          <dd><strong>{{ orden.cliente || '—' }}</strong></dd>
          <dd v-if="orden.clienteEmail && orden.clienteEmail !== '-'">{{ orden.clienteEmail }}</dd>
          <dd v-if="orden.clienteTel && orden.clienteTel !== '-'">Tel: {{ orden.clienteTel }}</dd>
        </div>
        <div><dt>Orden de referencia</dt><dd><strong>{{ referenciaOrden(orden.id) }}</strong></dd></div>
        <div><dt>Fecha de generación</dt><dd>{{ fechaDocumento(new Date()) }}</dd></div>
        <div><dt>Fecha límite de entrega</dt><dd>{{ fechaDocumento(orden.fechaLimite) }}</dd></div>
        <div><dt>Estado del pedido</dt><dd><span class="estado" :class="{ entregado: orden.estadoClass === 'success' }">{{ orden.estadoPedido || orden.estado }}</span></dd></div>
      </dl>

      <div class="tabla">
        <table>
          <thead><tr><th scope="col">#</th><th scope="col">Descripción del producto / servicio</th><th scope="col">Cantidad</th><th scope="col">Estado entrega</th></tr></thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <strong>{{ orden.productos }}</strong>
                <span v-if="orden.descripcion && orden.descripcion !== orden.productos" class="descripcion">{{ orden.descripcion }}</span>
                <span v-for="detalle in orden.detalles" :key="detalle" class="descripcion">{{ detalle }}</span>
              </td>
              <td>{{ orden.cantidad ?? '—' }}</td>
              <td class="resultado" :class="{ entregado: orden.estadoClass === 'success' }">{{ orden.estadoClass === 'success' ? 'Entregado' : 'Pendiente' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div><h3>Observaciones</h3><p class="observaciones">{{ orden.observaciones || 'Ninguna observación registrada.' }}</p></div>
      <div class="firmas">
        <div>Entregado por<br><strong>TEXTICODE S.A.S.</strong></div>
        <div>Recibido por<br><strong>{{ orden.cliente || '—' }}</strong></div>
      </div>
      <footer>Documento de uso oficial · TEXTICODE S.A.S.</footer>
    </article>

    <template v-if="orden" #footer>
      <button type="button" class="tx-btn tx-btn--secondary" @click="$emit('cerrar')">Cerrar</button>
      <button type="button" class="tx-btn tx-btn--primary" :disabled="descargando" @click="$emit('descargar', orden)">
        {{ descargando ? 'Generando…' : 'Descargar PDF' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './base/BaseModal.vue'
import { referenciaOrden } from '../services/comprobanteEntrega'
import { fechaDocumento, logoTexticode } from '../services/documentoPdf'

defineProps({ orden: Object, descargando: Boolean })
defineEmits(['cerrar', 'descargar'])
</script>

<style scoped>
.comprobante {
  color-scheme: light;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: #fff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.cabecera { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 2px solid #1f3a52; }
.cabecera img { height: 36px; max-width: 42%; object-fit: contain; object-position: left; }
.cabecera div { text-align: right; color: #4b5563; }
.cabecera h2 { margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; color: #1f3a52; }
.datos, .firmas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
.datos dt, h3 { margin: 0 0 3px; font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; }
.datos dd { margin: 0; }
.estado { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; }
.estado.entregado { background: #dcfce7; color: #166534; }
.tabla { overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 8px 12px; vertical-align: top; }
th { background: #f1f5f9; color: #374151; font-weight: 700; }
.descripcion { display: block; color: #4b5563; }
.resultado { color: #92400e; font-weight: 600; }
.resultado.entregado { color: #166534; }
.observaciones { margin: 0; white-space: pre-line; color: #374151; }
.firmas { gap: 24px; margin-top: 10px; text-align: center; color: #4b5563; font-size: 12px; }
.firmas div { padding-top: 6px; border-top: 1px solid #9ca3af; }
.firmas strong { color: #111827; }
footer { text-align: center; color: #6b7280; font-size: 11px; }

@media (max-width: 520px) {
  .comprobante { padding: 14px; }
  th, td { padding: 6px; }
  th, td { font-size: 11px; }
}
</style>
