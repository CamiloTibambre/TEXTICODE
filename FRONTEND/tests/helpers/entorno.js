// Ajustes del navegador simulado (jsdom) que las vistas necesitan.
// Se carga con setupFilesAfterEnv (usa beforeEach/jest, que solo existen después del framework).
window.HTMLCanvasElement.prototype.getContext = () => null      // el fondo animado del login
window.requestAnimationFrame = cb => setTimeout(cb, 0)
window.cancelAnimationFrame = id => clearTimeout(id)
window.scrollTo = () => {}
window.confirm = () => true
Element.prototype.scrollIntoView = function () {}
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  history.replaceState(null, '', '/')
  // Si una prueba hace una petición sin simularla, falla en vez de salir a la red
  global.fetch = jest.fn(() => Promise.reject(new Error('Petición no prevista en la prueba')))
})