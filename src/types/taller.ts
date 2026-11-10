export type EstadoOrden =
  | 'recibido'
  | 'en_diagnostico'
  | 'esperando_aprobacion'
  | 'en_reparacion'
  | 'esperando_repuesto'
  | 'listo_entrega'
  | 'entregado'
  | 'cancelado';

export type TipoElectrodomestico =
  | 'Lavadora'
  | 'Nevera'
  | 'Secadora'
  | 'Microondas'
  | 'Lavavajillas'
  | 'Aire Acondicionado'
  | 'Estufa / Horno'
  | 'Otro';

export type MarcaElectrodomestico =
  | 'LG'
  | 'Samsung'
  | 'Whirlpool'
  | 'Mabe'
  | 'Electrolux'
  | 'Haceb'
  | 'General Electric'
  | 'Bosch'
  | 'Otra';

export interface Cliente {
  id: string;
  nombre: string;
  documento: string; // Cédula / DNI / NIT
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  fechaRegistro: string;
  notas?: string;
}

export interface Equipo {
  id: string;
  clienteId: string;
  tipo: TipoElectrodomestico;
  marca: MarcaElectrodomestico | string;
  modelo: string;
  numeroSerie: string;
  color?: string;
  fechaRegistro: string;
}

export interface Tecnico {
  id: string;
  nombre: string;
  especialidad: string;
  telefono: string;
  activo: boolean;
}

export interface NotaTecnica {
  id: string;
  ordenId: string;
  tecnicoId: string;
  tecnicoNombre: string;
  tipo: 'diagnostico' | 'avance' | 'interno';
  contenido: string;
  fecha: string;
}

export interface ItemPresupuesto {
  id: string;
  repuestoId?: string; // id si proviene del catálogo de stock
  codigo?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Presupuesto {
  id: string;
  ordenId: string;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
  manoDeObra: number;
  repuestos: ItemPresupuesto[];
  totalRepuestos: number;
  total: number;
  fechaEmision: string;
  fechaRespuesta?: string;
  motivoRechazo?: string;
  notas?: string;
}

export interface Repuesto {
  id: string;
  codigo: string;
  nombre: string;
  marca: MarcaElectrodomestico | string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  precioCosto: number;
  precioVenta: number;
  ubicacion?: string;
}

export interface Pago {
  id: string;
  ordenId: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi_daviplata' | 'otro';
  fecha: string;
  referencia?: string;
  recibidoPor?: string;
  notas?: string;
}

export interface Orden {
  id: string;
  codigo: string; // Ej: "OT-00101"
  clienteId: string;
  equipoId: string;
  tecnicoId?: string;
  estado: EstadoOrden;
  fallaReportada: string;
  accesorios?: string; // Ej: "Manguera de llenado, cable de poder"
  observacionesVisuales?: string; // Ej: "Rayones en lateral izquierdo"
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  fechaIngreso: string;
  fechaPrometida?: string;
  fechaDiagnostico?: string;
  fechaReparacion?: string;
  fechaEntrega?: string;
  presupuesto?: Presupuesto;
  notasTecnicas: NotaTecnica[];
  pagos: Pago[];
  documentoOrigenId?: string; // Enlace a documento OCR si proviene de ingesta
  firmaClienteBase64?: string; // Firma digital táctil capturada en canvas
  fechaFirmaCliente?: string;
}

export interface DocumentoOCR {
  id: string;
  nombreArchivo: string;
  fechaSubida: string;
  tipoDocumento: 'orden_servicio_fisica' | 'factura_proveedor' | 'otro';
  confianza: number;
  codigoReferencia: string;
  datosExtraidos: any;
  estadoProcesamiento: 'completado' | 'pendiente' | 'error';
  ordenIdCreada?: string;
  imagenPreview?: string;
}

export interface FiltrosOrdenes {
  busqueda: string;
  estado: EstadoOrden | 'todos';
  tecnicoId: string | 'todos';
  marca: string | 'todos';
  fechaDesde: string;
  fechaHasta: string;
}

// Meta información y labels para los estados
export const ESTADOS_ORDEN_CONFIG: Record<
  EstadoOrden,
  {
    label: string;
    descripcion: string;
    colorBadge: string;
    colorTexto: string;
    colorBorde: string;
    bgSubtle: string;
  }
> = {
  recibido: {
    label: 'Recibido',
    descripcion: 'Equipo recibido en recepción, pendiente de asignación o revisión.',
    colorBadge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    colorTexto: 'text-slate-700 dark:text-slate-300',
    colorBorde: 'border-slate-300 dark:border-slate-700',
    bgSubtle: 'bg-slate-50 dark:bg-slate-900/40',
  },
  en_diagnostico: {
    label: 'En Diagnóstico',
    descripcion: 'Técnico asignado evaluando componentes y cotización.',
    colorBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    colorTexto: 'text-amber-700 dark:text-amber-400',
    colorBorde: 'border-amber-300 dark:border-amber-800',
    bgSubtle: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  esperando_aprobacion: {
    label: 'Esperando Aprobación',
    descripcion: 'Presupuesto emitido, aguardando visto bueno del cliente.',
    colorBadge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
    colorTexto: 'text-orange-700 dark:text-orange-400',
    colorBorde: 'border-orange-300 dark:border-orange-800',
    bgSubtle: 'bg-orange-50/50 dark:bg-orange-950/20',
  },
  en_reparacion: {
    label: 'En Reparación',
    descripcion: 'Presupuesto aprobado, técnicos ejecutando mano de obra.',
    colorBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    colorTexto: 'text-blue-700 dark:text-blue-400',
    colorBorde: 'border-blue-300 dark:border-blue-800',
    bgSubtle: 'bg-blue-50/50 dark:bg-blue-950/20',
  },
  esperando_repuesto: {
    label: 'Esperando Repuesto',
    descripcion: 'Pausa operativa a la espera de llegada de pieza solicitada.',
    colorBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    colorTexto: 'text-purple-700 dark:text-purple-400',
    colorBorde: 'border-purple-300 dark:border-purple-800',
    bgSubtle: 'bg-purple-50/50 dark:bg-purple-950/20',
  },
  listo_entrega: {
    label: 'Listo para Entrega',
    descripcion: 'Reparación concluida y probada; esperando retiro del cliente.',
    colorBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    colorTexto: 'text-emerald-700 dark:text-emerald-400',
    colorBorde: 'border-emerald-300 dark:border-emerald-800',
    bgSubtle: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  entregado: {
    label: 'Entregado',
    descripcion: 'Equipo retirado por el cliente, pagos liquidados.',
    colorBadge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    colorTexto: 'text-teal-700 dark:text-teal-400',
    colorBorde: 'border-teal-300 dark:border-teal-800',
    bgSubtle: 'bg-teal-50/50 dark:bg-teal-950/20',
  },
  cancelado: {
    label: 'Cancelado',
    descripcion: 'Servicio cancelado o presupuesto no aceptado.',
    colorBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    colorTexto: 'text-rose-700 dark:text-rose-400',
    colorBorde: 'border-rose-300 dark:border-rose-800',
    bgSubtle: 'bg-rose-50/50 dark:bg-rose-950/20',
  },
};

export interface RecordatorioMantenimiento {
  id: string;
  ordenOrigenId: string;
  codigoOT: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  equipoId: string;
  equipoTipo: TipoElectrodomestico | string;
  equipoMarca: MarcaElectrodomestico | string;
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
