<template>
  <!-- ═══════════════════════════════════════════════════════
       TxSelect.vue — Select personalizado ultra-animado
       texticode-vue/src/components/TxSelect.vue

       USO:
         <TxSelect
           v-model="categoriaFiltro"
           :options="[{ value: '', label: 'Todas' }, ...]"
           placeholder="Selecciona..."
           icon="filter"
         />
       ═══════════════════════════════════════════════════════ -->
  <div
    ref="wrapRef"
    class="tx-select-wrap"
    :class="{
      'tx-open':     isOpen,
      'tx-focus':    isFocused,
      'tx-disabled': disabled,
      'tx-has-value': modelValue !== '',
    }"
    @keydown="onKeydown"
    @click.stop
  >
    <!-- Trigger -->
    <button
      type="button"
      class="tx-trigger"
      :disabled="disabled"
      @click="toggle"
      @focus="isFocused = true"
      @blur="onBlur"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
    >
      <!-- Icono izquierdo -->
      <span v-if="icon" class="tx-icon tx-icon-left">
        <svg v-if="icon === 'filter'" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
        </svg>
        <svg v-else-if="icon === 'user'" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"/>
        </svg>
        <svg v-else-if="icon === 'tag'" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/>
        </svg>
        <svg v-else-if="icon === 'sort'" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"/>
        </svg>
      </span>

      <!-- Texto seleccionado / placeholder -->
      <span class="tx-value" :class="{ 'tx-placeholder': !modelValue }">
        {{ selectedLabel }}
      </span>

      <!-- Badge de cuenta si tiene valor -->
      <span v-if="modelValue && showBadge" class="tx-badge">✓</span>

      <!-- Flecha animada -->
      <span class="tx-arrow" :class="{ 'tx-arrow-open': isOpen }">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
        </svg>
      </span>

      <!-- Borde animado (underline que crece) -->
      <span class="tx-underline"></span>
    </button>

    <!-- Dropdown -->
    <Transition name="tx-drop">
      <div v-if="isOpen" class="tx-dropdown" role="listbox">
        <!-- Buscador interno (si hay muchas opciones) -->
        <div v-if="searchable && options.length > 5" class="tx-search-wrap">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            ref="searchRef"
            v-model="searchQuery"
            type="text"
            class="tx-search"
            placeholder="Buscar..."
            @click.stop
          >
        </div>

        <!-- Opciones -->
        <div class="tx-options-scroll">
          <div
            v-for="(opt, i) in filteredOptions"
            :key="opt.value"
            role="option"
            class="tx-option"
            :class="{
              'tx-option-selected': opt.value === modelValue,
              'tx-option-focused':  i === focusedIndex,
            }"
            :style="{ animationDelay: `${i * 28}ms` }"
            @mouseenter="focusedIndex = i"
            @click="selectOption(opt)"
          >
            <!-- Check icon para seleccionado -->
            <span class="tx-option-check">
              <svg v-if="opt.value === modelValue" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
              </svg>
            </span>

            <!-- Dot de color opcional -->
            <span v-if="opt.color" class="tx-option-dot" :style="{ background: opt.color }"></span>

            <span class="tx-option-label">{{ opt.label }}</span>

            <!-- Badge opcional -->
            <span v-if="opt.badge" class="tx-option-badge">{{ opt.badge }}</span>
          </div>

          <!-- Sin resultados -->
          <div v-if="filteredOptions.length === 0" class="tx-empty">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            Sin opciones
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options:    {
    type: Array,
    default: () => [],
    // Espera: [{ value, label, color?, badge? }]
    // O strings simples: ['Opción 1', 'Opción 2']
  },
  placeholder: { type: String,  default: 'Selecciona...' },
  icon:        { type: String,  default: '' },
  disabled:    { type: Boolean, default: false },
  searchable:  { type: Boolean, default: false },
  showBadge:   { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const wrapRef      = ref(null)
const searchRef    = ref(null)
const isOpen       = ref(false)
const isFocused    = ref(false)
const searchQuery  = ref('')
const focusedIndex = ref(-1)

// Normalizar opciones
const normalizedOptions = computed(() =>
  props.options.map(o => typeof o === 'string'
    ? { value: o, label: o }
    : o
  )
)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return normalizedOptions.value
  const q = searchQuery.value.toLowerCase()
  return normalizedOptions.value.filter(o =>
    o.label.toLowerCase().includes(q)
  )
})

const selectedLabel = computed(() => {
  if (!props.modelValue && props.modelValue !== 0) return props.placeholder
  const found = normalizedOptions.value.find(o => o.value === props.modelValue)
  return found ? found.label : props.placeholder
})

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    focusedIndex.value = normalizedOptions.value.findIndex(o => o.value === props.modelValue)
    nextTick(() => searchRef.value?.focus())
    document.addEventListener('click', closeOnOutside)
  } else {
    document.removeEventListener('click', closeOnOutside)
  }
}

function close() {
  isOpen.value = false
  searchQuery.value = ''
  document.removeEventListener('click', closeOnOutside)
}

function closeOnOutside(e) {
  if (!wrapRef.value?.contains(e.target)) close()
}

function selectOption(opt) {
  emit('update:modelValue', opt.value)
  close()
}

function onBlur(e) {
  setTimeout(() => {
    if (!wrapRef.value?.contains(document.activeElement)) {
      isFocused.value = false
    }
  }, 150)
}

function onKeydown(e) {
  if (!isOpen.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      toggle()
    }
    return
  }

  const total = filteredOptions.value.length

  if (e.key === 'Escape') { e.preventDefault(); close(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = (focusedIndex.value + 1) % total
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = (focusedIndex.value - 1 + total) % total
  }
  if (e.key === 'Enter' && focusedIndex.value >= 0) {
    e.preventDefault()
    selectOption(filteredOptions.value[focusedIndex.value])
  }
}

onUnmounted(() => {
  document.removeEventListener('click', closeOnOutside)
})
</script>

<style scoped>
/* ══════════════════════════════════════════
   TX SELECT — Custom Animated Select
══════════════════════════════════════════ */
.tx-select-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  min-width: 160px;
  font-family: inherit;
}

/* ── TRIGGER ── */
.tx-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition:
    border-color 0.18s ease,
    box-shadow   0.18s ease,
    background   0.18s ease,
    transform    0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tx-trigger:hover:not(:disabled) {
  border-color: #1f3a52;
  background: #fafbfc;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(31, 58, 82, 0.1);
}

.tx-open .tx-trigger,
.tx-focus .tx-trigger {
  border-color: #1f3a52;
  box-shadow:
    0 0 0 3px rgba(31, 58, 82, 0.1),
    0 4px 16px rgba(31, 58, 82, 0.08);
  background: white;
}

/* Disabled */
.tx-disabled .tx-trigger {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── UNDERLINE animado ── */
.tx-underline {
  position: absolute;
  bottom: 0;
  left: 14px;
  right: 14px;
  height: 2px;
  background: linear-gradient(90deg, #1f3a52, #4a8fcc);
  border-radius: 999px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.tx-open .tx-underline,
.tx-focus .tx-underline {
  transform: scaleX(1);
}

/* ── ICONO ── */
.tx-icon {
  display: flex;
  align-items: center;
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.18s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tx-icon svg { width: 16px; height: 16px; }

.tx-open .tx-icon,
.tx-focus .tx-icon,
.tx-has-value .tx-icon {
  color: #1f3a52;
}

.tx-trigger:hover .tx-icon {
  transform: scale(1.15) rotate(-5deg);
}

/* ── VALOR / PLACEHOLDER ── */
.tx-value {
  flex: 1;
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  transition: color 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tx-placeholder {
  color: #9ca3af;
  font-weight: 400;
}

/* ── BADGE CHECK ── */
.tx-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
  animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes badgePop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* ── FLECHA ── */
.tx-arrow {
  display: flex;
  align-items: center;
  color: #6b7280;
  flex-shrink: 0;
  transition:
    transform    0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    color        0.18s ease;
}
.tx-arrow svg { width: 14px; height: 14px; }

.tx-arrow-open {
  transform: rotate(180deg) scale(1.1);
  color: #1f3a52;
}

/* ── DROPDOWN ── */
.tx-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.14),
    0 4px 16px  rgba(15, 23, 42, 0.06),
    0 0 0 1px   rgba(255,255,255,0.9) inset;
  z-index: 9999;
  overflow: hidden;
  min-width: 100%;
}

/* ── SEARCH ── */
.tx-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
}
.tx-search-wrap svg { width: 14px; height: 14px; color: #9ca3af; flex-shrink: 0; }
.tx-search {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #111827;
  background: transparent;
  font-family: inherit;
}
.tx-search::placeholder { color: #c4c9d4; }

/* ── OPCIONES SCROLL ── */
.tx-options-scroll {
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
}
.tx-options-scroll::-webkit-scrollbar       { width: 4px; }
.tx-options-scroll::-webkit-scrollbar-thumb {
  background: rgba(31, 58, 82, 0.2);
  border-radius: 999px;
}

/* ── OPCIÓN ── */
.tx-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  position: relative;
  animation: optionDrop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  transition:
    background  0.12s ease,
    transform   0.14s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow  0.12s ease;
}

@keyframes optionDrop {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

.tx-option:hover,
.tx-option-focused {
  background: #f3f6f9;
  transform: translateX(3px);
}

.tx-option-selected {
  background: linear-gradient(135deg, #f0f5ff, #e8f0fe);
  color: #1f3a52;
  font-weight: 600;
}
.tx-option-selected:hover {
  background: linear-gradient(135deg, #e8f0fe, #dbeafe);
}

/* Check */
.tx-option-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.tx-option-check svg {
  width: 14px;
  height: 14px;
  color: #1f3a52;
  animation: checkBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes checkBounce {
  from { transform: scale(0) rotate(-20deg); }
  to   { transform: scale(1) rotate(0deg);   }
}

/* Dot de color */
.tx-option-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Label */
.tx-option-label { flex: 1; }

/* Badge opcional */
.tx-option-badge {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 7px;
  border-radius: 999px;
}
.tx-option-selected .tx-option-badge {
  background: #dbeafe;
  color: #1d4ed8;
}

/* ── VACÍO ── */
.tx-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  color: #9ca3af;
  font-size: 13px;
}
.tx-empty svg { width: 16px; height: 16px; }

/* ── TRANSICIÓN DEL DROPDOWN ── */
.tx-drop-enter-active {
  animation: dropOpen 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.tx-drop-leave-active {
  animation: dropClose 0.18s ease-in both;
}

@keyframes dropOpen {
  from {
    opacity:   0;
    transform: scaleY(0.7) translateY(-8px);
    transform-origin: top;
  }
  to {
    opacity:   1;
    transform: none;
    transform-origin: top;
  }
}

@keyframes dropClose {
  from {
    opacity:   1;
    transform: none;
    transform-origin: top;
  }
  to {
    opacity:   0;
    transform: scaleY(0.8) translateY(-4px);
    transform-origin: top;
  }
}

/* ── RESPONSIVE ── */
@media (max-width: 640px) {
  .tx-dropdown {
    position: fixed;
    left:   12px;
    right:  12px;
    bottom: 12px;
    top:    auto;
    border-radius: 16px 16px 0 0;
    animation: dropUp 0.3s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes dropUp {
    from { transform: translateY(100%); }
    to   { transform: none; }
  }
}
</style>