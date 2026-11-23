import { crearDocumentoPdf, estiloPdf, fechaDocumento } from './documentoPdf'

export function referenciaOrden(id) {
  return 'ORD-' + String(id).padStart(4, '0')
}

export function numeroComprobante(id, comprobante) {
  return comprobante?.Id_Comprobante == null
    ? referenciaOrden(id)
    : String(comprobante.Id_Comprobante).padStart(4, '0')
}

export async function generarComprobantePdf(orden) {
  const { doc, fuente, cabecera, pies, izquierda, derecha, ancho } = await crearDocumentoPdf({
    titulo: 'Comprobante de entrega',
    subtitulo: 'N.º ' + orden.numero,
  })
  const { gris, texto, borde, fondoTabla, paginaLimite } = estiloPdf
  const entregado = orden.estadoClass === 'success'
  const colorEstado = entregado ? '#166534' : '#92400e'
  const estado = orden.estadoPedido || orden.estado

  function campo(titulo, valores, x, y) {
    fuente(8, gris, 'bold')
    doc.text(titulo.toUpperCase(), x, y)
    fuente(10)
    const lineas = valores.filter(valor => valor && valor !== '-')
      .flatMap(valor => doc.splitTextToSize(String(valor), 81))
    doc.text(lineas.length ? lineas : ['—'], x, y + 5, { lineHeightFactor: 1.25 })
    return y + Math.max(lineas.length, 1) * 4.5 + 8
  }

  let y = cabecera()
  y = Math.max(
    campo('Cliente', [orden.cliente, orden.clienteEmail, orden.clienteTel && orden.clienteTel !== '-' ? 'Tel: ' + orden.clienteTel : ''], izquierda, y),
    campo('Orden de referencia', [referenciaOrden(orden.id)], 110, y),
  )
  y = Math.max(
    campo('Fecha de generación', [fechaDocumento(new Date())], izquierda, y),
    campo('Fecha límite de entrega', [fechaDocumento(orden.fechaLimite)], 110, y),
  )
  fuente(8, gris, 'bold')
  doc.text('ESTADO DEL PEDIDO', izquierda, y)
  fuente(10, colorEstado, 'bold')
  doc.setFillColor(entregado ? '#dcfce7' : '#fef3c7')
  doc.roundedRect(izquierda, y + 2, doc.getTextWidth(estado) + 7, 6, 3, 3, 'F')
  doc.text(estado, izquierda + 3.5, y + 6.2)
  y += 14

  function tablaEncabezado(top) {
    doc.setFillColor(fondoTabla)
    doc.setDrawColor(borde)
    doc.setLineWidth(0.25)
    doc.roundedRect(izquierda, top, ancho, 9, 2, 2, 'FD')
    fuente(9, '#374151', 'bold')
    doc.text('#', 21, top + 5.8)
    doc.text('Descripción del producto / servicio', 32, top + 5.8)
    doc.text('Cantidad', 148, top + 5.8, { align: 'center' })
    doc.text('Estado entrega', 188, top + 5.8, { align: 'right' })
    return top + 9
  }

  function fila(lineas, primera) {
    const alto = lineas.length * 4.4 + 5
    doc.setDrawColor(borde)
    doc.rect(izquierda, y, ancho, alto)
    fuente(10)
    doc.text(lineas, 32, y + 5, { lineHeightFactor: 1.25 })
    if (primera) {
      doc.text('1', 21, y + 5)
      doc.text(String(orden.cantidad ?? '—'), 148, y + 5, { align: 'center' })
      fuente(9, colorEstado, 'bold')
      doc.text(entregado ? 'Entregado' : 'Pendiente', 188, y + 5, { align: 'right' })
    }
    y += alto
  }

  asegurarEspacio(20)
  y = tablaEncabezado(y)
  fuente(10)
  const descripcion = orden.descripcion && orden.descripcion !== orden.productos ? [orden.descripcion] : []
  const lineas = [orden.productos || '—', ...descripcion, ...(orden.detalles || [])].flatMap(parrafo => doc.splitTextToSize(parrafo, 105))
  let primera = true
  while (lineas.length) {
    const espacio = Math.floor((paginaLimite - y - 5) / 4.4)
    fila(lineas.splice(0, espacio), primera)
    if (lineas.length) {
      doc.addPage()
      y = tablaEncabezado(cabecera())
    }
    primera = false
  }

  function asegurarEspacio(alto) {
    if (y + alto <= paginaLimite) return
    doc.addPage()
    y = cabecera()
  }

  y += 9
  asegurarEspacio(14)
  fuente(8, gris, 'bold')
  doc.text('OBSERVACIONES', izquierda, y)
  y += 6
  fuente(10, '#374151')
  const notas = doc.splitTextToSize(orden.observaciones || 'Ninguna observación registrada.', ancho)
  for (const linea of notas) {
    asegurarEspacio(5)
    fuente(10, '#374151')
    doc.text(linea, izquierda, y)
    y += 4.4
  }

  fuente(10, texto, 'bold')
  const firmantes = ['TEXTICODE S.A.S.', orden.cliente || '—'].map(nombre => doc.splitTextToSize(nombre, 77))
  asegurarEspacio(23 + Math.max(...firmantes.map(lineas => lineas.length)) * 4.4)
  y += 15
  for (const [i, medio] of [57, 153].entries()) {
    doc.setDrawColor('#9ca3af')
    doc.line(medio - 40, y, medio + 40, y)
    fuente(9, gris)
    doc.text(i === 0 ? 'Entregado por' : 'Recibido por', medio, y + 5, { align: 'center' })
    fuente(10, texto, 'bold')
    doc.text(firmantes[i], medio, y + 10, { align: 'center', lineHeightFactor: 1.25 })
  }

  pies('Documento de uso oficial · TEXTICODE S.A.S.')
  return doc
}
