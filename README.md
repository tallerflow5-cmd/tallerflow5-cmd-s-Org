# TallerFlow — Sistema de Gestión Operativa para Taller de Reparación de Electrodomésticos

MVP funcional y modular para la gestión integral del flujo de trabajo en talleres de reparación y servicio técnico de línea blanca multimarca (**LG**, **Samsung**, **Whirlpool**, **Mabe**, etc.). Cubre el ciclo de vida completo de las órdenes de servicio técnico, inventario de repuestos con descuento automático, cotización de presupuestos, cobro de saldos, comprobantes de garantía imprimibles, historial por cliente/equipo e ingesta digital inteligente (OCR) inspirada en **Paperless-ngx**.

---

## 1. Estructura del Proyecto y Justificación de Decisiones Técnicas

### Estructura de Directorios:
```
├── server.ts                       # Backend Express con endpoint Gemini OCR y Vite middleware
├── index.html                      # Punto de entrada HTML con meta tags y tipografías optimizadas
├── metadata.json                   # Metadatos del applet y declaración de capacidades del servidor
├── package.json                    # Dependencias y scripts de ejecución
├── src/
│   ├── main.tsx                    # Montaje de React 19
│   ├── App.tsx                     # Orquestador principal, navegación y gestión de modales
│   ├── index.css                   # Tailwind CSS v4, directiva dark variant y estilos de impresión
│   ├── types/
│   │   └── taller.ts               # Modelos de datos TypeScript (Cliente, Equipo, Orden, etc.)
│   ├── store/
│   │   ├── seedData.ts             # Semilla inicial con casos reales de línea blanca
│   │   └── tallerStore.ts          # Store reactivo con persistencia local y lógica de negocio
│   ├── utils/
│   │   └── formatters.ts           # Formateo de moneda colombiana (COP) y fechas amigables
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx          # Top Bar Contract con navegación y modo oscuro
│       │   └── Sidebar.tsx         # Barra lateral con indicadores numéricos de estado
│       ├── orders/
│       │   ├── OrdersDashboard.tsx # Vista Kanban y Tabla filtrable por técnico, estado y fecha
│       │   ├── NewOrderModal.tsx   # Recepción asistida de clientes y aparatos
│       │   └── OrderDetailModal.tsx# Ficha completa: Diagnóstico, Presupuesto, Pagos y Comprobante
│       ├── inventory/
│       │   └── InventoryView.tsx   # Catálogo de repuestos, alertas de stock y ajuste rápido
│       ├── customers/
│       │   └── CustomersView.tsx   # Directorio y trazabilidad histórica de servicios por cliente
│       ├── ocr/
│       │   └── PaperlessOCRView.tsx# Digitalización inteligente con visión multimodal Gemini
│       ├── testing/
│       │   └── TestSuiteView.tsx   # Suite de pruebas automatizadas en tiempo real
│       └── backup/
│           └── BackupView.tsx      # Exportación e importación de base de datos en JSON
```

### Justificación de Decisiones Técnicas:
1. **Frontend con React 19 + TypeScript + Tailwind CSS v4:** Proporciona tipado estricto para evitar errores en tiempo de ejecución en cálculos financieros y de stock. Tailwind v4 permite estilizar con fluidez para pantallas de recepción (escritorio) y tablets en banco de trabajo técnico.
2. **Persistencia Local con Respaldo JSON y Sin Dependencias Externas:**
   - Cumple con la restricción de MVP ágil y portabilidad: el taller puede operar de inmediato sin configurar PostgreSQL o Docker previamente, con persistencia en el navegador y capacidad de exportar e importar copias de seguridad completas en formato JSON estándar en cualquier momento.
3. **Servidor Full-Stack Express con Gemini Multimodal:**
   - Para el escaneo OCR estilo Paperless-ngx, se utiliza `@google/genai` en el servidor con el modelo `gemini-3.8-flash`. Permite procesar tanto órdenes manuscritas viejas como facturas de proveedores con extracción JSON estructurada y segura sin exponer claves en el cliente.
4. **Descuento Atómico de Inventario:**
   - El descuento de stock ocurre en el momento exacto en que el cliente aprueba el presupuesto, garantizando que ninguna pieza salga de bodega sin una orden de servicio que la respalde.

---

## 2. Modelo de Datos y Entidades Principales

```
┌─────────────────┐       ┌─────────────────┐
│     Cliente     │ 1   * │     Equipo      │
│─────────────────│───────│─────────────────│
│ id              │       │ id              │
│ nombre          │       │ clienteId       │
│ documento (DNI) │       │ tipo            │
│ telefono        │       │ marca           │
│ email           │       │ modelo          │
│ direccion       │       │ numeroSerie     │
└─────────────────┘       └─────────────────┘
         │                         │
         │ 1                       │ 1
         │                         │
         │           *             │
         └─────────────►┌───────────────────────┐
                        │  Orden de Reparación  │
                        │───────────────────────│
                        │ id, codigo (OT-00101) │
                        │ clienteId, equipoId   │
                        │ tecnicoId             │
                        │ estado                │
                        │ fallaReportada        │
                        │ prioridad             │
                        │ fechaIngreso          │
                        │ fechaPrometida        │
                        │ fechaEntrega          │
                        └───────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │ 1                       │ 1                       │ 1
         ▼ *                       ▼ 1                       ▼ *
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  NotaTecnica    │       │   Presupuesto   │       │      Pago       │
│─────────────────│       │─────────────────│       │─────────────────│
│ id              │       │ id              │       │ id              │
│ ordenId         │       │ ordenId         │       │ ordenId         │
│ tecnicoId       │       │ estado          │       │ monto           │
│ tipoNota        │       │ manoDeObra      │       │ metodoPago      │
│ contenido       │       │ total           │       │ fecha           │
│ fecha           │       │ fechaRespuesta  │       │ referencia      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │
                                   │ 1
                                   ▼ *
                          ┌─────────────────┐       ┌─────────────────┐
                          │  ItemRepuesto   │ *   1 │    Repuesto     │
                          │─────────────────│───────│─────────────────│
                          │ id              │       │ id, codigo      │
                          │ presupuestoId   │       │ nombre, marca   │
                          │ repuestoId      │       │ categoria       │
                          │ cantidad        │       │ stockActual     │
                          │ precioUnitario  │       │ stockMinimo     │
                          │ subtotal        │       │ precioCosto/Vta │
                          └─────────────────┘       └─────────────────┘
```

### Estados del Ciclo de Vida:
- `recibido`: Ingreso formal del electrodoméstico en recepción.
- `en_diagnostico`: Técnico asignado evaluando componentes y fallas.
- `esperando_aprobacion`: Presupuesto emitido, pendiente de confirmación del cliente.
- `en_reparacion`: Presupuesto aprobado, stock descontado y trabajo en curso.
- `esperando_repuesto`: Pausa operativa por falta de pieza en bodega.
- `listo_entrega`: Trabajo finalizado y verificado mediante pruebas.
- `entregado`: Retirado por el cliente con saldo liquidado.
- `cancelado`: Presupuesto rechazado o servicio desestimado.

---

## 3. Instrucciones de Instalación y Ejecución Local

### Requisitos Previos:
- Node.js versión 18 o superior.
- Gestor de paquetes npm.

### Pasos:
1. Clonar el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd tallerflow
   ```
2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Configurar variables de entorno (opcional para escaneo OCR con Gemini):
   ```bash
   cp .env.example .env
   # En .env definir GEMINI_API_KEY si desea habilitar el escaneo OCR en vivo
   ```
4. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir el navegador en `http://localhost:3000`.

---

## 4. Pruebas de los Flujos Principales

El proyecto incluye un módulo interactivo en la interfaz (`Suite de Pruebas`) que ejecuta en tiempo real y valida:
1. **Flujo de Creación de Orden:** Alta simultánea de cliente nuevo, electrodoméstico y asignación de código correlativo `OT-XXXXX` en estado inicial `recibido`.
2. **Flujo de Transición de Estados:** Avance controlado `recibido` $\rightarrow$ `en_diagnostico` $\rightarrow$ `esperando_aprobacion` con registro de fecha de diagnóstico y notas en la bitácora.
3. **Flujo de Presupuesto y Descuento de Stock:** Cotización con mano de obra y repuesto de catálogo; al hacer clic en `Aprobar Presupuesto`, se verifica que el stock del repuesto disminuye de $N$ a $N - 1$ de forma atómica y el estado cambia a `en_reparacion`.
4. **Flujo de Pagos y Liquidación:** Registro de abono parcial, validación de disminución del saldo pendiente, registro de pago total por saldo restante y cierre a `entregado`.
5. **Flujo de Ingesta OCR:** Indexación de documentos físicos manuscritos o facturas de proveedores para incorporar órdenes o sumar existencias a inventario con 1 clic.
6. **Flujo de Conclusión con WhatsApp y Alerta Preventiva (9 a 12 meses):** Cierre de servicio en entrega, descarga de comprobante PDF oficial, generación de enlace de WhatsApp con garantía de 90 días y programación de alerta para mantenimiento de limpieza profunda y desinfección a 9-12 meses.

---

## 5. Comprobante PDF, WhatsApp y Motor de Retención Preventiva (9 a 12 Meses)

### A. Generación de Comprobante PDF, Firma Táctil en Canvas y WhatsApp (Protocolo wa.me)
- **Firma Táctil Digital (Canvas HTML5):** El cliente puede firmar directamente en pantalla táctil de celular, tablet o con el ratón al momento de retirar su electrodoméstico. La firma se digitaliza en Base64 con timestamp de conformidad y queda guardada en la orden, imprimiéndose en el comprobante oficial y mostrándose en la vista previa del recibo.
- **Botón "Enviar Resumen WhatsApp":** Abre el chat de WhatsApp (`https://wa.me/<telefono>?text=...`) con un mensaje estructurado y preconfigurado que contiene todo el informe de la reparación: código OT, electrodoméstico, serial, diagnóstico, repuestos instalados con valores, mano de obra, liquidación de pagos y póliza de garantía legal de 90 días.
- **Botón "Enviar PDF por WhatsApp":** Genera y descarga el comprobante formal en PDF oficial (con firma digital embebida) e inicia automáticamente la conversación en WhatsApp con un mensaje preconfigurado notificando al cliente sobre la entrega de su comprobante en PDF como soporte formal.
- **Comprobante Oficial:** Al concluir la reparación o desde la pestaña de comprobante, se genera el comprobante de entrega en formato PDF limpio con membrete del taller, datos del cliente, serial del electrodoméstico, desglose de repuestos sustituidos, liquidación de pagos, póliza de garantía legal de 90 días y firma gráfica del cliente.

### B. Motor de Retención y Fidelización (9 a 12 Meses)
- **Programación Inteligente:** Al entregar el equipo reparado, el taller puede configurar el intervalo preventivo entre 9 y 12 meses (por defecto 9 meses para limpieza de tina en lavadoras o serpentín en neveras; 12 meses para preventivo anual).
- **Alertas Integradas en el Tablero:** Un banner visual informa cuántos clientes han alcanzado el período sugerido para su mantenimiento.
- **Módulo de Retención Dedicado:** Permite filtrar por clientes próximos o vencidos, consultar el historial del servicio anterior y disparar mensajes de WhatsApp con plantillas de fidelización que ofrecen un 15% de descuento para agendar su mantenimiento preventivo.

---

## 6. Lista de lo que Queda Fuera del MVP y Próximos Pasos (Roadmap)

### Fuera del Alcance del MVP:
- Facturación electrónica fiscal directa con DIAN / AFIP / SAT.
- API oficial de WhatsApp Cloud de cobro por plantilla (se utiliza enlace nativo `wa.me` sin costo adicional).
- Contabilidad de partida doble o nómina de técnicos.
- Multi-taller o multi-sucursal centralizado.

### Siguientes Pasos Naturales (Post-MVP):
1. **Base de Datos Cloud Relacional (PostgreSQL / Cloud SQL):** Migración del store local a base de datos relacional para talleres con múltiples terminales en simultáneo.
2. **Portal de Autogestión para Clientes:** Consulta en línea del estado del equipo mediante código QR impreso en el comprobante de recepción.
3. **Firma Táctil en Recepción de Entrada:** Extender el componente `SignaturePad` al momento del ingreso físico del equipo.
4. **Notificaciones Push / WhatsApp:** Alertas automáticas cuando el presupuesto esté listo o cuando el equipo pase a `listo_entrega`.
