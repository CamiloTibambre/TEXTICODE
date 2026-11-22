global.requestAnimationFrame = () => 1
global.cancelAnimationFrame = () => {}
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  history.replaceState(null, '', '/')
  jest.useFakeTimers({ doNotFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
  jest.setSystemTime(new Date('2026-11-08T12:00:00-05:00'))
  global.fetch = jest.fn(() => Promise.reject(new Error('Petición no prevista en la prueba')))
  window.confirm = jest.fn(() => true)
  window.scrollTo = jest.fn()
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null)
})
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks() })
