// services/rendimiento.js

const PERIODOS_BASE = 3
const UMBRAL_ALTO = 1.05
const UMBRAL_BAJO = 0.85
const DIA_MS = 86400000

function construirVentanas(periodo, dias = 30) {
  const ahora = new Date()
  const v = []

  if (/^\d{4}-\d{2}$/.test(periodo || '')) {
    const [y, m] = periodo.split('-').map(Number)

    for (let i = 0; i <= PERIODOS_BASE; i++) {
      v.push({
        ini: new Date(Date.UTC(y, m - 1 - i, 1)),
        fin: new Date(Date.UTC(y, m - i, 1)),
      })
    }
  } else {
    for (let i = 0; i <= PERIODOS_BASE; i++) {
      v.push({
        ini: new Date(ahora.getTime() - (i + 1) * dias * DIA_MS),
        fin: new Date(ahora.getTime() - i * dias * DIA_MS),
      })
    }
  }

  return v
}

export async function calcularRendimiento(
  pool,
  { periodo, dias = 30 } = {}
) {
  const ventanas = construirVentanas(periodo, dias)

  const desde = ventanas[ventanas.length - 1].ini
  const hasta = ventanas[0].fin

  const { rows } = await pool.query(`
    WITH fases AS (
      SELECT
        oo."Id_Operario",
        oo."Estado_Fase",
        oo."Fecha_Completada",

        CASE
          WHEN oo."Cantidad_Realizada" > 0
            THEN oo."Cantidad_Realizada"::numeric

          ELSE
            o."Cantidad"::numeric /
            COUNT(*) OVER (
              PARTITION BY oo."Id_Orden", oo."Numero_Fase"
            )
        END AS unidades,

        CASE o."Dificultad"
          WHEN 'Alta' THEN 1.5
          WHEN 'Media' THEN 1.25
          ELSE 1
        END AS peso

      FROM orden_operario oo

      JOIN orden_produccion o
        ON o."Id_Orden" = oo."Id_Orden"
    )

    SELECT
      "Id_Operario",
      "Fecha_Completada",
      unidades,
      peso

    FROM fases

    WHERE "Estado_Fase" = 'Completada'
      AND "Fecha_Completada" >= $1
      AND "Fecha_Completada" < $2
  `, [desde, hasta])

  const ahora = new Date()
  const porOperario = new Map()

  for (const r of rows) {
    const f = new Date(r.Fecha_Completada)

    const idx = ventanas.findIndex(
      v => f >= v.ini && f < v.fin
    )

    if (idx === -1) continue

    if (!porOperario.has(r.Id_Operario)) {
      porOperario.set(
        r.Id_Operario,
        ventanas.map(() => ({
          raw: 0,
          pond: 0
        }))
      )
    }

    const b = porOperario.get(r.Id_Operario)[idx]

    b.raw += Number(r.unidades)

    b.pond +=
      Number(r.unidades) *
      Number(r.peso)
  }

  const resultado = new Map()

  for (const [id, buckets] of porOperario) {
    const tasas = buckets.map((b, i) => {
      const fin = new Date(
        Math.min(
          ventanas[i].fin,
          ahora
        )
      )

      const nDias = Math.max(
        1,
        (fin - ventanas[i].ini) / DIA_MS
      )

      return {
        raw: b.raw / nDias,
        pond: b.pond / nDias
      }
    })

    const actual = tasas[0]

    const previos = tasas
      .slice(1)
      .filter(t => t.pond > 0)

    const baseline = previos.length
      ? previos.reduce(
          (s, t) => s + t.pond,
          0
        ) / previos.length
      : null

    const anterior = tasas[1]?.raw ?? 0
    const ultimo = tasas[1]?.pond ?? 0

    let rendimiento = 'Medio'
    let tendencia = 'estable'

    if (baseline) {
      const ratio =
        actual.pond / baseline

      if (ratio >= UMBRAL_ALTO) {
        rendimiento = 'Alto'
        tendencia = 'subiendo'

      } else if (
        ratio < UMBRAL_BAJO &&
        actual.pond < ultimo
      ) {
        rendimiento = 'Bajo'
        tendencia = 'bajando'
      }
    }

    resultado.set(id, {
      prendas_por_dia:
        Number(actual.raw.toFixed(1)),

      baseline:
        baseline !== null
          ? Number(baseline.toFixed(1))
          : null,

      anterior_por_dia:
        Number(anterior.toFixed(1)),

      diferencia_prendas:
        Number(
          (actual.raw - anterior).toFixed(1)
        ),

      tendencia,
      rendimiento
    })
  }

  return resultado
}