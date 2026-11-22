<!--
  ConfirmDialog — se monta UNA vez en App.vue. Se usa con useConfirm():

    const confirmar = useConfirm()
    if (!await confirmar({ titulo: '¿Eliminar…?', tono: 'danger' })) return
-->
<template>
  <BaseModal
    elevado
    :open="estado.abierto"
    :titulo="estado.titulo"
    :descripcion="estado.mensaje"
    tamano="sm"
    rol="alertdialog"
    :mostrar-cerrar="false"
    @update:open="v => !v && responder(false)"
  >
    <template #footer>
      <button type="button" class="tx-btn tx-btn--secondary" @click="responder(false)">
        {{ estado.textoCancelar }}
      </button>
      <button
        type="button"
        class="tx-btn"
        :class="estado.tono === 'danger' ? 'tx-btn--danger' : 'tx-btn--primary'"
        @click="responder(true)"
      >
        {{ estado.textoConfirmar }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import { useConfirmState } from '../../composables/useConfirm'

const { estado, responder } = useConfirmState()
</script>
