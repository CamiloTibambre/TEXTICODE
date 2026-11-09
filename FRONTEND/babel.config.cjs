// Solo lo usa Jest para entender la sintaxis moderna de los archivos .js y .vue
// Algunas vistas leen import.meta.env (propio de Vite); en Jest se cambia por process.env.
const importMetaEnJest = () => ({
  visitor: {
    MetaProperty(path) {
      if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
        path.replaceWithSourceString('({ env: process.env })')
      }
    },
  },
})

module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  plugins: [importMetaEnJest],
}
