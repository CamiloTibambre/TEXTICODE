// ═══════════════════════════════════════════════════════════════
// texticode-vue/src/plugins/scrollReveal.js
// Plugin Vue para animaciones de scroll (Intersection Observer)
// ═══════════════════════════════════════════════════════════════

/**
 * INSTALACIÓN en main.js:
 *   import { ScrollRevealPlugin } from './plugins/scrollReveal'
 *   app.use(ScrollRevealPlugin)
 *
 * USO en templates:
 *   <div v-reveal>              → fade + slide-up
 *   <div v-reveal.left>         → desde la izquierda
 *   <div v-reveal.right>        → desde la derecha
 *   <div v-reveal.scale>        → escala
 *   <div v-reveal.blur>         → blur + slide
 *   <div v-reveal="{ delay: 200 }">   → con delay en ms
 *   <div v-stagger>             → aplica stagger a children directos
 */

const OBSERVER_OPTIONS = {
  threshold:  0.08,
  rootMargin: '0px 0px -40px 0px',
}

// Observer singleton
let observer = null

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Opcional: dejar de observar tras primera aparición
          if (!entry.target._revealRepeat) {
            observer.unobserve(entry.target)
          }
        } else if (entry.target._revealRepeat) {
          entry.target.classList.remove('visible')
        }
      })
    }, OBSERVER_OPTIONS)
  }
  return observer
}

// Directiva v-reveal
const revealDirective = {
  mounted(el, binding) {
    const modifiers = binding.modifiers
    const options   = typeof binding.value === 'object' ? binding.value : {}

    // Añadir clase base
    if (modifiers.left)  el.classList.add('reveal-left')
    else if (modifiers.right) el.classList.add('reveal-right')
    else if (modifiers.scale) el.classList.add('reveal-scale')
    else if (modifiers.blur)  el.classList.add('reveal-blur')
    else if (modifiers.slide) el.classList.add('reveal-slide')
    else                  el.classList.add('reveal-up')

    // Delay
    const delay = options.delay || binding.value || 0
    if (delay) el.style.transitionDelay = `${delay}ms`

    // Repeat
    el._revealRepeat = modifiers.repeat || options.repeat || false

    // Observar
    getObserver().observe(el)
  },
  unmounted(el) {
    getObserver().unobserve(el)
  },
}

// Directiva v-stagger — añade delays progresivos a los hijos
const staggerDirective = {
  mounted(el, binding) {
    const baseDelay  = typeof binding.value === 'number' ? binding.value : 60
    const children   = Array.from(el.children)

    children.forEach((child, i) => {
      child.classList.add('reveal-up')
      child.style.transitionDelay = `${i * baseDelay}ms`
      getObserver().observe(child)
    })

    el._staggerChildren = children
  },
  unmounted(el) {
    (el._staggerChildren || []).forEach(child => {
      getObserver().unobserve(child)
    })
  },
}

// Plugin
export const ScrollRevealPlugin = {
  install(app) {
    app.directive('reveal', revealDirective)
    app.directive('stagger', staggerDirective)
  },
}

// ═══════════════════════════════════════════════════════════════
// texticode-vue/src/plugins/ripple.js
// Plugin Vue para efecto ripple en botones
// ═══════════════════════════════════════════════════════════════

/**
 * USO: <button v-ripple>Click me</button>
 * Con color: <button v-ripple="'rgba(255,255,255,0.3)'">
 */
export const RipplePlugin = {
  install(app) {
    app.directive('ripple', {
      mounted(el, binding) {
        const color = binding.value || 'rgba(255,255,255,0.22)'

        el.style.position = 'relative'
        el.style.overflow  = 'hidden'

        el._rippleHandler = function (e) {
          const rect   = el.getBoundingClientRect()
          const size   = Math.max(rect.width, rect.height) * 1.6
          const x      = e.clientX - rect.left - size / 2
          const y      = e.clientY - rect.top  - size / 2

          const ripple = document.createElement('span')
          Object.assign(ripple.style, {
            position:        'absolute',
            width:           `${size}px`,
            height:          `${size}px`,
            left:            `${x}px`,
            top:             `${y}px`,
            background:      color,
            borderRadius:    '50%',
            transform:       'scale(0)',
            animation:       'rippleExpand 0.55s cubic-bezier(0.16,1,0.3,1) forwards',
            pointerEvents:   'none',
          })

          el.appendChild(ripple)
          setTimeout(() => ripple.remove(), 600)
        }

        el.addEventListener('click', el._rippleHandler)

        // Inyectar keyframe si no existe
        if (!document.querySelector('#ripple-keyframes')) {
          const style = document.createElement('style')
          style.id = 'ripple-keyframes'
          style.textContent = `
            @keyframes rippleExpand {
              to { transform: scale(1); opacity: 0; }
            }
          `
          document.head.appendChild(style)
        }
      },
      unmounted(el) {
        el.removeEventListener('click', el._rippleHandler)
      },
    })
  },
}

// ═══════════════════════════════════════════════════════════════
// texticode-vue/src/plugins/tiltHover.js
// Efecto 3D tilt suave en cards
// ═══════════════════════════════════════════════════════════════

/**
 * USO: <div v-tilt>Card con efecto 3D</div>
 * Intensidad: <div v-tilt="8">  (grados máx, default = 6)
 */
export const TiltPlugin = {
  install(app) {
    app.directive('tilt', {
      mounted(el, binding) {
        const max = binding.value || 6

        el._tiltEnter = function () {
          el.style.transformStyle = 'preserve-3d'
          el.style.willChange     = 'transform'
        }

        el._tiltMove = function (e) {
          const rect  = el.getBoundingClientRect()
          const cx    = rect.left + rect.width  / 2
          const cy    = rect.top  + rect.height / 2
          const dx    = (e.clientX - cx) / (rect.width  / 2)
          const dy    = (e.clientY - cy) / (rect.height / 2)
          const rotX  = -dy * max
          const rotY  =  dx * max

          el.style.transition = 'transform 0.08s ease-out'
          el.style.transform  = `
            perspective(800px)
            rotateX(${rotX}deg)
            rotateY(${rotY}deg)
            translateZ(4px)
          `
        }

        el._tiltLeave = function () {
          el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)'
          el.style.transform  = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)'
        }

        el.addEventListener('mouseenter', el._tiltEnter)
        el.addEventListener('mousemove',  el._tiltMove)
        el.addEventListener('mouseleave', el._tiltLeave)
      },
      unmounted(el) {
        el.removeEventListener('mouseenter', el._tiltEnter)
        el.removeEventListener('mousemove',  el._tiltMove)
        el.removeEventListener('mouseleave', el._tiltLeave)
      },
    })
  },
}