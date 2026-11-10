import React, { useState, useMemo } from 'react';
import {
  Orden,
  Cliente,
  Equipo,
  Tecnico,
  EstadoOrden,
  ESTADOS_ORDEN_CONFIG,
} from '../../types/taller';
import { formatearMoneda, formatearFechaCorta } from '../../utils/formatters';
import {
  Search,
  Filter,
  Columns3,
  List,
  Wrench,
  Clock,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  Calendar,
  Layers,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { RecordatorioMantenimiento } from '../../types/taller';

interface OrdersDashboardProps {
  ordenes: Orden[];
  clientes: Cliente[];
  equipos: Equipo[];
  tecnicos: Tecnico[];
  recordatoriosMantenimiento?: RecordatorioMantenimiento[];
  onSeleccionarOrden: (ordenId: string) => void;
  onNuevaOrden: () => void;
  onCambiarEstado: (ordenId: string, nuevoEstado: EstadoOrden) => void;
  onIrARetencion?: () => void;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  ordenes,
  clientes,
  equipos,
  tecnicos,
  recordatoriosMantenimiento = [],
  onSeleccionarOrden,
  onNuevaOrden,
  onCambiarEstado,
  onIrARetencion,
}) => {
  const [modoVista, setModoVista] = useState<'kanban' | 'tabla'>('kanban');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTecnico, setFiltroTecnico] = useState<string>('todos');
  const [filtroMarca, setFiltroMarca] = useState<string>('todos');

  // Mapeos rápidos para evitar búsquedas O(N) repetidas
  const clientesMap = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const equiposMap = useMemo(() => new Map(equipos.map((e) => [e.id, e])), [equipos]);
  const tecnicosMap = useMemo(() => new Map(tecnicos.map((t) => [t.id, t])), [tecnicos]);

  // Métricas clave
  const metricas = useMemo(() => {
    const activas = ordenes.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado').length;
    const enDiagnostico = ordenes.filter((o) => o.estado === 'en_diagnostico').length;
    const esperandoAprobacion = ordenes.filter((o) => o.estado === 'esperando_aprobacion').length;
    const listosEntrega = ordenes.filter((o) => o.estado === 'listo_entrega').length;
    const entregadas = ordenes.filter((o) => o.estado === 'entregado').length;

    return { activas, enDiagnostico, esperandoAprobacion, listosEntrega, entregadas };
  }, [ordenes]);

  // Filtrado reactivo
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((o) => {
      const cli = clientesMap.get(o.clienteId);
      const eq = equiposMap.get(o.equipoId);

      // Filtro texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const enCodigo = o.codigo.toLowerCase().includes(query);
        const enFalla = o.fallaReportada.toLowerCase().includes(query);
        const enCliente = cli ? (cli.nombre.toLowerCase().includes(query) || cli.documento.includes(query) || cli.telefono.includes(query)) : false;
        const enEquipo = eq ? (eq.marca.toLowerCase().includes(query) || eq.modelo.toLowerCase().includes(query) || eq.numeroSerie.toLowerCase().includes(query)) : false;

        if (!enCodigo && !enFalla && !enCliente && !enEquipo) {
          return false;
        }
      }

      // Filtro estado
      if (filtroEstado !== 'todos' && o.estado !== filtroEstado) {
        return false;
      }

      // Filtro técnico
      if (filtroTecnico !== 'todos' && o.tecnicoId !== filtroTecnico) {
        return false;
      }

      // Filtro marca
      if (filtroMarca !== 'todos') {
        if (!eq || eq.marca !== filtroMarca) return false;
      }

      return true;
    });
  }, [ordenes, busqueda, filtroEstado, filtroTecnico, filtroMarca, clientesMap, equiposMap]);

  // Columnas Kanban principales
  const columnasKanban: Array<{ estado: EstadoOrden; titulo: string }> = [
    { estado: 'recibido', titulo: 'Recibido' },
    { estado: 'en_diagnostico', titulo: 'En Diagnóstico' },
    { estado: 'esperando_aprobacion', titulo: 'Esperando Aprobación' },
    { estado: 'en_reparacion', titulo: 'En Reparación' },
    { estado: 'esperando_repuesto', titulo: 'Esperando Repuesto' },
    { estado: 'listo_entrega', titulo: 'Listo para Retiro' },
  ];

  const recordatoriosPendientes = recordatoriosMantenimiento.filter(
    (r) => r.estado === 'proximo' || r.estado === 'vencido'
  );

  return (
    <div className="space-y-6">
      {/* Banner de Alerta de Retención (9 a 12 meses) */}
      {recordatoriosPendientes.length > 0 && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Alerta de Mantenimiento Preventivo (9 a 12 Meses)
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                  {recordatoriosPendientes.length} clientes por contactar
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                Hay clientes que alcanzaron su ciclo preventivo de limpieza de tina, desincrustación o serpentín. Envíe recordatorios por WhatsApp con 1 clic.
              </p>
            </div>
          </div>

          {onIrARetencion && (
            <button
              type="button"
              onClick={onIrARetencion}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Clientes en Retención</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 1. Franja de Métricas / KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Órdenes Activas</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {metricas.activas}
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 inline-block">
              En proceso de taller
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">En Diagnóstico</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {metricas.enDiagnostico}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 inline-block">
              Evaluación técnica
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Esperando Aprobación</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400 mt-1">
              {metricas.esperandoAprobacion}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 inline-block">
              Presupuestos emitidos
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Listos para Retiro</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {metricas.listosEntrega}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 inline-block">
              Reparados y probados
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Controles de Vista */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Buscador inteligente */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código OT, cliente, teléfono, marca (LG, Samsung...), modelo o falla..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Toggle de vistas Kanban / Tabla */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-end md:self-auto shrink-0">
            <button
              onClick={() => setModoVista('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                modoVista === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Tablero Kanban</span>
            </button>
            <button
              onClick={() => setModoVista('tabla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                modoVista === 'tabla'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabla Detallada</span>
            </button>
          </div>
        </div>

        {/* Filtros secundarios */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filtrar:</span>
          </div>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="todos">Todos los Estados</option>
            {Object.entries(ESTADOS_ORDEN_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Filtro Técnico */}
          <select
            value={filtroTecnico}
            onChange={(e) => setFiltroTecnico(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="todos">Todos los Técnicos</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>

          {/* Filtro Marca */}
          <select
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="todos">Todas las Marcas</option>
            <option value="LG">LG</option>
            <option value="Samsung">Samsung</option>
            <option value="Whirlpool">Whirlpool</option>
            <option value="Mabe">Mabe</option>
            <option value="Electrolux">Electrolux</option>
          </select>

          {(busqueda || filtroEstado !== 'todos' || filtroTecnico !== 'todos' || filtroMarca !== 'todos') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('todos');
                setFiltroTecnico('todos');
                setFiltroMarca('todos');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Limpiar Filtros
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-500 font-mono">
            {ordenesFiltradas.length} órdenes encontradas
          </div>
        </div>
      </div>

      {/* 3. Contenido de Vista: Kanban o Tabla */}
      {modoVista === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px]">
            {columnasKanban.map((col) => {
              const ordenesColumna = ordenesFiltradas.filter((o) => o.estado === col.estado);
              const configEstado = ESTADOS_ORDEN_CONFIG[col.estado];

              return (
                <div
                  key={col.estado}
                  className="w-80 shrink-0 flex flex-col bg-slate-100/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800"
                >
                  {/* Encabezado Columna */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${configEstado.colorBorde.replace('border-', 'bg-')}`}></span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {col.titulo}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium shadow-xs">
                      {ordenesColumna.length}
                    </span>
                  </div>

                  {/* Lista de tarjetas */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[640px] pr-1">
                    {ordenesColumna.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        Sin órdenes en este estado
                      </div>
                    ) : (
                      ordenesColumna.map((orden) => {
                        const cliente = clientesMap.get(orden.clienteId);
                        const equipo = equiposMap.get(orden.equipoId);
                        const tecnico = orden.tecnicoId ? tecnicosMap.get(orden.tecnicoId) : null;
                        const totalPagado = orden.pagos.reduce((acc, p) => acc + p.monto, 0);
                        const totalPresupuesto = orden.presupuesto?.total || 0;
                        const saldoPendiente = Math.max(0, totalPresupuesto - totalPagado);

                        return (
                          <div
                            key={orden.id}
                            onClick={() => onSeleccionarOrden(orden.id)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all space-y-2.5"
                          >
                            {/* Header de tarjeta */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                {orden.codigo}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>{formatearFechaCorta(orden.fechaIngreso)}</span>
                              </div>
                            </div>

                            {/* Equipo y Falla */}
                            <div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="text-blue-600 font-bold">{equipo?.marca}</span>
                                <span className="text-slate-400">·</span>
                                <span className="truncate">{equipo?.tipo} {equipo?.modelo}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                                {orden.fallaReportada}
                              </p>
                            </div>

                            {/* Cliente */}
                            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                              <span className="truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-300">
                                {cliente?.nombre}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {cliente?.telefono.slice(-8)}
                              </span>
                            </div>

                            {/* Presupuesto y Saldo si existe */}
                            {orden.presupuesto && (
                              <div className="bg-slate-50 dark:bg-slate-800/60 rounded px-2.5 py-1.5 text-[11px] flex items-center justify-between font-mono">
                                <span className="text-slate-500">Total:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {formatearMoneda(orden.presupuesto.total)}
                                </span>
                              </div>
                            )}

                            {/* Footer de tarjeta: Técnico */}
                            <div className="flex items-center justify-between pt-1 text-[11px]">
                              <span className="text-slate-500 text-[10px] flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[130px]">
                                  {tecnico ? tecnico.nombre : 'Sin asignar'}
                                </span>
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-[11px] flex items-center gap-0.5">
                                Ver <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vista Tabla */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Orden</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Electrodoméstico</th>
                  <th className="py-3 px-4 font-semibold">Falla Reportada</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold">Técnico</th>
                  <th className="py-3 px-4 font-semibold">Total / Saldo</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ordenesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No se encontraron órdenes con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  ordenesFiltradas.map((orden) => {
                    const cliente = clientesMap.get(orden.clienteId);
                    const equipo = equiposMap.get(orden.equipoId);
                    const tecnico = orden.tecnicoId ? tecnicosMap.get(orden.tecnicoId) : null;
                    const configEstado = ESTADOS_ORDEN_CONFIG[orden.estado];
                    const totalPagado = orden.pagos.reduce((acc, p) => acc + p.monto, 0);
                    const totalPresupuesto = orden.presupuesto?.total || 0;
                    const saldo = Math.max(0, totalPresupuesto - totalPagado);

                    return (
                      <tr
                        key={orden.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {orden.codigo}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {formatearFechaCorta(orden.fechaIngreso)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {cliente?.nombre}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {cliente?.telefono}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {equipo?.marca} · {equipo?.tipo}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {equipo?.modelo} (S/N: {equipo?.numeroSerie})
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400" title={orden.fallaReportada}>
                          {orden.fallaReportada}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md ${configEstado.colorBadge}`}
                          >
                            {configEstado.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {tecnico ? tecnico.nombre : <span className="text-slate-400 italic">Sin asignar</span>}
                        </td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          {orden.presupuesto ? (
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatearMoneda(orden.presupuesto.total)}
                              </span>
                              {saldo > 0 ? (
                                <div className="text-[10px] text-amber-600">
                                  Resta: {formatearMoneda(saldo)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-600 font-semibold">
                                  Pagado
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => onSeleccionarOrden(orden.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Abrir</span>
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
      )}
    </div>
  );
};
