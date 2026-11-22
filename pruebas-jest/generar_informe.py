"""Informe y evidencias obtenidos exclusivamente de los JSON reales de Jest."""
import sys, json, re, html, hashlib, csv
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'pruebas-jest'
EV = BASE / 'evidencias'
AUTOR = 'Camilo Andres Tibambre Montaña'
FICHA = '3278639'
CODIGOS = [f'RF-{n:03}' for n in [*range(1,8), *range(44,48), *range(55,63)]]
from docx import Document
doc = Document(r'C:/Users/camil/Downloads/Requisitos_Funcionales_Texticode_por_vista.docx')
requisitos = {}
for tabla in doc.tables:
    for fila in tabla.rows:
        c = [x.text for x in fila.cells]
        if c[0] in CODIGOS and len(c) == 3 and c[0] not in requisitos:
            requisitos[c[0]] = {'titulo': c[1], 'descripcion': c[2]}

def datos():
    fuentes = {}
    registros = []
    for capa, archivo in [('B', 'resultados-backend.json'), ('F', 'resultados-frontend.json')]:
        p = EV / archivo
        data = json.loads(p.read_text(encoding='utf-8-sig'))
        fuentes[capa] = data
        for suite in data['testResults']:
            for t in suite['assertionResults']:
                codes = set(re.findall(r'RF-\d{3}', t['fullName']))
                if len(codes) != 1:
                    raise ValueError('Cada caso debe identificar exactamente un requisito: ' + t['fullName'])
                codigo = next(iter(codes))
                if codigo not in CODIGOS: raise ValueError(codigo)
                registros.append({'rf': codigo, 'capa': capa, 'nombre': t['fullName'], 'estado': t['status'], 'ms': t.get('duration', 0), 'archivo': str(Path(suite['name']).relative_to(ROOT))})
    return fuentes, registros

def preparar():
    fuentes, registros = datos()
    EV.mkdir(exist_ok=True, parents=True)
    with (EV/'matriz-casos.csv').open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['rf','capa','nombre','estado','ms','archivo']); w.writeheader(); w.writerows(registros)
    links = []
    partes = [(codigo, inicio) for codigo in CODIGOS for inicio in range(0, sum(r['rf']==codigo for r in registros), 6)]
    for codigo, inicio in partes:
        req = requisitos[codigo]
        todos = [r for r in registros if r['rf'] == codigo]
        tests = todos[inicio:inicio+6]
        sufijo = f'-{inicio//6+1:02}'
        if not tests: raise ValueError('Requisito sin pruebas: ' + codigo)
        filas = ''.join(f'<tr><td>{r["capa"]}</td><td>{html.escape(r["nombre"])}</td><td class="estado">{r["estado"].upper()}</td><td>{r["ms"]}</td></tr>' for r in tests)
        evidencias = []
        for capa, name in [('B','resultados-backend.json'),('F','resultados-frontend.json')]:
            if any(r['capa']==capa for r in tests):
                p=EV/name
                fecha=datetime.fromtimestamp(fuentes[capa]['startTime']/1000, ZoneInfo('America/Bogota')).strftime('%Y-%m-%d %H:%M:%S %Z')
                evidencias.append(f'{capa}: {name} | Inicio: {fecha} | SHA256: {hashlib.sha256(p.read_bytes()).hexdigest()}')
        texto = f'''<!doctype html><html lang="es"><meta charset="utf-8"><title>{codigo} Resultados Jest Texticode</title><style>
*{{box-sizing:border-box}}body{{margin:0;padding:38px 44px;width:1200px;font:18px/1.45 'Segoe UI',Arial;color:#192b38;background:#fff}}h1{{font-size:30px;line-height:1.15;margin:10px 0 15px}}p{{margin:10px 0 18px}}.marca{{font-size:16px;letter-spacing:2px;color:#526c7b}}.sub{{font-size:17px;color:#526c7b}}table{{width:100%;border-collapse:collapse;font-size:18px;margin:25px 0}}td,th{{padding:12px 13px;border:1px solid #cbd5dc;text-align:left}}th{{background:#173a50;color:white}}td:first-child{{width:65px}}td:nth-child(3){{width:110px}}td:last-child{{width:65px}}tr:nth-child(even){{background:#f4f7f9}}.estado{{color:#13673f;font-weight:700}}.fuente{{font:13px/1.6 Consolas,monospace;overflow-wrap:anywhere;color:#52616b}}footer{{font-size:15px;margin-top:24px;color:#52616b}}</style>
<div class="marca">TEXTICODE · RESULTADOS DE JEST</div><h1>{codigo} {html.escape(req['titulo'])}</h1><p>{html.escape(req['descripcion'])}</p>
<p class="sub">{AUTOR} · Ficha {FICHA}<br>Entorno local · B = rutas y servicios del backend · F = componentes Vue</p>
<table><tr><th>Capa</th><th>Caso ejecutado</th><th>Estado</th><th>ms</th></tr>{filas}</table>
<p><b>{len(tests)} casos · {sum(r['estado']=='passed' for r in tests)} aprobados</b></p>
<div class="fuente">{'<br>'.join(evidencias)}</div><footer>Reporte HTML generado a partir de los archivos originales de Jest. La captura de esta página es evidencia del reporte; no representa una terminal, una sesión real en Google ni una ejecución en AWS.</footer></html>'''
        texto = texto.replace('font:18px/1.45', 'font:22px/1.45').replace('font-size:18px;', 'font-size:22px;')
        texto = texto.replace('Entorno local ·', f'Parte {inicio//6+1} · Casos {inicio+1} a {min(inicio+6,len(todos))} de {len(todos)} · Entorno local ·')
        (EV/f'{codigo}{sufijo}.html').write_text(texto, encoding='utf-8')
        links.append(f'<li><a href="{codigo}{sufijo}.html">{codigo} {html.escape(req["titulo"])} parte {inicio//6+1}</a></li>')
    (EV/'indice.html').write_text('<!doctype html><meta charset="utf-8"><h1>Evidencias Jest Texticode</h1><p>Resultados locales originales y reportes por requisito.</p><ul>'+''.join(links)+'</ul>',encoding='utf-8')
    print(f'Preparados {len(CODIGOS)} reportes y {len(registros)} casos')

def pdf():
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    fuentes, registros = datos()
    fontdir = Path('C:/Windows/Fonts')
    pdfmetrics.registerFont(TTFont('Texto', str(fontdir/'arial.ttf')))
    pdfmetrics.registerFont(TTFont('TextoBold', str(fontdir/'arialbd.ttf')))
    pdfmetrics.registerFontFamily('Texto', normal='Texto', bold='TextoBold', italic='Texto', boldItalic='TextoBold')
    styles = getSampleStyleSheet()
    for key in ['Normal','BodyText','Title','Heading1','Heading2','Heading3']:
        styles[key].fontName='Texto'; styles[key].textColor=colors.black
    styles['Normal'].fontSize=10.5; styles['Normal'].leading=15
    styles['Title'].fontName='TextoBold'; styles['Title'].fontSize=28; styles['Title'].leading=34
    styles['Heading1'].fontName='TextoBold'; styles['Heading1'].fontSize=17; styles['Heading1'].leading=22; styles['Heading1'].spaceAfter=14
    styles['Heading2'].fontName='TextoBold'; styles['Heading2'].fontSize=13; styles['Heading2'].leading=18
    styles.add(ParagraphStyle(name='Pequeno',fontName='Texto',fontSize=8,leading=11,spaceAfter=6))
    styles.add(ParagraphStyle(name='Codigo',fontName='Courier',fontSize=8.5,leading=12,spaceBefore=10,spaceAfter=12))
    def p(text,style='Normal'): return Paragraph(text,styles[style])
    def table(rows, widths):
        t=Table([[p(str(c),'Pequeno') for c in row] for row in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce8ef')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#D9D9D9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
        return t
    ancho=504
    story=[]
    total=sum(d['numTotalTests'] for d in fuentes.values())
    passed=sum(d['numPassedTests'] for d in fuentes.values())
    fallidas=sum(d['numFailedTests'] for d in fuentes.values())
    story += [Spacer(1,30),p('SENA · Análisis y Desarrollo de Software ADSO','Pequeno'),Spacer(1,34),p('TEXTICODE','Title'),p('Sistema de gestión de producción textil'),Spacer(1,22),p('Informe de pruebas con Jest','Heading1'),p('Pruebas unitarias de rutas y servicios y pruebas de componentes por requisito funcional'),Spacer(1,30)]
    story.append(table([['Integrante',AUTOR],['Ficha',FICHA],['Módulos','Autenticación · Google Calendar para tres roles · Operario Mis tareas · Operario Historial'],['Requisitos','RF-001 a RF-007, RF-044 a RF-047 y RF-055 a RF-062'],['Fecha','8 de noviembre de 2026'],['Resultados locales',f'{passed} aprobadas de {total} ejecutadas; {fallidas} fallidas'],['AWS','Un caso preparado. Ejecución y captura pendientes.']], [112,392]))
    story += [Spacer(1,22),p('Versión para revisión con resultados locales verificados. La entrega queda pendiente de completar con la evidencia del único caso en AWS.','Pequeno'),PageBreak()]
    titulos=['1 Introducción y objetivo','2 Estrategia y herramientas','3 Preparación del entorno','4 Pruebas por requisito funcional','5 Ejecución de las pruebas del backend local','6 Ejecución de las pruebas del frontend local','7 Prueba de integración en el servidor AWS EC2','8 Resultados y matriz de trazabilidad','9 Conclusiones']
    story += [p('Contenido','Heading1')]
    for titulo in titulos: story += [p(titulo),Spacer(1,13)]
    story += [Spacer(1,20),p('La organización sigue el informe de Kevin Wagner proporcionado como referencia. Los casos, resultados y evidencias de este documento corresponden al trabajo de Camilo y a la copia local revisada.','Pequeno'),PageBreak()]
    story += [p(titulos[0],'Heading1'),p('Este informe documenta las pruebas automatizadas de los 19 requisitos asignados de Texticode. El objetivo es verificar comportamientos normales, validaciones y restricciones de acceso, relacionar cada caso con su requisito y conservar resultados reproducibles con evidencias.'),Spacer(1,12),p(f'La ejecución local registra {total} casos y {passed} aprobados. El caso de integración RF-001 está preparado para ejecutarse dentro de AWS Windows; no se contabiliza como ejecutado ni aprobado mientras falten su resultado y su captura.'),Spacer(1,14),p('Requisitos asignados','Heading2')]
    story.append(table([['Código','Requisito']]+[[c,requisitos[c]['titulo']] for c in CODIGOS],[65,439]))
    story += [PageBreak(),p(titulos[1],'Heading1'),table([['Tipo','Entorno','Herramientas','Alcance'],['Backend','Local','Jest 30.5.2 y Supertest','Rutas Express, JWT reales, validaciones y llamadas a base de datos simulada'],['Frontend','Local','Jest 29 y Vue Test Utils con jsdom','Vistas reales, Pinia, router y respuestas externas simuladas'],['Integración','AWS Windows','Jest 30 y fetch','Un único login real contra el backend de la instancia']], [77,62,135,230]),Spacer(1,16),p('Decisiones de diseño de las pruebas','Heading2'),p('Las pruebas locales no requieren arrancar el backend ni acceder a la base de datos real. Se reemplaza el módulo de conexión por respuestas controladas y se comprueban parámetros de usuario y empresa. Las rutas y los permisos se ejecutan con JWT firmados por el código real.'),Spacer(1,10),p('En las vistas se utiliza el componente real con su estado de Pinia. Se simulan la API, fetch, el lienzo decorativo y los temporizadores. Los casos de Calendar se repiten para administrador, operario y cliente. RF-047 comprueba que solo el administrador recibe las funciones de gestión de vinculaciones.'),Spacer(1,10),p('La prueba de sincronización verifica que un evento existente se actualiza con PATCH y que uno nuevo se crea con POST. Esto comprueba la lógica de la aplicación frente a respuestas controladas; no certifica el funcionamiento del servicio de Google en producción.'),Spacer(1,10),p('Las capturas incorporadas son capturas del reporte HTML de resultados reales de Jest, generado desde los JSON originales. No son capturas de la consola ni de una interacción real con los proveedores. Cada captura identifica el archivo fuente, su fecha de ejecución y su huella SHA256.'),Spacer(1,14),p('Estructura de archivos','Heading2'),p('BACKEND/jest.config.js<br/>BACKEND/jest.aws.config.js<br/>BACKEND/__tests__/autenticacion.test.js<br/>BACKEND/__tests__/calendar.test.js<br/>BACKEND/__tests__/operario.test.js<br/>BACKEND/__tests__/aws/login-real.aws.test.js<br/>FRONTEND/jest.config.cjs y babel.config.cjs<br/>FRONTEND/tests/autenticacion.spec.js<br/>FRONTEND/tests/calendar.spec.js<br/>FRONTEND/tests/operario.spec.js<br/>pruebas-jest/evidencias y GUIA_PASO_A_PASO.md','Codigo'),PageBreak()]
    story += [p(titulos[2],'Heading1'),p('Paso 0 Verificación de Node y rama','Heading2'),p('Se verificó Node v24.14.0, npm 11.9.0 y la rama La-rama-de-Camilo. La instalación inicial tardó aproximadamente 14 minutos por las descargas de dependencias.'),Spacer(1,10),p('Paso 1 Instalación del backend','Heading2'),p('cd BACKEND<br/>npm install --save-dev jest@30 supertest','Codigo'),p('Se agregó el script test:jest con node --experimental-vm-modules y se mantuvo npm test para la suite anterior de node:test. La configuración local excluye la carpeta aws.'),Spacer(1,12),p('Paso 2 Instalación del frontend','Heading2'),p('cd FRONTEND<br/>npm install --save-dev jest@29 jest-environment-jsdom@29<br/>  @vue/test-utils@2 @vue/vue3-jest@29 babel-jest@29<br/>  @babel/core@7 @babel/preset-env@7','Codigo'),p('El comando de instalación completo y copiable está en la guía. Se usa Jest 29 por compatibilidad del transformador Vue. Babel sustituye import.meta.env solo en el entorno de pruebas.'),Spacer(1,12),p('Paso 3 Configuración y ejecución','Heading2'),p('Backend: entorno node, módulos ESM y rutas montadas con Supertest. Frontend: entorno jsdom, transformación de .vue y alias @/. Se ejecuta con --runInBand para obtener una salida secuencial. Los nombres de los casos incluyen su código RF.'),Spacer(1,10),p('Para repetir un requisito se agrega -t RF-xxx. Las pruebas que no coincidan con el filtro aparecerán como omitidas; no son fallos. Las dependencias exactas instaladas quedan registradas en package-lock.json de cada proyecto.'),PageBreak()]
    figuras = [(codigo, imagen) for codigo in CODIGOS for imagen in sorted(EV.glob(f'{codigo}-??.png'))]
    if set(c for c,_ in figuras) != set(CODIGOS): raise ValueError('Faltan capturas por requisito')
    for i,(codigo, imagen) in enumerate(figuras):
        req=requisitos[codigo]
        if i==0: story += [p(titulos[3],'Heading1')]
        story += [p(codigo+' '+req['titulo'],'Heading2'),p(html.escape(req['descripcion'])),Spacer(1,10)]
        tests=[r for r in registros if r['rf']==codigo]
        b=sum(r['capa']=='B' for r in tests); f=sum(r['capa']=='F' for r in tests)
        story += [p(f'Casos locales: backend {b}; frontend {f}. Resultado: {sum(r["estado"]=="passed" for r in tests)} de {len(tests)} aprobados.','Pequeno')]
        if not imagen.exists(): raise FileNotFoundError(imagen)
        iw,ih=ImageReader(str(imagen)).getSize()
        scale=min(ancho/iw, (485 if i==0 else 530)/ih)
        story += [Image(str(imagen),width=iw*scale,height=ih*scale,hAlign='LEFT'),Spacer(1,8),p(f'Figura {i+1}. Captura del reporte HTML de Jest para {codigo}. Los nombres y estados provienen de los archivos JSON conservados.','Pequeno'),PageBreak()]
    for capa,idx,archivo in [('B',4,'resultados-backend.json'),('F',5,'resultados-frontend.json')]:
        data=fuentes[capa]
        story += [p(titulos[idx],'Heading1'),p('Comando utilizado','Heading2'),p('npm run test:jest -- --runInBand --silent --json<br/>  --outputFile=../pruebas-jest/evidencias/'+archivo,'Codigo')]
        story += [table([['Dato','Resultado'],['Casos ejecutados',data['numTotalTests']],['Aprobados',data['numPassedTests']],['Fallidos',data['numFailedTests']],['Archivos de pruebas',len(data['testResults'])],['Entorno','Equipo local'],['Archivo fuente','pruebas-jest/evidencias/'+archivo]],[145,359]),Spacer(1,16)]
        if capa=='F':
            story += [p('Ajustes durante la preparación','Heading2'),p('El primer intento de las vistas registró 42 aprobaciones y 20 fallos en autenticación. Los fallos correspondían al entorno de prueba: restaurar temporizadores antes de desmontar el componente eliminaba cancelAnimationFrame y provocaba errores en cascada. Se añadieron las funciones de animación estables y la ruta simulada que utiliza el menú lateral.'),Spacer(1,10),p('Después quedó una expectativa de prueba que asumía redirección al panel propio al intentar abrir un panel ajeno. El código envía al login y el requisito exige impedir el acceso, por lo que se corrigió esa expectativa y se comprobó que la sesión se conserva. No se modificó código de producción para conseguir estos resultados.')]
        else: story += [p('Los casos positivos verifican autenticación, vínculos y operaciones de avance con respuestas controladas. Los negativos verifican campos ausentes, contraseña incorrecta, cuentas inactivas, permisos, cuota excedida y fases ya completadas. RF-058 y RF-059 se validan en frontend porque la clasificación visual, el porcentaje y los filtros de tareas se calculan en la vista.')]
        story += [Spacer(1,14),p('Las figuras de la sección 4 muestran el resultado individual por requisito. El CSV matriz-casos.csv permite consultar todos los casos y su ubicación en los archivos de prueba.','Pequeno'),PageBreak()]
    story += [p(titulos[6],'Heading1'),p('Estado pendiente de ejecución','Heading2'),p('Se preparó exactamente un caso de Jest: RF-001 AWS inicio de sesión real devuelve token y usuario sin contraseña. Sus aserciones verifican estado HTTP 200, existencia de token y usuario, estructura del JWT y ausencia de campos de contraseña. No hay otros casos AWS en el paquete.'),Spacer(1,12),p('Preparación y ejecución dentro del servidor','Heading2'),p('Copiar AWS_UNA_PRUEBA.zip a la instancia Windows y extraerlo en una carpeta propia. El backend debe estar encendido en localhost:3001. Desde PowerShell, en la carpeta extraída, ejecutar:'),p('.\\Ejecutar-AWS.ps1','Codigo'),p('El ejecutor instala Jest si falta, identifica el equipo y el fabricante, pide usuario y contraseña de manera oculta, ejecuta el único caso y conserva resultados-aws.json y ejecucion-aws.txt. No guarda la contraseña en archivos. La configuración AWS no carga el entorno simulado de las pruebas locales.'),Spacer(1,12),p('Evidencia necesaria para cerrar esta sección','Heading2'),p('Incorporar el JSON real y una captura legible con la ventana de Escritorio remoto, el nombre del equipo y Tests: 1 passed, 1 total. Si el caso falla, documentar el error y corregir la causa antes de repetirlo. No incluir credenciales ni tokens en las imágenes.'),Spacer(1,12),p('La conexión a localhost por sí sola no prueba que se esté dentro de EC2. El contexto de ejecución del servidor y su evidencia deben conservarse junto con el resultado. Mientras no estén disponibles, esta sección no afirma que la integración se haya ejecutado o aprobado.'),PageBreak()]
    story += [p(titulos[7],'Heading1'),table([['Suite','Ejecutadas','Aprobadas','Fallidas'],['Backend local',fuentes['B']['numTotalTests'],fuentes['B']['numPassedTests'],fuentes['B']['numFailedTests']],['Frontend local',fuentes['F']['numTotalTests'],fuentes['F']['numPassedTests'],fuentes['F']['numFailedTests']],['AWS','0 de 1 prevista','Pendiente','Sin ejecución'],['Total local',total,passed,fallidas]],[170,110,110,114]),Spacer(1,15),p('Matriz de trazabilidad','Heading2')]
    rows=[['Código','Requisito','B','F','AWS']]
    for c in CODIGOS:
        tests=[r for r in registros if r['rf']==c]
        rows.append([c,requisitos[c]['titulo'],sum(r['capa']=='B' for r in tests),sum(r['capa']=='F' for r in tests),'Pend.' if c=='RF-001' else '-'])
    story += [table(rows,[60,290,35,35,84]),Spacer(1,15),p('Los conteos son casos de Jest, no cantidad de requisitos. Cada caso se relaciona con un único RF. Una aprobación local representa el comportamiento comprobado con datos controlados; no implica cobertura total de todas las posibles condiciones del sistema.','Pequeno'),PageBreak()]
    story += [p(titulos[8],'Heading1'),p(f'Los 19 requisitos asignados cuentan con casos automatizados de Jest. La ejecución local final registra {passed} aprobaciones de {total} casos, con {fallidas} fallos. Se conserva la separación entre rutas del backend y componentes del frontend.'),Spacer(1,12),p('Las pruebas comprueban credenciales, permisos por rol, recuperación, cierre de sesión, Calendar para tres perfiles, tareas, avance por cuota, notas e historial. Los archivos de resultados y la matriz permiten repetir un caso y vincularlo con la evidencia correspondiente.'),Spacer(1,12),p('El caso de integración real está preparado y debe ejecutarse dentro del servidor AWS. El informe requiere completar esa evidencia antes de presentarse como entrega final. No se trasladaron los resultados ni las capturas del compañero como propios.'),Spacer(1,20),p('Fuentes y archivos de respaldo','Heading2'),p('Requisitos_Funcionales_Texticode_por_vista.docx, documento aportado por el usuario.<br/>Informe_Pruebas_Jest_Texticode_Kevin_Wagner.pdf, referencia de organización.<br/>resultados-backend.json y resultados-frontend.json, salidas originales de Jest.<br/>matriz-casos.csv y RF-xxx.html/png, evidencias generadas desde esas salidas.','Pequeno'),p('Jest ESM: https://jestjs.io/docs/30.0/ecmascript-modules<br/>Transformador Vue Jest: https://github.com/vuejs/vue-jest','Pequeno')]
    out=ROOT/'output/pdf'; out.mkdir(parents=True,exist_ok=True)
    target=out/'Informe_Pruebas_Jest_Texticode_Camilo_Tibambre.pdf'
    def pagina(canvas, document):
        canvas.saveState(); canvas.setFont('Texto',8); canvas.setFillColor(colors.HexColor('#52616b'))
        if document.page>1:
            canvas.drawString(54,756,'Texticode · Informe de pruebas con Jest')
            canvas.drawString(54,37,AUTOR+' · Ficha '+FICHA)
            canvas.drawRightString(558,37,'Página '+str(document.page))
        canvas.restoreState()
    SimpleDocTemplate(str(target),pagesize=(612,792),leftMargin=54,rightMargin=54,topMargin=58,bottomMargin=58,title='Informe de pruebas con Jest Texticode',author=AUTOR).build(story,onFirstPage=pagina,onLaterPages=pagina)
    print(target)

if __name__=='__main__':
    if '--preparar' in sys.argv: preparar()
    if '--pdf' in sys.argv: pdf()
