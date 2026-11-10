import React, { useState, useMemo } from 'react';
import { Cliente, Equipo, Orden, ESTADOS_ORDEN_CONFIG } from '../../types/taller';
import { formatearMoneda, formatearFechaCorta } from '../../utils/formatters';
import {
  Search,
  User,
  Wrench,
  History,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  PlusCircle,
  Eye,
} from 'lucide-react';

interface CustomersViewProps {
  clientes: Cliente[];
  equipos: Equipo[];
  ordenes: Orden[];
  onSeleccionarOrden: (ordenId: string) => void;
  onNuevaOrdenParaCliente: (clienteId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  clientes,
  equipos,
  ordenes,
  onSeleccionarOrden,
  onNuevaOrdenParaCliente,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>(clientes[0]?.id || '');

  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientes;
    const q = busqueda.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.documento.includes(q) ||
        c.telefono.includes(q) ||
        c.direccion.toLowerCase().includes(q)
    );
  }, [clientes, busqueda]);

  const clienteActivo = clientes.find((c) => c.id === clienteSeleccionadoId) || clientesFiltrados[0];

  // Equipos del cliente activo
  const equiposDelCliente = useMemo(() => {
    if (!clienteActivo) return [];
    return equipos.filter((e) => e.clienteId === clienteActivo.id);
  }, [equipos, clienteActivo]);

  // Órdenes de trabajo del cliente activo
  const ordenesDelCliente = useMemo(() => {
    if (!clienteActivo) return [];
    return ordenes.filter((o) => o.clienteId === clienteActivo.id);
  }, [ordenes, clienteActivo]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Directorio de Clientes */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[750px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Directorio de Clientes
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {clientes.length} registrados
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cédula o celular..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron clientes.
            </div>
          ) : (
            clientesFiltrados.map((c) => {
              const esSeleccionado = clienteActivo?.id === c.id;
              const cantEquipos = equipos.filter((e) => e.clienteId === c.id).length;
              const cantOrdenes = ordenes.filter((o) => o.clienteId === c.id).length;

              return (
                <div
                  key={c.id}
                  onClick={() => setClienteSeleccionadoId(c.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    esSeleccionado
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-3 border-blue-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {c.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      CC: {c.documento}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{c.telefono}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span>{cantEquipos} equipos</span>
                    <span>·</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {cantOrdenes} órdenes de servicio
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Ficha del Cliente, Equipos e Historial de Reparaciones */}
      <div className="lg:col-span-8 space-y-6">
        {clienteActivo ? (
          <>
            {/* Tarjeta de Ficha de Cliente */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{clienteActivo.nombre}</span>
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    Identificación: {clienteActivo.documento} · Cliente desde {clienteActivo.fechaRegistro}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNuevaOrdenParaCliente(clienteActivo.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Nueva Orden</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{clienteActivo.telefono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{clienteActivo.email || 'Sin correo registrado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{clienteActivo.direccion || 'Sin dirección'}</span>
                </div>
              </div>

              {clienteActivo.notas && (
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 italic">
                  Nota del cliente: {clienteActivo.notas}
                </div>
              )}
            </div>

            {/* Equipos Registrados del Cliente */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Electrodomésticos Vinculados ({equiposDelCliente.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {equiposDelCliente.map((eq) => {
                  const reparacionesEquipo = ordenes.filter((o) => o.equipoId === eq.id);

                  return (
                    <div
                      key={eq.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {eq.marca} · {eq.tipo}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {reparacionesEquipo.length} reparaciones
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Modelo: <strong className="text-slate-800 dark:text-slate-200">{eq.modelo}</strong>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Serial: {eq.numeroSerie}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historial Completo de Órdenes del Cliente */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Historial de Servicios y Reparaciones ({ordenesDelCliente.length})</span>
              </h3>

              {ordenesDelCliente.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border rounded-xl p-8 text-center text-xs text-slate-400">
                  No se registran órdenes para este cliente.
                </div>
              ) : (
                <div className="space-y-3">
                  {ordenesDelCliente.map((ord) => {
                    const eq = equipos.find((e) => e.id === ord.equipoId);
                    const configEstado = ESTADOS_ORDEN_CONFIG[ord.estado];

                    return (
                      <div
                        key={ord.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold text-blue-600">
                              {ord.codigo}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {eq?.marca} {eq?.tipo} ({eq?.modelo})
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${configEstado.colorBadge}`}
                            >
                              {configEstado.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                            Falla: {ord.fallaReportada}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            Fecha de ingreso: {ord.fechaIngreso}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                          {ord.presupuesto && (
                            <div className="text-right font-mono text-xs">
                              <span className="text-slate-400 block text-[10px]">Total</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatearMoneda(ord.presupuesto.total)}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => onSeleccionarOrden(ord.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Orden</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 border rounded-xl">
            Seleccione un cliente para visualizar su historial técnico.
          </div>
        )}
      </div>
    </div>
  );
};
