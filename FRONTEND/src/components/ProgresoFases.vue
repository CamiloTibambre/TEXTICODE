<template>
  <div
    v-if="fases.length"
    class="progreso-fases"
    role="progressbar"
    aria-label="Progreso de fases"
    :aria-valuemin="0"
    :aria-valuemax="fases.length"
    :aria-valuenow="completadas"
    :aria-valuetext="`${completadas} de ${fases.length} fases completadas`"
  >
    <span
      v-for="fase in fases"
      :key="fase.numero"
      class="progreso-fases__segmento"
      :class="`progreso-fases__segmento--${fase.estado}`"
      :title="`Fase ${fase.numero}${fase.descripcion ? ` · ${fase.descripcion}` : ''}: ${fase.estado}`"
    ></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  asignaciones: { type: Array, default: () => [] },
})

const fases = computed(() => {
  const porNumero = new Map()
  for (const asignacion of props.asignaciones) {
    const numero = Number(asignacion.Numero_Fase)
    if (!porNumero.has(numero)) {
      porNumero.set(numero, { numero, descripcion: '', completa: true })
    }
    const fase = porNumero.get(numero)
    fase.descripcion ||= asignacion.Descripcion_Fase
    fase.completa &&= asignacion.Estado_Fase === 'Completada'
  }

  const ordenadas = [...porNumero.values()].sort((a, b) => a.numero - b.numero)
  const actual = ordenadas.find(fase => !fase.completa)
  return ordenadas.map(fase => ({
    ...fase,
    estado: fase.completa ? 'completada' : fase === actual ? 'actual' : 'pendiente',
  }))
})

const completadas = computed(() => fases.value.filter(fase => fase.completa).length)
</script>

<style scoped>
.progreso-fases {
  display: flex;
  gap: 4px;
}

.progreso-fases__segmento {
  flex: 1;
  min-width: 0;
  height: 4px;
  border-radius: 999px;
  background: var(--th-surface-3, #e2e8f0);
}

.progreso-fases__segmento--actual {
  background: var(--th-text-muted, #64748b);
}

.progreso-fases__segmento--completada {
  background: var(--th-info-solid, #2563eb);
}
</style>
