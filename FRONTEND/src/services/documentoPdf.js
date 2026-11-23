export const logoTexticode = (import.meta.env.BASE_URL || '/') + 'img/LogoTexticode.png'

export const estiloPdf = {
  azul: '#1f3a52',
  gris: '#4b5563',
  texto: '#111827',
  textoTabla: '#374151',
  borde: '#e5e7eb',
  fondoTabla: '#f1f5f9',
  paginaLimite: 275,
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })

let cargaPdf

export function fechaDocumento(valor) {
  if (!valor || valor === '-') return '—'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? valor : formatoFecha.format(fecha)
}

function cargarJsPdf() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF)
  if (!cargaPdf) {
    cargaPdf = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = () => {
        if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF)
        else {
          script.remove()
          reject(new Error('No se pudo cargar el generador PDF'))
        }
      }
      script.onerror = () => {
        script.remove()
        reject(new Error('No se pudo cargar el generador PDF'))
      }
      document.head.appendChild(script)
    }).catch(error => {
      cargaPdf = null
      throw error
    })
  }
  return cargaPdf
}

async function cargarLogo() {
  try {
    const imagen = new Image()
    imagen.src = logoTexticode
    await imagen.decode()
    return imagen
  } catch {
    return null
  }
}

export async function crearDocumentoPdf({ titulo, subtitulo = '' }) {
  const [JsPDF, logo] = await Promise.all([cargarJsPdf(), cargarLogo()])
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setProperties({ title: subtitulo ? titulo + ' ' + subtitulo : titulo })

  const izquierda = 17
  const derecha = 193
  const ancho = derecha - izquierda
  const { azul, gris, texto } = estiloPdf

  function fuente(tamano, color = texto, estilo = 'normal') {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    doc.setTextColor(color)
  }

  function cabecera() {
    if (logo) {
      const escala = Math.min(46 / logo.naturalWidth, 11 / logo.naturalHeight)
      doc.addImage(logo, 'PNG', izquierda, 14, logo.naturalWidth * escala, logo.naturalHeight * escala)
    } else {
      fuente(15, azul, 'bold')
      doc.text('TEXTICODE', izquierda, 22)
    }

    fuente(13, azul, 'bold')
    const lineas = doc.splitTextToSize(titulo.toUpperCase(), 114)
    doc.text(lineas, derecha, 19, { align: 'right', lineHeightFactor: 1.2 })
    const finTitulo = 19 + (lineas.length - 1) * 5.5
    if (subtitulo) {
      fuente(10, gris)
      doc.text(subtitulo, derecha, finTitulo + 6, { align: 'right' })
    }

    const divisor = Math.max(30, finTitulo + (subtitulo ? 11 : 6))
    doc.setDrawColor(azul)
    doc.setLineWidth(0.5)
    doc.line(izquierda, divisor, derecha, divisor)
    return divisor + 9
  }

  function pies(etiqueta, numerar = false) {
    const total = doc.internal.getNumberOfPages()
    for (let pagina = 1; pagina <= total; pagina += 1) {
      doc.setPage(pagina)
      fuente(8, '#6b7280')
      doc.text(etiqueta, 105, 286, { align: 'center' })
      if (numerar) doc.text('Página ' + pagina + ' de ' + total, derecha, 286, { align: 'right' })
    }
  }

  return { doc, fuente, cabecera, pies, izquierda, derecha, ancho }
}
