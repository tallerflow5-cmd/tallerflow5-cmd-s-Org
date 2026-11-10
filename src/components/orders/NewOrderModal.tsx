import React, { useState } from 'react';
import {
  Cliente,
  Equipo,
  Tecnico,
  TipoElectrodomestico,
  MarcaElectrodomestico,
} from '../../types/taller';
import {
  X,
  PlusCircle,
  User,
  Wrench,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  equipos: Equipo[];
  tecnicos: Tecnico[];
  onSubmit: (datos: any) => void;
  codigoSugerido: string;
}

const TIPOS_ELECTRODOMESTICOS: TipoElectrodomestico[] = [
  'Lavadora',
  'Nevera',
  'Secadora',
  'Microondas',
  'Lavavajillas',
  'Aire Acondicionado',
  'Estufa / Horno',
  'Otro',
];

const MARCAS_PRINCIPALES: MarcaElectrodomestico[] = [
  'LG',
  'Samsung',
  'Whirlpool',
  'Mabe',
  'Electrolux',
  'Haceb',
  'General Electric',
  'Bosch',
  'Otra',
];

const FALLAS_FRECUENTES_SUGERIDAS = [
  'No desagua / Error OE o drenaje obstruido',
  'No enfría conservador, congelador lleno de escarcha',
  'No entra agua / Error 4E electroválvula',
  'Vibración y ruido excesivo al centrifugar',
  'Chispas y zumbido interno en cavidad',
  'No enciende / Tarjeta de control sin energía',
];

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  clientes,
  equipos,
  tecnicos,
  onSubmit,
  codigoSugerido,
}) => {
  if (!isOpen) return null;

  // Estado del formulario
  const [modoCliente, setModoCliente] = useState<'existente' | 'nuevo'>('nuevo');
  const [clienteExistenteId, setClienteExistenteId] = useState<string>(clientes[0]?.id || '');

  // Datos nuevo cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDoc, setNuevoDoc] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [nuevaDir, setNuevaDir] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');

  // Modo equipo
  const [modoEquipo, setModoEquipo] = useState<'existente' | 'nuevo'>('nuevo');
  const [equipoExistenteId, setEquipoExistenteId] = useState<string>('');

  // Datos nuevo equipo
  const [tipoEquipo, setTipoEquipo] = useState<TipoElectrodomestico>('Lavadora');
  const [marcaEquipo, setMarcaEquipo] = useState<MarcaElectrodomestico | string>('LG');
  const [modeloEquipo, setModeloEquipo] = useState('');
  const [serialEquipo, setSerialEquipo] = useState('');

  // Datos orden
  const [fallaReportada, setFallaReportada] = useState('');
  const [accesorios, setAccesorios] = useState('');
  const [observacionesVisuales, setObservacionesVisuales] = useState('');
  const [prioridad, setPrioridad] = useState<'baja' | 'normal' | 'alta' | 'urgente'>('normal');
  const [tecnicoId, setTecnicoId] = useState<string>(tecnicos[0]?.id || '');
  const [fechaPrometida, setFechaPrometida] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

  // Equipos del cliente seleccionado si modo existente
  const equiposDelCliente = equipos.filter((e) => e.clienteId === clienteExistenteId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion('');

    // Validar cliente
    if (modoCliente === 'nuevo') {
      if (!nuevoNombre.trim() || !nuevoTel.trim()) {
        setErrorValidacion('Por favor ingrese al menos el nombre y teléfono del cliente.');
        return;
      }
    } else {
      if (!clienteExistenteId) {
        setErrorValidacion('Seleccione un cliente registrado.');
        return;
      }
    }

    // Validar equipo
    if (modoEquipo === 'nuevo') {
      if (!modeloEquipo.trim() && !serialEquipo.trim()) {
        setErrorValidacion('Por favor indique al menos el modelo o número de serie del electrodoméstico.');
        return;
      }
    } else {
      if (!equipoExistenteId) {
        setErrorValidacion('Seleccione un equipo registrado del cliente.');
        return;
      }
    }

    // Validar falla
    if (!fallaReportada.trim()) {
      setErrorValidacion('Describa la falla reportada por el cliente.');
      return;
    }

    const payload = {
      clienteExistenteId: modoCliente === 'existente' ? clienteExistenteId : undefined,
      nuevoCliente:
        modoCliente === 'nuevo'
          ? {
              nombre: nuevoNombre.trim(),
              documento: nuevoDoc.trim() || 'S/D',
              telefono: nuevoTel.trim(),
              email: nuevoEmail.trim() || '',
              direccion: nuevaDir.trim() || '',
              ciudad: 'Bogotá',
            }
          : undefined,
      equipoExistenteId: modoEquipo === 'existente' ? equipoExistenteId : undefined,
      nuevoEquipo:
        modoEquipo === 'nuevo'
          ? {
              tipo: tipoEquipo,
              marca: marcaEquipo,
              modelo: modeloEquipo.trim() || 'Estándar',
              numeroSerie: serialEquipo.trim() || `SN-${Date.now().toString().slice(-6)}`,
            }
          : undefined,
      orden: {
        fallaReportada: fallaReportada.trim(),
        accesorios: accesorios.trim(),
        observacionesVisuales: observacionesVisuales.trim(),
        prioridad,
        tecnicoId: tecnicoId || undefined,
        fechaPrometida: fechaPrometida || undefined,
        notaInicial: `Ingreso en mostrador recepcionado por taller.`,
      },
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {codigoSugerido}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recepción de Equipo · Nueva Orden de Trabajo
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro completo de cliente, electrodoméstico y falla reportada.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorValidacion && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* 1. Datos del Cliente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Información del Cliente</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModoCliente('nuevo')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    modoCliente === 'nuevo'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Nuevo Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setModoCliente('existente')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    modoCliente === 'existente'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cliente Existente
                </button>
              </div>
            </div>

            {modoCliente === 'existente' ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Seleccionar Cliente del Directorio:
                </label>
                <select
                  value={clienteExistenteId}
                  onChange={(e) => {
                    setClienteExistenteId(e.target.value);
                    setModoEquipo('nuevo');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} · Tel: {c.telefono} · DNI: {c.documento}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nombre Completo o Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej. Carolina Gómez"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Teléfono Celular *
                  </label>
                  <input
                    type="tel"
                    required
                    value={nuevoTel}
                    onChange={(e) => setNuevoTel(e.target.value)}
                    placeholder="Ej. +57 310 123 4567"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Documento de Identidad (Cédula/NIT)
                  </label>
                  <input
                    type="text"
                    value={nuevoDoc}
                    onChange={(e) => setNuevoDoc(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Dirección de Residencia / Taller
                  </label>
                  <input
                    type="text"
                    value={nuevaDir}
                    onChange={(e) => setNuevaDir(e.target.value)}
                    placeholder="Ej. Cra 11 # 95-20"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Datos del Electrodoméstico */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>2. Electrodoméstico de Línea Blanca</span>
              </div>
              {modoCliente === 'existente' && equiposDelCliente.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setModoEquipo('existente')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      modoEquipo === 'existente'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    Equipo Registrado ({equiposDelCliente.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoEquipo('nuevo')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      modoEquipo === 'nuevo'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    Otro Equipo
                  </button>
                </div>
              )}
            </div>

            {modoEquipo === 'existente' && equiposDelCliente.length > 0 ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Seleccionar Equipo del Cliente:
                </label>
                <select
                  value={equipoExistenteId}
                  onChange={(e) => setEquipoExistenteId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">-- Seleccionar --</option>
                  {equiposDelCliente.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.marca} {eq.tipo} - Modelo: {eq.modelo} (Serial: {eq.numeroSerie})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tipo de Aparato *
                  </label>
                  <select
                    value={tipoEquipo}
                    onChange={(e) => setTipoEquipo(e.target.value as TipoElectrodomestico)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {TIPOS_ELECTRODOMESTICOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Marca *
                  </label>
                  <select
                    value={marcaEquipo}
                    onChange={(e) => setMarcaEquipo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {MARCAS_PRINCIPALES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Modelo Comercial
                  </label>
                  <input
                    type="text"
                    value={modeloEquipo}
                    onChange={(e) => setModeloEquipo(e.target.value)}
                    placeholder="Ej. Inverter DirectDrive 18kg"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Número de Serie / Placa
                  </label>
                  <input
                    type="text"
                    value={serialEquipo}
                    onChange={(e) => setSerialEquipo(e.target.value)}
                    placeholder="Ej. LG-994812"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Falla y Detalles de Servicio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Motivo de Ingreso & Falla Reportada
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Descripción Detallada del Síntoma o Avería *
                </label>
              </div>
              <textarea
                required
                rows={3}
                value={fallaReportada}
                onChange={(e) => setFallaReportada(e.target.value)}
                placeholder="Describa el comportamiento anómalo: ruidos, códigos en display, fugas de agua, calentamiento..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />

              {/* Botones de sugerencias rápidas */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 self-center">Sugerencias rápidas:</span>
                {FALLAS_FRECUENTES_SUGERIDAS.map((falla, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFallaReportada(falla)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    + {falla.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Accesorios Entregados
                </label>
                <input
                  type="text"
                  value={accesorios}
                  onChange={(e) => setAccesorios(e.target.value)}
                  placeholder="Ej. Manguera, plato de vidrio, cable"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Técnico Asignado
                </label>
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="">Por Asignar en Taller</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.especialidad.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prioridad
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="normal">Normal (48 - 72 hrs)</option>
                  <option value="alta">Alta (24 hrs)</option>
                  <option value="urgente">Urgente (Mismo día)</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Registrar Orden y Abrir Ficha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
