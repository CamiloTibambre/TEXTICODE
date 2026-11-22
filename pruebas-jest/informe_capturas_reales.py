"""Informe final: casos originales de Jest y capturas reales de consola."""
from pathlib import Path
from html import escape
import json, hashlib, csv, zipfile
from generar_informe import ROOT, BASE, AUTOR, FICHA, CODIGOS, requisitos, datos
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage
from reportlab.platypus.tableofcontents import TableOfContents

CAP=BASE/'capturas-reales'
OUT=ROOT/'output/pdf/Informe_Pruebas_Jest_Texticode_Camilo_Tibambre.pdf'
pdfmetrics.registerFont(TTFont('ArialInforme','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialInformeB','C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('ArialInforme',normal='ArialInforme',bold='ArialInformeB',italic='ArialInforme',boldItalic='ArialInformeB')
S=getSampleStyleSheet()
for n in ['Normal','Title','Heading1','Heading2','Heading3']:
    S[n].fontName='ArialInforme';S[n].textColor=colors.HexColor('#172b3a')
S['Normal'].fontSize=10;S['Normal'].leading=14;S['Normal'].spaceAfter=8
for n,z,l in [('Title',29,36),('Heading1',18,24),('Heading2',13,18)]:
    S[n].fontName='ArialInformeB';S[n].fontSize=z;S[n].leading=l;S[n].spaceAfter=12
S.add(ParagraphStyle(name='SmallI',fontName='ArialInforme',fontSize=8.5,leading=11,spaceAfter=7))
S.add(ParagraphStyle(name='CodeI',fontName='Courier',fontSize=8,leading=11,spaceAfter=10,backColor=colors.HexColor('#f0f4f7'),borderPadding=7))
W=504
story=[]; figures=[]
def p(t,style='Normal'):return Paragraph(t,S[style])
def text(t,style='Normal'):story.append(p(t,style))
def heading(t):text(t,'Heading1')
def page():story.append(PageBreak())
def code(t):text(escape(t).replace('\n','<br/>'),'CodeI')
def table(rows,widths):
    t=Table([[p(escape(str(c)),'SmallI') for c in r] for r in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e3edf3')),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#cdd7df')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    story.append(t);story.append(Spacer(1,9))
def figure(name,caption,maxh=335):
    path=CAP/(name+'.png')
    if not path.exists():raise FileNotFoundError(path)
    iw,ih=PILImage.open(path).size
    scale=min(W/iw,maxh/ih)
    num=len(figures)+1;figures.append((num,name,caption))
    story.append(KeepTogether([Image(str(path),width=iw*scale,height=ih*scale),Spacer(1,6),p(f'<b>Figura {num}.</b> '+escape(caption),'SmallI'),Spacer(1,7)]))
    return num

fuentes,registros=datos()
assert len(registros)==136 and all(r['estado']=='passed' for r in registros)
with (BASE/'evidencias/matriz-casos.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['rf','capa','nombre','estado','ms','archivo']);w.writeheader();w.writerows(registros)

story.extend([Spacer(1,36),p('SENA | Análisis y Desarrollo de Software','SmallI'),Spacer(1,45),p('TEXTICODE','Title'),p('Informe de pruebas con Jest','Heading1'),p('Autenticación · Google Calendar · Operario: Mis tareas e Historial'),Spacer(1,35)])
table([['Datos de la entrega','Información'],['Aprendiz',AUTOR],['Ficha',FICHA],['Fecha','8 de noviembre de 2026'],['Alcance','19 requisitos funcionales'],['Local','136 casos aprobados: 74 backend y 62 frontend'],['AWS Windows EC2','1 caso de integración aprobado'],['Total','137 casos aprobados; 0 fallidos']], [125,379])
text('Informe documentado con capturas reales de pantalla y resultados originales de Jest. La estructura sigue las nueve secciones del informe de referencia de Kevin Wagner.','SmallI')
page()
heading('Contenido')
titulos=['1 Introducción y objetivo','2 Estrategia y herramientas','3 Preparación del entorno','4 Pruebas por requisito funcional','5 Ejecución de las pruebas del backend local','6 Ejecución de las pruebas del frontend local','7 Prueba de integración en el servidor AWS EC2','8 Resultados y matriz de trazabilidad','9 Conclusiones']
toc=TableOfContents()
toc.levelStyles=[ParagraphStyle(name='IndiceI',fontName='ArialInforme',fontSize=11,leading=16,spaceBefore=12)]
story.append(toc);story.append(Spacer(1,22))
text('La sección 4 presenta, para cada RF, su descripción, los casos ejecutados, las comprobaciones y la captura de la consola. Las secciones 5 y 6 contienen los resúmenes completos; la sección 7 incorpora la captura original aportada desde AWS.','SmallI')
page();heading(titulos[0])
text('El objetivo es comprobar los comportamientos definidos para los módulos asignados de Texticode mediante pruebas automatizadas con Jest y conservar evidencias verificables de su ejecución. Se comprueban respuestas correctas, validaciones, permisos, errores y comportamientos de las vistas.')
table([['Módulo','Requisitos'],['Autenticación','RF-001 a RF-007'],['Google Calendar: administrador, operario y cliente','RF-044 a RF-047'],['Operario - Mis tareas','RF-055 a RF-061'],['Operario - Historial','RF-062']], [270,234])
text('La definición de cada RF procede del documento Requisitos_Funcionales_Texticode_por_vista.docx. Las tablas de casos corresponden a los nombres y estados guardados por Jest; las capturas muestran ejecuciones reales de los mismos archivos.')
text('Se ejecutaron 136 casos locales y un único caso real dentro de AWS. Volver a ejecutar los filtros locales para capturar la evidencia no agrega casos nuevos al total de 137.')
page();heading(titulos[1])
table([['Herramienta','Uso'],['Jest 30.5.2 + Supertest 7.3.2','Backend: solicitudes a rutas Express, autenticación, permisos y servicios.'],['Jest 29.7.0 + Vue Test Utils','Frontend: montaje de componentes Vue y comprobación de interacción y estado.'],['jsdom, vue3-jest y Babel','Entorno de navegador simulado y transformación de componentes.'],['Jest en Windows sobre Amazon EC2','Un caso real de login contra el backend de la instancia.'],['PowerShell y JSON de Jest','Ejecución visible, capturas originales y trazabilidad de los casos.']], [190,314])
text('En local se montan rutas y componentes reales, con base de datos, correo y respuestas externas simulados. Esto permite comprobar la lógica de forma repetible sin modificar registros de negocio. Las pruebas de Calendar abarcan los tres roles; sus respuestas de Google están simuladas.')
text('Estas pruebas no equivalen a una sesión manual real en Google Calendar ni certifican todas las conexiones externas. El caso AWS sí envía una solicitud real de login. Las aserciones múltiples dentro de ese caso siguen contando como una sola prueba.')
text('Las capturas por RF usan el filtro -t RF-xxx. Jest muestra como skipped los casos de otros requisitos: son omitidos por el filtro, no fallidos. --silent oculta mensajes de la aplicación y --verbose=false conserva un resumen legible. Los nombres de cada caso se documentan en la tabla correspondiente.')
page();heading(titulos[2]);text('Paso 0. Verificar versiones y rama','Heading2')
code('node --version\nnpm --version\ngit branch --show-current')
figure('02-entorno','Versiones de Node, npm y rama activa del proyecto.')
text('Paso 1. Revisar el proyecto y los archivos','Heading2')
text('Se agregaron suites locales separadas para autenticación, Calendar y operario en BACKEND/__tests__ y FRONTEND/tests; el caso de AWS permanece separado para evitar incluirlo en la ejecución local.')
page();text('Paso 1. Proyecto abierto','Heading2')
figure('01-proyecto-abierto','Proyecto Texticode abierto en Visual Studio Code y servicio frontend iniciado.')
code('BACKEND/__tests__/autenticacion.test.js\nBACKEND/__tests__/calendar.test.js\nBACKEND/__tests__/operario.test.js\nFRONTEND/tests/autenticacion.spec.js\nFRONTEND/tests/calendar.spec.js\nFRONTEND/tests/operario.spec.js')
page();text('Paso 2. Instalar Jest en el backend','Heading2')
code('cd BACKEND\nnpm install --save-dev jest@30 supertest\nnpm ls jest supertest --depth=0')
text('La instalación se realizó al preparar el proyecto. La siguiente captura verifica las versiones efectivamente instaladas; no se presenta como una captura histórica del comando de instalación.')
figure('04-backend-instalado','Verificación real de Jest y Supertest instalados en el backend.',260)
page();text('Paso 3. Preparar las vistas Vue','Heading2')
code('cd FRONTEND\nnpm install --save-dev jest@29 jest-environment-jsdom@29\n  @vue/test-utils@2 @vue/vue3-jest@29 babel-jest@29\n  @babel/core@7 @babel/preset-env@7')
text('El comando anterior se escribe en una sola línea. Se usa Jest 29 por compatibilidad con vue3-jest 29. jsdom proporciona el entorno del navegador para las pruebas de los componentes.')
figure('05-frontend-instalado','Verificación de las dependencias de pruebas del frontend.')
page();text('Paso 4. Configurar y separar las ejecuciones','Heading2')
text('BACKEND/jest.config.js selecciona únicamente las pruebas locales; jest.aws.config.js selecciona el único caso AWS. FRONTEND/jest.config.cjs configura Vue, jsdom y las transformaciones necesarias para importar los componentes.')
figure('06-configuracion','Contenido real de la configuración de Jest del backend y frontend.',400)
code('npm run test:jest -- --runInBand\nnpm run test:jest -- --runInBand -t RF-001')
text('Los comandos se ejecutan desde la carpeta BACKEND o FRONTEND. El primero ejecuta la suite local completa; el segundo permite revisar un requisito concreto. En RF-058 y RF-059 los casos están en las vistas.')
page();heading(titulos[3])
text('Cada caso de la tabla incluye la comprobación que debe cumplirse: el estado PASS significa que las expectativas del caso coincidieron con el comportamiento observado. B identifica backend y F identifica frontend. Los resultados se toman de la ejecución completa guardada en JSON.')
table([['Elemento','Interpretación'],['Condición inicial','Datos ficticios y respuestas simuladas preparados por los helpers antes de cada caso.'],['Acción y resultado esperado','Se describen en el nombre de cada prueba de la tabla.'],['Resultado observado','PASS: se cumplieron las aserciones; la consola confirma los casos aprobados por capa.'],['Evidencia','Captura real por RF y JSON originales de las ejecuciones completas.']], [130,374])
for rf in CODIGOS:
    page();req=requisitos[rf];heading(rf+' '+req['titulo'])
    text('<b>Requerimiento:</b> '+escape(req['descripcion']))
    rs=[r for r in registros if r['rf']==rf]
    for capa,label in [('B','Backend'),('F','Frontend')]:
        sub=[r for r in rs if r['capa']==capa]
        if not sub:continue
        text(label+' - casos y resultados','Heading2')
        rows=[['Caso','Acción y comprobación esperada','Estado']]
        for i,r in enumerate(sub,1):
            name=r['nombre']
            # Conserva el título completo del caso para trazabilidad exacta.
            rows.append([f'{rf}-{capa}{i:02}',name,'PASS'])
        table(rows,[76,380,48])
    nb=sum(r['capa']=='B' for r in rs);nf=sum(r['capa']=='F' for r in rs)
    text(f'<b>Resultado local:</b> {len(rs)} casos aprobados ({nb} backend y {nf} frontend), sin fallos.')
    figure(rf,'Ejecución real filtrada de '+rf+'. Los casos de otros RF se omiten por el filtro.',335)
page();heading(titulos[4])
code('cd BACKEND\nnpm run test:jest -- --runInBand')
text('Se ejecutan los tres archivos locales: autenticacion.test.js, calendar.test.js y operario.test.js. El caso AWS queda fuera de esta selección. El resultado completo se conserva en evidencias/resultados-backend.json.')
figure('resumen-backend','Resumen real de la ejecución completa del backend local: 74 casos aprobados.',360)
text('Resultado: 3 suites aprobadas, 74 pruebas aprobadas, 0 fallidas. Las pruebas de rutas usan Supertest y dobles de los servicios externos, con validaciones de acceso y contenido de respuestas.')
page();heading(titulos[5])
code('cd FRONTEND\nnpm run test:jest -- --runInBand')
text('Se ejecutan autenticacion.spec.js, calendar.spec.js y operario.spec.js. Se montan las vistas y se comprueban entradas, navegación, estados, filtros y respuestas de interacción. El resultado completo se conserva en evidencias/resultados-frontend.json.')
figure('resumen-frontend','Resumen real de la ejecución completa del frontend local: 62 casos aprobados.',360)
text('Resultado: 3 suites aprobadas, 62 pruebas aprobadas, 0 fallidas. Durante la preparación se ajustaron los temporizadores del entorno de prueba y el objeto simulado de ruta. La expectativa sobre la redirección por rol se alineó con el comportamiento del router y el requisito de impedir acceso al rol incorrecto.')
page();heading(titulos[6])
text('Se seleccionó RF-001: inicio de sesión real en el backend de Windows sobre Amazon EC2. El archivo login-real.aws.test.js contiene un único test: comprobar el login, la presencia de token y usuario, y la ausencia de la contraseña en la respuesta.')
code('cd C:\\Users\\Administrator\\Desktop\\AWS_UNA_PRUEBA\n.\\Ejecutar-AWS.ps1')
text('El paquete aislado instala las dependencias necesarias y solicita las credenciales de una cuenta de prueba. La contraseña se introduce de forma enmascarada. El backend debe estar iniciado en la instancia.')
figure('aws-ejecucion','Captura original suministrada por Camilo de la ejecución dentro de AWS Windows: 1 suite y 1 prueba aprobadas.',350)
text('La evidencia muestra fabricante Amazon EC2, equipo EC2AMAZ-DFPCMF1, fecha 2026-11-08 21:28:52 +00:00, archivo __tests__/aws/login-real.aws.test.js, Tests: 1 passed, 1 total y tiempo 1.186 s. La fecha equivale a las 16:28:52 en Colombia.')
text('El resultado AWS se documenta con la captura original aportada por el aprendiz. En esta revisión no se recibió el archivo resultados-aws.json; su contenido no se ha verificado. No se volvió a ejecutar el caso AWS para preparar las capturas locales.','SmallI')
page();heading(titulos[7])
table([['Entorno','Suites','Casos','Aprobados','Fallidos'],['Backend local','3','74','74','0'],['Frontend local','3','62','62','0'],['AWS real','1','1','1','0'],['Total','7','137','137','0']], [180,65,85,87,87])
text('Matriz de trazabilidad','Heading2')
rows=[['RF','Requerimiento','B','F','AWS']]
for rf in CODIGOS:
    rs=[r for r in registros if r['rf']==rf]
    rows.append([rf,requisitos[rf]['titulo'],sum(r['capa']=='B' for r in rs),sum(r['capa']=='F' for r in rs),1 if rf=='RF-001' else 0])
table(rows,[58,296,45,45,60])
text('La matriz detalla el número de casos por requisito y capa. RF-001 tiene además el caso AWS. Las ejecuciones por filtro y las ejecuciones completas corresponden a los mismos casos y no se suman de nuevo.')
page();text('Fuentes, evidencias y límites','Heading2')
text('Los 136 casos locales están registrados individualmente en matriz-casos.csv y en los dos JSON originales de Jest. Las imágenes PNG se conservan en capturas-reales. El anexo de evidencias permite consultar las capturas a resolución original.')
for name in ['resultados-backend.json','resultados-frontend.json']:
    path=BASE/'evidencias'/name
    text(escape(name)+'<br/>SHA-256: '+hashlib.sha256(path.read_bytes()).hexdigest(),'SmallI')
text('La cobertura documentada es funcional por casos y por RF. No se presenta un porcentaje de cobertura de líneas. Las simulaciones de Google, correo y base de datos no demuestran disponibilidad de esas plataformas ni sustituyen pruebas reales de sus servicios.')
text('Los resultados aprobados se limitan a las condiciones incluidas en las tablas. No se modificó el código de producción para forzar los resultados de las pruebas. La captura AWS conserva los avisos de dependencias y el aviso experimental de Node que aparecieron durante su ejecución.','SmallI')
page();heading(titulos[8])
text('Se documentaron los 19 requisitos asignados mediante 136 casos locales aprobados y un caso de integración aprobado dentro de AWS Windows EC2, para un total de 137. Las tablas vinculan cada caso con su requisito y la captura correspondiente confirma la ejecución visible.')
text('Las pruebas de autenticación comprueban acceso, validaciones, sesión y permisos. Calendar incluye administrador, operario y cliente con respuestas externas simuladas. Mis tareas e Historial cubren consultas, filtros, avances, notas y presentación según los casos detallados.')
text('La separación entre pruebas locales y AWS permite repetir la suite de desarrollo y conservar un único caso real en el servidor. Las capturas originales, los archivos JSON y la matriz CSV permiten revisar y reproducir los resultados.')
text('Relación de capturas','Heading2')
table([['Figura','Archivo PNG','Evidencia']]+[[n,name+'.png',cap] for n,name,cap in figures],[43,155,306])

def footer(c,d):
    c.setStrokeColor(colors.HexColor('#cbd8e1'));c.line(54,42,558,42)
    c.setFont('ArialInforme',8);c.setFillColor(colors.HexColor('#526574'))
    c.drawString(54,29,'TEXTICODE | Pruebas Jest | Ficha 3278639');c.drawRightString(558,29,str(d.page))
OUT.parent.mkdir(exist_ok=True,parents=True)
class InformeDoc(SimpleDocTemplate):
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and f.getPlainText() in titulos:
            self.notify('TOCEntry',(0,f.getPlainText(),self.page))
InformeDoc(str(OUT),pagesize=(612,792),leftMargin=54,rightMargin=54,topMargin=48,bottomMargin=57,title='Informe de pruebas Jest Texticode',author=AUTOR).multiBuild(story,onFirstPage=footer,onLaterPages=footer)
manifest=[{'figura':n,'archivo':name+'.png','descripcion':cap,'sha256':hashlib.sha256((CAP/(name+'.png')).read_bytes()).hexdigest()} for n,name,cap in figures]
(CAP/'indice-capturas.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(OUT.parent/'Anexo_Evidencias_Jest_Camilo_Tibambre.zip','w',zipfile.ZIP_DEFLATED) as z:
    for _,name,_ in figures:z.write(CAP/(name+'.png'),'capturas/'+name+'.png')
    z.write(CAP/'indice-capturas.json','indice-capturas.json')
    for name in ['resultados-backend.json','resultados-frontend.json','matriz-casos.csv']:
        z.write(BASE/'evidencias'/name,'resultados/'+name)
print(json.dumps({'archivo':str(OUT),'capturas':len(figures),'casos_locales':len(registros),'aws':1},ensure_ascii=False))
