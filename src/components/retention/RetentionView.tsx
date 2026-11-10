import React, { useState, useMemo } from 'react';
import { RecordatorioMantenimiento } from '../../types/taller';
import { formatearFechaCorta } from '../../utils/formatters';
import { generarEnlaceWhatsAppMantenimiento } from '../../utils/whatsappHelper';
import {
  CalendarClock,
  Search,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Filter,
  Check,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface RetentionViewProps {
  recordatorios: RecordatorioMantenimiento[];
  onActualizarEstado: (
    id: string,
    nuevoEstado: RecordatorioMantenimiento['estado'],
    notas?: string
  ) => void;
}

export const RetentionView: React.FC<RetentionViewProps> = ({
  recordatorios,
  onActualizarEstado,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroIntervalo, setFiltroIntervalo] = useState<string>('todos');
  const [recordatorioParaContactar, setRecordatorioParaContactar] =
    useState<RecordatorioMantenimiento | null>(null);

  // Métricas de Fidelización
  const metricas = useMemo(() => {
    const total = recordatorios.length;
    const proximos = recordatorios.filter((r) => r.estado === 'proximo').length;
    const vencidos = recordatorios.filter((r) => r.estado === 'vencido').length;
    const contactados = recordatorios.filter((r) => r.estado === 'contactado').length;
    const agendados = recordatorios.filter((r) => r.estado === 'agendado').length;
    return { total, proximos, vencidos, contactados, agendados };
  }, [recordatorios]);

  // Filtrado
  const recordatoriosFiltrados = useMemo(() => {
    return recordatorios.filter((r) => {
      if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false;
      if (filtroIntervalo !== 'todos' && r.intervaloMeses.toString() !== filtroIntervalo) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return (
          r.clienteNombre.toLowerCase().includes(q) ||
          r.clienteTelefono.includes(q) ||
          r.codigoOT.toLowerCase().includes(q) ||
          r.equipoMarca.toLowerCase().includes(q) ||
          r.equipoTipo.toLowerCase().includes(q) ||
          r.equipoModelo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recordatorios, busqueda, filtroEstado, filtroIntervalo]);

  const handleAbrirWhatsApp = (rec: RecordatorioMantenimiento) => {
    const { url } = generarEnlaceWhatsAppMantenimiento(rec);
    window.open(url, '_blank');
    if (rec.estado !== 'agendado') {
      onActualizarEstado(rec.id, 'contactado', 'Mensaje de recordatorio preventivo enviado por WhatsApp');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Encabezado de Fidelización y Retención */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Retención de Clientes & Mantenimientos Preventivos (9 a 12 Meses)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Motor automático de alertas programadas al entregar un equipo reparado. Dispara recordatorios para desinfección de tina en lavadoras, limpieza de condensador en neveras y revisión preventiva general con mensajes de WhatsApp de 1 clic.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Fidelización activa: {metricas.agendados} mantenimientos agendados</span>
        </div>
      </div>

      {/* 2. KPIs de Retención */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500">Recordatorios Totales</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metricas.total}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
            Histórico de entregas
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Próximos a Vencer (Este Mes)
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {metricas.proximos}
          </div>
          <span className="text-[11px] text-amber-600 mt-0.5 inline-block">
            Oportunidad de contacto
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
            Vencidos sin Contactar
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {metricas.vencidos}
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 inline-block">
            Requieren aviso urgente
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Contactados & Agendados
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {metricas.contactados + metricas.agendados}
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 inline-block">
            {metricas.agendados} citas confirmadas
          </span>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, teléfono, electrodoméstico o código de orden previa..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todos los Estados</option>
              <option value="proximo">Próximos (Alerta)</option>
              <option value="vencido">Vencidos</option>
              <option value="contactado">Contactados</option>
              <option value="agendado">Citas Agendadas</option>
              <option value="pendiente">Pendientes Futuros</option>
            </select>

            <select
              value={filtroIntervalo}
              onChange={(e) => setFiltroIntervalo(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todos los Intervalos</option>
              <option value="9">9 Meses (Lavado/Desinfección)</option>
              <option value="10">10 Meses</option>
              <option value="11">11 Meses</option>
              <option value="12">12 Meses (Anual)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Tabla de Clientes con Recordatorio Preventivo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px]">
                <th className="py-3 px-4 font-semibold">Cliente & Teléfono</th>
                <th className="py-3 px-4 font-semibold">Electrodoméstico</th>
                <th className="py-3 px-4 font-semibold">Orden Previa & Falla</th>
                <th className="py-3 px-4 font-semibold text-center">Intervalo</th>
                <th className="py-3 px-4 font-semibold">Fecha Prevista</th>
                <th className="py-3 px-4 font-semibold">Estado Alerta</th>
                <th className="py-3 px-4 font-semibold text-right">Contactar WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recordatoriosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No hay recordatorios de mantenimiento para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                recordatoriosFiltrados.map((rec) => {
                  const esVencido = rec.estado === 'vencido';
                  const esProximo = rec.estado === 'proximo';
                  const esAgendado = rec.estado === 'agendado';
                  const esContactado = rec.estado === 'contactado';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rec.clienteNombre}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{rec.clienteTelefono}</span>
                        </div>
                      </td>

                      {/* Electrodoméstico */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {rec.equipoMarca} · {rec.equipoTipo}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {rec.equipoModelo}
                        </div>
                      </td>

                      {/* Orden Previa */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {rec.codigoOT}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate" title={rec.fallaOriginal}>
                          {rec.fallaOriginal}
                        </p>
                      </td>

                      {/* Intervalo */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {rec.intervaloMeses} meses
                        </span>
                      </td>

                      {/* Fecha Prevista */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.fechaProgramada}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Servicio: {rec.fechaServicioOriginal}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={rec.estado}
                          onChange={(e) => onActualizarEstado(rec.id, e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            esVencido
                              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                              : esProximo
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                              : esAgendado
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                              : esContactado
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="proximo">Próximo a Vencer</option>
                          <option value="vencido">Vencido (+9-12m)</option>
                          <option value="contactado">Contactado</option>
                          <option value="agendado">Cita Agendada</option>
                          <option value="pendiente">Pendiente</option>
                        </select>
                      </td>

                      {/* Botón WhatsApp */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleAbrirWhatsApp(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                          <ArrowUpRight className="w-3 h-3 opacity-80" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
