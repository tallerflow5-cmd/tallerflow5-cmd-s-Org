# TallerFlow — Sistema de Comprobantes PDF, Envío por WhatsApp y Retención con Alertas de Mantenimiento Preventivo (9-12 Meses)

Plan de arquitectura e implementación para cerrar el ciclo de servicio técnico con entrega digital (PDF descargable e imprimible + envío directo a WhatsApp del cliente) y activación automática de un motor de retención y fidelización con alertas inteligentes de mantenimiento preventivo (programables entre 9 y 12 meses) visible tanto en el tablero principal como en un nuevo módulo de fidelización.

> [!IMPORTANT]
> **Decisiones Confirmadas con el Usuario:**
> - **Opciones de Salida en la Entrega:** Ambas opciones integradas al marcar la orden como `entregado`:
>   1. Descarga/Impresión directa del comprobante oficial en formato PDF con póliza de garantía y firmas.
>   2. Botón directo de WhatsApp con mensaje personalizado y formateado que incluye número de orden, cliente, equipo, valor liquidado, vigencia de la garantía y contacto del taller.
> - **Intervalo de Recordatorio Preventivo:** Configurable por orden entre 9 y 12 meses (por defecto 9 meses para limpieza y desinfección de lavadoras / neveras, o 12 meses para revisión integral de componentes).
> - **Gestión de Alertas y Retención:** Doble presencia:
>   1. Widget/Banner de alerta inmediata en el Tablero de Órdenes (`OrdersDashboard`) alertando sobre clientes que requieren contacto preventivo esta semana/mes.
>   2. Módulo dedicado de **Retención & Mantenimientos Preventivos** con lista de clientes, estado del recordatorio (próximo, vencido, contactado), filtro por mes y botón directo de 1 clic para abrir WhatsApp con plantilla de fidelización y agendamiento.

---

## 1. Visión General y Flujo de Usuario

### A. Flujo de Entrega y Generación de Comprobante / WhatsApp
1. Al marcar la orden como `entregado` (o desde la pestaña "Comprobante de Entrega"), se despliega el modal interactivo de **Conclusión de Servicio & Entrega al Cliente**.
2. Opciones inmediatas:
   - **Descargar / Imprimir PDF:** Genera el documento oficial con membrete del taller, datos del cliente, electrodoméstico reparado, repuestos instalados con código, liquidación de pagos y cláusula de garantía de 90 días.
   - **Enviar por WhatsApp:** Genera el enlace oficial `https://wa.me/{telefono}?text=...` con el mensaje perfectamente formateado y codificado con los detalles del servicio y el soporte del taller.
   - **Programación de Mantenimiento Preventivo:** Selector con opciones de 9, 10, 11 o 12 meses (con sugerencia automática según sea Lavadora, Nevera, Secadora o Microondas) y fecha de disparo calculada.

### B. Flujo de Retención y Alerta de Mantenimiento (9 a 12 meses)
1. El sistema registra el recordatorio preventivo vinculado al cliente, al electrodoméstico y a la orden histórica.
2. Cuando la fecha calculada entra en la ventana de aviso (o está vencida):
   - Aparece una tarjeta de alerta en el **Tablero Principal** indicando cuántos clientes requieren mantenimiento preventivo de limpieza este mes.
   - En el módulo **Retención & Mantenimientos**, el recepcionista o asesor puede:
     - Ver la lista ordenada por fecha de vencimiento.
     - Ver qué equipo fue intervenido y qué trabajo se le hizo hace 9-12 meses.
     - Presionar **"Contactar por WhatsApp"**, lo que abre el chat con una plantilla personalizada invitándolo a realizar la limpieza de tina/condensador con descuento de fidelización.
     - Marcar como "Contactado", "Agendado" o "Posponer".

---

## 2. Experiencia de Usuario y Diseño Visual

Siguiendo las directrices del *Frontend Design Constitution* y *SaaS & Dashboards*:

- **Modal de Conclusión de Servicio:**
  - Diseño enfocado, sin fricción: botones primarios de alto contraste para "Descargar Comprobante PDF" y "Abrir WhatsApp del Cliente" (`#25D366` verde WhatsApp oficial).
  - Selector de período de mantenimiento preventivo (segmentado: 9 meses, 10 meses, 11 meses, 12 meses) con visualización de la fecha futura exacta (ej: *Agosto 2027*).
- **Banner de Alerta en Tablero Principal:**
  - Superficie limpia con tono ámbar/azul suave que informa: *"Hay 3 clientes cumpliendo entre 9 y 12 meses desde su última reparación. Oportunidad de agendamiento preventivo"*. Botón rápido para acceder al módulo.
- **Módulo de Retención & Mantenimientos Preventivos:**
  - Tabla de alta densidad con cifras tabulares monoespaciadas (`font-mono tabular-nums`).
  - Columnas: Cliente, Teléfono, Equipo / Marca, Último Servicio, Fecha de Mantenimiento Sugerida, Estado del Recordatorio (Próximo / Vencido / Contactado) y Acción Rápida (WhatsApp 1 Clic).
  - Filtro por estado del recordatorio y buscador por cliente/equipo.

---

## 3. Modelo de Datos y Extensiones

Se expande el modelo en `src/types/taller.ts`:

```typescript
export interface RecordatorioMantenimiento {
  id: string;
  ordenOrigenId: string;
  codigoOT: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  equipoId: string;
  equipoTipo: string;
  equipoMarca: string;
  equipoModelo: string;
  fallaOriginal: string;
  fechaServicioOriginal: string;
  intervaloMeses: number; // 9, 10, 11 o 12
  fechaProgramada: string; // YYYY-MM-DD
  tipoMantenimiento: 'limpieza_profunda' | 'desinfeccion_tina' | 'mantenimiento_preventivo_anual';
  estado: 'pendiente' | 'proximo' | 'vencido' | 'contactado' | 'agendado';
  notasSeguimiento?: string;
  fechaUltimoContacto?: string;
}
```

Se añaden métodos al store `src/store/tallerStore.ts`:
- `programarRecordatorioMantenimiento(recordatorio)`
- `actualizarEstadoRecordatorio(recordatorioId, nuevoEstado, notas?)`
- `obtenerRecordatoriosPendientes()`
- Semilla inicial con 2 recordatorios reales de clientes que ya cumplieron 9 y 11 meses para poder probar y visualizar el módulo de retención inmediatamente.

---

## 4. Arquitectura de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TallerFlow Frontend                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ OrdersDashboard.tsx                                              │  │
│  │ - Banner / KPI Strip de Alertas de Mantenimiento Preventivo      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ OrderDetailModal.tsx                                             │  │
│  │ - Pestaña Comprobante: Botón Descargar PDF & Botón WhatsApp      │  │
│  │ - Modal / Panel de Conclusión de Orden: Programador de 9-12 meses│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ RetentionView.tsx (Nuevo Módulo)                                 │  │
│  │ - Listado de clientes por contactar (9 a 12 meses)               │  │
│  │ - Generador de plantillas WhatsApp de fidelización preventiva    │  │
│  │ - Métricas de clientes retenidos y citas agendadas               │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ pdfGenerator.ts (Utilidad de comprobante imprimible / PDF)       │  │
│  │ whatsappHelper.ts (Construcción de URL wa.me y plantillas)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Pruebas Automatizadas

Se amplía la `TestSuiteView` con el caso de prueba:
- **Test 6: Flujo de Retención y Recordatorio Preventivo:**
  - Concluye una orden de servicio.
  - Programa recordatorio a 9 meses.
  - Valida el cálculo de fecha futura, la persistencia en el store y la generación de la URL de WhatsApp con mensaje personalizado.
