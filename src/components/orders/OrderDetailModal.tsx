import React, { useState } from 'react';
import {
  Orden,
  Cliente,
  Equipo,
  Tecnico,
  Repuesto,
  EstadoOrden,
  ESTADOS_ORDEN_CONFIG,
  ItemPresupuesto,
} from '../../types/taller';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';
import {
  X,
  Wrench,
  User,
  DollarSign,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MessageCircle,
  CalendarClock,
  Download,
  Share2,
  PenTool,
} from 'lucide-react';
import {
  generarEnlaceWhatsAppResumen,
  generarEnlaceWhatsAppPDFComprobante,
  generarEnlaceWhatsAppPresupuesto,
} from '../../utils/whatsappHelper';
import { imprimirComprobantePDF } from '../../utils/pdfGenerator';
import { SignaturePad } from '../common/SignaturePad';

interface OrderDetailModalProps {
  orden: Orden;
  cliente?: Cliente;
  equipo?: Equipo;
  tecnicos: Tecnico[];
  repuestosDisponibles: Repuesto[];
  onClose: () => void;
  onActualizarEstado: (nuevoEstado: EstadoOrden, nota?: string) => void;
  onAsignarTecnico: (tecnicoId: string) => void;
  onGuardarPresupuesto: (datos: {
    manoDeObra: number;
    repuestos: Array<{
      repuestoId?: string;
      codigo?: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
    }>;
    notas?: string;
  }) => void;
  onAprobarPresupuesto: () => void;
  onRechazarPresupuesto: (motivo: string) => void;
  onRegistrarPago: (datos: {
    monto: number;
    metodoPago: any;
    referencia?: string;
    notas?: string;
  }) => void;
  onAgregarNota: (datos: {
    tecnicoId: string;
    tecnicoNombre: string;
    tipo: 'diagnostico' | 'avance' | 'interno';
    contenido: string;
  }) => void;
  onConcluirYEntregar?: (intervaloMeses: number) => void;
  onGuardarFirma?: (ordenId: string, firmaBase64: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orden,
  cliente,
  equipo,
  tecnicos,
  repuestosDisponibles,
  onClose,
  onActualizarEstado,
  onAsignarTecnico,
  onGuardarPresupuesto,
  onAprobarPresupuesto,
  onRechazarPresupuesto,
  onRegistrarPago,
  onAgregarNota,
  onConcluirYEntregar,
  onGuardarFirma,
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<'diagnostico' | 'presupuesto' | 'pagos' | 'comprobante'>('diagnostico');
  const [mostrarPadFirma, setMostrarPadFirma] = useState<boolean>(false);

  // Estado para nueva nota
  const [nuevaNotaContenido, setNuevaNotaContenido] = useState('');
  const [nuevaNotaTipo, setNuevaNotaTipo] = useState<'diagnostico' | 'avance' | 'interno'>('diagnostico');

  // Estado para editor de presupuesto
  const [manoDeObra, setManoDeObra] = useState<number>(orden.presupuesto?.manoDeObra || 80000);
  const [itemsPresupuesto, setItemsPresupuesto] = useState<
    Array<{
      repuestoId?: string;
      codigo?: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>
  >(
    orden.presupuesto?.repuestos.map((r) => ({
      repuestoId: r.repuestoId,
      codigo: r.codigo,
      nombre: r.nombre,
      cantidad: r.cantidad,
      precioUnitario: r.precioUnitario,
      subtotal: r.subtotal,
    })) || []
  );
  const [repuestoSeleccionadoId, setRepuestoSeleccionadoId] = useState<string>('');
  const [repuestoCantidad, setRepuestoCantidad] = useState<number>(1);
  const [notasPresupuesto, setNotasPresupuesto] = useState(orden.presupuesto?.notas || '');
  const [motivoRechazoInput, setMotivoRechazoInput] = useState('');
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);

  // Estado para registro de pagos
  const [montoPago, setMontoPago] = useState<number>(50000);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'nequi_daviplata'>('efectivo');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [notasPago, setNotasPago] = useState('');

  // Estado para conclusión de entrega y recordatorio preventivo (9 a 12 meses)
  const [intervaloMantenimiento, setIntervaloMantenimiento] = useState<number>(9);
  const [mensajeAlertaEntrega, setMensajeAlertaEntrega] = useState<string>('');

  // Cálculos financieros
  const totalRepuestos = itemsPresupuesto.reduce((acc, it) => acc + it.subtotal, 0);
  const totalPresupuestoCalculado = Number(manoDeObra || 0) + totalRepuestos;
  const totalPagado = orden.pagos.reduce((acc, p) => acc + p.monto, 0);
  const totalPresupuestoRegistrado = orden.presupuesto?.total || totalPresupuestoCalculado;
  const saldoPendiente = Math.max(0, totalPresupuestoRegistrado - totalPagado);

  const configEstadoActual = ESTADOS_ORDEN_CONFIG[orden.estado];
  const tecnicoActual = tecnicos.find((t) => t.id === orden.tecnicoId);

  // Manejador para agregar repuesto al presupuesto
  const handleAgregarRepuesto = () => {
    if (!repuestoSeleccionadoId) return;
    const rep = repuestosDisponibles.find((r) => r.id === repuestoSeleccionadoId);
    if (!rep) return;

    const nuevoItem = {
      repuestoId: rep.id,
      codigo: rep.codigo,
      nombre: `${rep.nombre} (${rep.marca})`,
      cantidad: repuestoCantidad,
      precioUnitario: rep.precioVenta,
      subtotal: rep.precioVenta * repuestoCantidad,
    };

    setItemsPresupuesto([...itemsPresupuesto, nuevoItem]);
    setRepuestoSeleccionadoId('');
    setRepuestoCantidad(1);
  };

  const handleEliminarItemPresupuesto = (idx: number) => {
    setItemsPresupuesto(itemsPresupuesto.filter((_, i) => i !== idx));
  };

  const handleGuardarPresupuestoClick = () => {
    onGuardarPresupuesto({
      manoDeObra: Number(manoDeObra || 0),
      repuestos: itemsPresupuesto,
      notas: notasPresupuesto,
    });
  };

  const handleEnviarNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNotaContenido.trim()) return;

    onAgregarNota({
      tecnicoId: orden.tecnicoId || 'sistema',
      tecnicoNombre: tecnicoActual ? tecnicoActual.nombre : 'Técnico de Servicio',
      tipo: nuevaNotaTipo,
      contenido: nuevaNotaContenido.trim(),
    });

    setNuevaNotaContenido('');
  };

  const handleRegistrarPagoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (montoPago <= 0) return;

    onRegistrarPago({
      monto: Number(montoPago),
      metodoPago,
      referencia: referenciaPago.trim(),
      notas: notasPago.trim(),
    });

    setReferenciaPago('');
    setNotasPago('');
  };

  // Acciones WhatsApp mediante protocolo wa.me
  const handleEnviarResumenWhatsApp = () => {
    const { url } = generarEnlaceWhatsAppResumen(orden, cliente, equipo, tecnicoActual?.nombre);
    window.open(url, '_blank');
    setMensajeAlertaEntrega('¡Enlace de WhatsApp abierto con el resumen completo de la reparación!');
  };

  const handleEnviarPDFWhatsApp = () => {
    // 1. Abrir diálogo de descarga e impresión de PDF oficial
    imprimirComprobantePDF(orden, cliente, equipo);

    // 2. Abrir WhatsApp (wa.me) con el mensaje preconfigurado de entrega de comprobante
    const { url } = generarEnlaceWhatsAppPDFComprobante(orden, cliente, equipo);
    window.open(url, '_blank');

    setMensajeAlertaEntrega(
      '¡Comprobante PDF generado! Se abrió WhatsApp con el mensaje preconfigurado de confirmación para el cliente.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera Principal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {orden.codigo}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{equipo?.marca}</span>
                <span className="text-slate-400">·</span>
                <span>{equipo?.tipo}</span>
                <span className="text-xs text-slate-500 font-normal">({equipo?.modelo})</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-3">
              <span>Cliente: <strong className="text-slate-700 dark:text-slate-300">{cliente?.nombre}</strong></span>
              <span>·</span>
              <span>Ingreso: {formatearFecha(orden.fechaIngreso)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Botones de Acción WhatsApp en Cabecera */}
            <button
              type="button"
              onClick={handleEnviarResumenWhatsApp}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Enviar resumen completo de reparación por WhatsApp (wa.me)"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Resumen WhatsApp</span>
              <span className="md:hidden">Resumen</span>
            </button>

            <button
              type="button"
              onClick={handleEnviarPDFWhatsApp}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Generar comprobante PDF y enviar por WhatsApp (wa.me)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">PDF WhatsApp</span>
              <span className="md:hidden">PDF</span>
            </button>

            {/* Selector de Estado Operativo */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Estado:</span>
              <select
                value={orden.estado}
                onChange={(e) => onActualizarEstado(e.target.value as EstadoOrden)}
                className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${configEstadoActual.colorBadge} ${configEstadoActual.colorBorde}`}
              >
                {Object.entries(ESTADOS_ORDEN_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumen Superior Rápido: Falla y Equipo */}
        <div className="px-6 py-3 bg-blue-50/40 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shrink-0">
          <div>
            <span className="font-semibold text-slate-500 text-[11px] block">Falla Reportada:</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{orden.fallaReportada}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 text-[11px] block">Número de Serie:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{equipo?.numeroSerie || 'Sin serial'}</span>
            {orden.accesorios && (
              <span className="block text-[11px] text-slate-500">Accesorios: {orden.accesorios}</span>
            )}
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3">
            <div>
              <span className="font-semibold text-slate-500 text-[11px] block">Técnico a Cargo:</span>
              <select
                value={orden.tecnicoId || ''}
                onChange={(e) => onAsignarTecnico(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setPestanaActiva('diagnostico')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              pestanaActiva === 'diagnostico'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>1. Diagnóstico & Notas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
              {orden.notasTecnicas.length}
            </span>
          </button>

          <button
            onClick={() => setPestanaActiva('presupuesto')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              pestanaActiva === 'presupuesto'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Presupuesto & Repuestos</span>
            {orden.presupuesto?.estado === 'aprobado' && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                Aprobado
              </span>
            )}
          </button>

          <button
            onClick={() => setPestanaActiva('pagos')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              pestanaActiva === 'pagos'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>3. Pagos & Saldo</span>
            {saldoPendiente > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                {formatearMoneda(saldoPendiente)}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                Al Día
              </span>
            )}
          </button>

          <button
            onClick={() => setPestanaActiva('comprobante')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              pestanaActiva === 'comprobante'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>4. Comprobante de Entrega</span>
          </button>
        </div>

        {/* Contenedor de Contenido según pestaña */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* PESTAÑA 1: DIAGNÓSTICO Y NOTAS TÉCNICAS */}
          {pestanaActiva === 'diagnostico' && (
            <div className="space-y-6">
              {/* Formulario para agregar nueva nota */}
              <form onSubmit={handleEnviarNota} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Registrar Observación / Diagnóstico del Técnico
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-slate-500 text-[11px]">Tipo de nota:</label>
                    <select
                      value={nuevaNotaTipo}
                      onChange={(e) => setNuevaNotaTipo(e.target.value as any)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                    >
                      <option value="diagnostico">Diagnóstico Técnico</option>
                      <option value="avance">Avance de Trabajo</option>
                      <option value="interno">Nota Interna / Mostrador</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={nuevaNotaContenido}
                  onChange={(e) => setNuevaNotaContenido(e.target.value)}
                  placeholder="Detalle pruebas eléctricas realizadas, mediciones con multímetro, componentes afectados o procedimiento aplicado..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!nuevaNotaContenido.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Guardar Nota en Bitácora</span>
                  </button>
                </div>
              </form>

              {/* Bitácora cronológica de notas */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Historial de Notas y Bitácora de Servicio ({orden.notasTecnicas.length})
                </h3>

                {orden.notasTecnicas.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    No hay notas registradas aún. El técnico puede ingresar el diagnóstico arriba.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orden.notasTecnicas.map((nota) => (
                      <div
                        key={nota.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {nota.tecnicoNombre}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                nota.tipo === 'diagnostico'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : nota.tipo === 'avance'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {nota.tipo}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatearFecha(nota.fecha)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {nota.contenido}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: PRESUPUESTO Y REPUESTOS */}
          {pestanaActiva === 'presupuesto' && (
            <div className="space-y-6">
              {/* Alerta de Estado del Presupuesto */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white ${
                      orden.presupuesto?.estado === 'aprobado'
                        ? 'bg-emerald-600'
                        : orden.presupuesto?.estado === 'rechazado'
                        ? 'bg-rose-600'
                        : 'bg-orange-500'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Estado Presupuesto:
                      </span>
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-900 border">
                        {orden.presupuesto?.estado || 'En Preparación'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {orden.presupuesto?.estado === 'aprobado'
                        ? `Aprobado por cliente el ${formatearFecha(orden.presupuesto.fechaRespuesta)}. Stock descontado en inventario.`
                        : orden.presupuesto?.estado === 'rechazado'
                        ? `Rechazado por cliente. Motivo: ${orden.presupuesto.motivoRechazo || 'Sin especificar'}`
                        : 'Cotización lista para ser presentada al cliente para su aprobación.'}
                    </span>
                  </div>
                </div>

                {/* Botones de Aprobación / Rechazo / Envío WhatsApp */}
                {orden.presupuesto?.estado !== 'aprobado' && orden.presupuesto?.estado !== 'rechazado' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const { url } = generarEnlaceWhatsAppPresupuesto(orden, cliente, equipo);
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                      title="Enviar cotización detallada por WhatsApp al cliente para solicitar su aprobación"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Enviar Cotización (WhatsApp)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMostrarModalRechazo(true)}
                      className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      type="button"
                      onClick={onAprobarPresupuesto}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar y Descontar Stock</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal emergente para registrar motivo de rechazo */}
              {mostrarModalRechazo && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                    Confirmar Rechazo del Presupuesto
                  </span>
                  <input
                    type="text"
                    value={motivoRechazoInput}
                    onChange={(e) => setMotivoRechazoInput(e.target.value)}
                    placeholder="Ej. Costo muy elevado, el cliente prefiere adquirir equipo nuevo..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setMostrarModalRechazo(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRechazarPresupuesto(motivoRechazoInput || 'Presupuesto no aceptado por costo');
                        setMostrarModalRechazo(false);
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                    >
                      Confirmar y Cancelar Orden
                    </button>
                  </div>
                </div>
              )}

              {/* Editor de Presupuesto: Repuestos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Repuestos y Materiales Requeridos
                  </h3>
                  <span className="text-xs text-slate-500">
                    Stock descontado automáticamente al aprobar
                  </span>
                </div>

                {/* Selector de repuesto del inventario */}
                {orden.presupuesto?.estado !== 'aprobado' && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 w-full">
                      <select
                        value={repuestoSeleccionadoId}
                        onChange={(e) => setRepuestoSeleccionadoId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">-- Seleccionar Repuesto del Catálogo --</option>
                        {repuestosDisponibles.map((r) => (
                          <option key={r.id} value={r.id}>
                            [{r.codigo}] {r.nombre} ({r.marca}) · Stock: {r.stockActual} · {formatearMoneda(r.precioVenta)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={repuestoCantidad}
                        onChange={(e) => setRepuestoCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono"
                        placeholder="Cant"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!repuestoSeleccionadoId}
                      onClick={handleAgregarRepuesto}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar al Presupuesto</span>
                    </button>
                  </div>
                )}

                {/* Tabla de Repuestos agregados */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px]">
                        <th className="py-2.5 px-3">Código / Ítem</th>
                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        {orden.presupuesto?.estado !== 'aprobado' && (
                          <th className="py-2.5 px-3 text-center w-12"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {itemsPresupuesto.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No se han añadido repuestos a esta cotización.
                          </td>
                        </tr>
                      ) : (
                        itemsPresupuesto.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {it.nombre}
                              {it.codigo && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  {it.codigo}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{it.cantidad}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                              {formatearMoneda(it.precioUnitario)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatearMoneda(it.subtotal)}
                            </td>
                            {orden.presupuesto?.estado !== 'aprobado' && (
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEliminarItemPresupuesto(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mano de Obra y Resumen Final */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Valor Mano de Obra / Servicio Técnico (COP):
                      </label>
                      <input
                        type="number"
                        disabled={orden.presupuesto?.estado === 'aprobado'}
                        value={manoDeObra}
                        onChange={(e) => setManoDeObra(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Notas y Condiciones del Presupuesto:
                      </label>
                      <textarea
                        rows={2}
                        disabled={orden.presupuesto?.estado === 'aprobado'}
                        value={notasPresupuesto}
                        onChange={(e) => setNotasPresupuesto(e.target.value)}
                        placeholder="Ej. Garantía de 90 días en mano de obra y repuesto..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 font-mono">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal Repuestos:</span>
                        <span>{formatearMoneda(totalRepuestos)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Mano de Obra Especializada:</span>
                        <span>{formatearMoneda(manoDeObra)}</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                        <span>Total Presupuestado:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatearMoneda(totalPresupuestoCalculado)}
                        </span>
                      </div>
                    </div>

                    {orden.presupuesto?.estado !== 'aprobado' && (
                      <button
                        type="button"
                        onClick={handleGuardarPresupuestoClick}
                        className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors text-center"
                      >
                        Actualizar y Guardar Cotización
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: PAGOS & SALDO */}
          {pestanaActiva === 'pagos' && (
            <div className="space-y-6">
              {/* Tarjetas de Saldo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-500 font-sans block">Total a Cobrar</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {formatearMoneda(totalPresupuestoRegistrado)}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-500 font-sans block">Total Recibido</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatearMoneda(totalPagado)}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-500 font-sans block">Saldo Restante</span>
                  <div
                    className={`text-xl font-bold mt-1 ${
                      saldoPendiente > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {formatearMoneda(saldoPendiente)}
                  </div>
                </div>
              </div>

              {/* Formulario Registrar Pago */}
              <form
                onSubmit={handleRegistrarPagoSubmit}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Registrar Nuevo Abono o Pago Completo
                  </h3>
                  {saldoPendiente > 0 && (
                    <button
                      type="button"
                      onClick={() => setMontoPago(saldoPendiente)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Copiar saldo restante ({formatearMoneda(saldoPendiente)})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monto (COP) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={montoPago}
                      onChange={(e) => setMontoPago(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Método de Pago *
                    </label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="efectivo">Efectivo en Caja</option>
                      <option value="transferencia">Transferencia Bancaria (Bancolombia, etc.)</option>
                      <option value="nequi_daviplata">Nequi / Daviplata</option>
                      <option value="tarjeta">Datafono / Tarjeta Débito/Crédito</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Referencia o N° Comprobante
                    </label>
                    <input
                      type="text"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      placeholder="Ej. Aprobación #0981"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Registrar Pago</span>
                  </button>
                </div>
              </form>

              {/* Historial de Pagos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Comprobantes y Abonos Realizados ({orden.pagos.length})
                </h4>

                {orden.pagos.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    No se registran pagos previos para esta orden de servicio.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 uppercase text-[11px]">
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3">Método</th>
                          <th className="py-2.5 px-3">Referencia</th>
                          <th className="py-2.5 px-3 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {orden.pagos.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans">
                              {formatearFecha(p.fecha)}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {p.metodoPago.replace('_', ' ')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{p.referencia || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatearMoneda(p.monto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 4: COMPROBANTE DE ENTREGA / GARANTÍA & WHATSAPP & RETENCIÓN */}
          {pestanaActiva === 'comprobante' && (
            <div className="space-y-5">
              {mensajeAlertaEntrega && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{mensajeAlertaEntrega}</span>
                </div>
              )}

              {/* Barra de Acciones: WhatsApp, PDF e Impresión */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl no-print">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Entrega Digital al Cliente & Respaldo
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Envíe el comprobante directamente al chat de WhatsApp o genere el documento PDF oficial.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón 1: Enviar Resumen de Reparación por WhatsApp */}
                  <button
                    type="button"
                    onClick={handleEnviarResumenWhatsApp}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Enviar informe completo de reparación, repuestos, mano de obra y garantía por WhatsApp (wa.me)"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Resumen WhatsApp</span>
                  </button>

                  {/* Botón 2: Generar y Enviar PDF por WhatsApp */}
                  <button
                    type="button"
                    onClick={handleEnviarPDFWhatsApp}
                    className="px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Genera el comprobante PDF oficial y abre el chat de WhatsApp (wa.me) con mensaje preconfigurado"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Enviar PDF por WhatsApp</span>
                  </button>

                  {/* Botón 3: Descargar PDF / Imprimir sin WhatsApp */}
                  <button
                    type="button"
                    onClick={() => imprimirComprobantePDF(orden, cliente, equipo)}
                    className="px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Descargar o imprimir comprobante PDF oficial de entrega"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Descargar PDF</span>
                  </button>

                  {/* Botón 4: Firma Táctil del Cliente */}
                  <button
                    type="button"
                    onClick={() => setMostrarPadFirma(!mostrarPadFirma)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      orden.firmaClienteBase64
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm shadow-indigo-600/20'
                    }`}
                    title="Capturar o actualizar firma táctil del cliente en comprobante"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>{orden.firmaClienteBase64 ? 'Firma Capturada (Modificar)' : 'Firmar en Pantalla'}</span>
                  </button>
                </div>
              </div>

              {/* Componente Canvas SignaturePad si está activo */}
              {mostrarPadFirma && (
                <div className="no-print">
                  <SignaturePad
                    clienteNombre={cliente?.nombre}
                    onGuardarFirma={(base64) => {
                      if (onGuardarFirma) {
                        onGuardarFirma(orden.id, base64);
                      }
                      setMostrarPadFirma(false);
                      setMensajeAlertaEntrega('¡Firma táctil del cliente guardada con éxito en la orden!');
                    }}
                    onCancelar={() => setMostrarPadFirma(false)}
                  />
                </div>
              )}

              {/* Panel de Conclusión de Orden & Programación de Mantenimiento Preventivo (9-12m) */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3 no-print">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Programador de Mantenimiento Preventivo de Retención (9 a 12 Meses)
                    </span>
                  </div>
                  {orden.estado === 'entregado' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Servicio Entregado
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Al concluir la entrega, el sistema programará automáticamente una alerta en el módulo de retención para contactar al cliente por WhatsApp y ofrecerle limpieza de tina / desincrustación o revisión anual.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Disparar alerta en:
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      {[9, 10, 11, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setIntervaloMantenimiento(m)}
                          className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                            intervaloMantenimiento === m
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {orden.estado !== 'entregado' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onConcluirYEntregar) {
                          onConcluirYEntregar(intervaloMantenimiento);
                        } else {
                          onActualizarEstado('entregado', `Equipo entregado y recordatorio preventivo configurado a ${intervaloMantenimiento} meses.`);
                        }
                        setMensajeAlertaEntrega(
                          `¡Equipo entregado con éxito! Se programó alerta preventiva de mantenimiento a ${intervaloMantenimiento} meses.`
                        );
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir Entrega & Programar Alerta</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Recibo limpio imprimible */}
              <div className="print-container bg-white border border-slate-300 rounded-xl p-8 text-slate-900 shadow-sm max-w-2xl mx-auto space-y-6">
                {/* Cabecera del Taller */}
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-blue-700">TallerFlow</h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Servicio Técnico Especializado en Electrodomésticos de Línea Blanca
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Bogotá D.C. · Tel: (601) 745-0988 · Cel: +57 310 892 4410
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-blue-700 px-2 py-0.5 border border-blue-300 rounded bg-blue-50">
                      {orden.codigo}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Fecha: {formatearFecha(orden.fechaIngreso).split(',')[0]}
                    </p>
                  </div>
                </div>

                {/* Datos del Cliente y Aparato */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">
                      Datos del Cliente:
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{cliente?.nombre}</p>
                    <p className="text-slate-600">DNI / Cédula: {cliente?.documento}</p>
                    <p className="text-slate-600">Teléfono: {cliente?.telefono}</p>
                    <p className="text-slate-600">{cliente?.direccion}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">
                      Electrodoméstico:
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {equipo?.marca} · {equipo?.tipo}
                    </p>
                    <p className="text-slate-600">Modelo: {equipo?.modelo}</p>
                    <p className="text-slate-600 font-mono">S/N: {equipo?.numeroSerie}</p>
                    <p className="text-slate-600 italic">Falla: {orden.fallaReportada}</p>
                  </div>
                </div>

                {/* Detalle de Repuestos y Trabajos */}
                <div className="space-y-2">
                  <span className="text-slate-700 font-bold text-xs uppercase tracking-wider block">
                    Conceptos de Reparación y Repuestos:
                  </span>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600 font-semibold">
                        <th className="py-1 text-left">Descripción</th>
                        <th className="py-1 text-center">Cant</th>
                        <th className="py-1 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orden.presupuesto?.repuestos.map((r, i) => (
                        <tr key={i}>
                          <td className="py-1.5">{r.nombre}</td>
                          <td className="py-1.5 text-center font-mono">{r.cantidad}</td>
                          <td className="py-1.5 text-right font-mono">{formatearMoneda(r.subtotal)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-1.5 font-medium">Mano de Obra y Calibración Técnica</td>
                        <td className="py-1.5 text-center font-mono">1</td>
                        <td className="py-1.5 text-right font-mono">
                          {formatearMoneda(orden.presupuesto?.manoDeObra || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Liquidación de Pagos */}
                <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">
                      Estado de Pago: {saldoPendiente === 0 ? 'PAGADO COMPLETO' : 'PENDIENTE'}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <div>Total Servicio: <strong className="text-sm">{formatearMoneda(totalPresupuestoRegistrado)}</strong></div>
                    <div className="text-emerald-700">Abonado: {formatearMoneda(totalPagado)}</div>
                    <div className="text-sm font-bold text-slate-900 border-t pt-1">
                      Saldo a Cancelar: {formatearMoneda(saldoPendiente)}
                    </div>
                  </div>
                </div>

                {/* Términos de Garantía */}
                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3 leading-relaxed">
                  <strong>Póliza de Garantía:</strong> Este servicio técnico cuenta con 90 días calendario de garantía sobre los repuestos instalados y la mano de obra descrita. No cubre fallas causadas por variaciones de voltaje, plagas, golpes o manipulaciones de terceros. Todo equipo no retirado después de 30 días devengará costos de bodegaje.
                </div>

                {/* Líneas de Firma */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
                  <div className="flex flex-col justify-end">
                    <div className="h-14 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        Sello Técnico Autorizado
                      </span>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <span className="font-semibold block">{tecnicoActual?.nombre || 'Técnico Autorizado'}</span>
                      <span className="text-[10px] text-slate-500">TallerFlow Servicio Técnico</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    {orden.firmaClienteBase64 ? (
                      <div className="h-14 flex flex-col items-center justify-end mb-1">
                        <img
                          src={orden.firmaClienteBase64}
                          alt="Firma del cliente"
                          className="h-11 max-w-[190px] object-contain block mx-auto"
                        />
                        <span className="text-[9px] text-emerald-600 font-mono font-medium">
                          Firma digital capturada {orden.fechaFirmaCliente ? `(${orden.fechaFirmaCliente})` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="h-14 flex flex-col items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setMostrarPadFirma(true)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-md transition-colors no-print flex items-center gap-1 cursor-pointer"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>Firma táctil cliente</span>
                        </button>
                        <span className="text-[10px] text-slate-400 print-only">
                          (Pendiente firma cliente)
                        </span>
                      </div>
                    )}
                    <div className="border-t border-slate-400 pt-2">
                      <span className="font-semibold block">{cliente?.nombre}</span>
                      <span className="text-[10px] text-slate-500">Recibí a conformidad</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
