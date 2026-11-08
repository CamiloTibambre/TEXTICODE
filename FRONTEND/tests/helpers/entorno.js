// Ajustes del navegador simulado (jsdom) que las vistas necesitan.
window.HTMLCanvasElement.prototype.getContext = () => null      // el fondo animado del login
window.requestAnimationFrame = cb => setTimeout(cb, 0)
window.cancelAnimationFrame = id => clearTimeout(id)
window.scrollTo = () => {}
Element.prototype.scrollIntoView = function () {}
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
