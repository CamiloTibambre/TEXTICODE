module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  // Vite resuelve import.meta.env en producción; Jest recibe un valor de prueba.
  plugins: [function ({ types: t }) {
    return { visitor: { MetaProperty(path) {
      if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
        path.replaceWith(t.valueToNode({ env: { VITE_API_URL: 'http://localhost:3001/api' } }))
      }
    } } }
  }],
}
