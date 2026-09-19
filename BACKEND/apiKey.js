// apiKey.js
const verificarApiKey = (req, res, next) => {
  const key = req.headers['x-api-key']

  if (!key) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. Se requiere API Key en el header x-api-key'
    })
  }

  if (key !== process.env.API_KEY_EFICIENCIA) {
    return res.status(403).json({
      ok: false,
      mensaje: 'API Key inválida'
    })
  }

  next()
}

export default verificarApiKey