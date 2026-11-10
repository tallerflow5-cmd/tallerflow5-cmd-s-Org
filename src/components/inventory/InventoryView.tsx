import React, { useState, useMemo } from 'react';
import { Repuesto, MarcaElectrodomestico } from '../../types/taller';
import { formatearMoneda } from '../../utils/formatters';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Check,
  X,
  Edit,
  TrendingDown,
} from 'lucide-react';

interface InventoryViewProps {
  repuestos: Repuesto[];
  onGuardarRepuesto: (rep: Omit<Repuesto, 'id'> & { id?: string }) => void;
  onAjustarStock: (repuestoId: string, delta: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  repuestos,
  onGuardarRepuesto,
  onAjustarStock,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarca, setFiltroMarca] = useState<string>('todos');
  const [soloBajoStock, setSoloBajoStock] = useState<boolean>(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [repuestoEditando, setRepuestoEditando] = useState<Repuesto | null>(null);

  // Formulario nuevo/editar
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState<string>('LG');
  const [categoria, setCategoria] = useState('Bombas y Motores');
  const [stockActual, setStockActual] = useState(5);
  const [stockMinimo, setStockMinimo] = useState(2);
  const [precioCosto, setPrecioCosto] = useState(30000);
  const [precioVenta, setPrecioVenta] = useState(65000);
  const [ubicacion, setUbicacion] = useState('Estante A-1');

  // Métricas
  const totalItems = repuestos.length;
  const itemsBajoStock = repuestos.filter((r) => r.stockActual <= r.stockMinimo);
  const valorTotalInventario = repuestos.reduce((acc, r) => acc + r.stockActual * r.precioCosto, 0);

  // Repuestos filtrados
  const repuestosFiltrados = useMemo(() => {
    return repuestos.filter((r) => {
      if (soloBajoStock && r.stockActual > r.stockMinimo) return false;
      if (filtroMarca !== 'todos' && r.marca !== filtroMarca) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return (
          r.codigo.toLowerCase().includes(q) ||
          r.nombre.toLowerCase().includes(q) ||
          r.categoria.toLowerCase().includes(q) ||
          r.marca.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [repuestos, busqueda, filtroMarca, soloBajoStock]);

  const abrirModalCrear = () => {
    setRepuestoEditando(null);
    setCodigo(`REP-${Date.now().toString().slice(-4)}`);
    setNombre('');
    setMarca('LG');
    setCategoria('Bombas y Motores');
    setStockActual(5);
    setStockMinimo(2);
    setPrecioCosto(40000);
    setPrecioVenta(80000);
    setUbicacion('Estante A-1');
    setModalAbierto(true);
  };

  const abrirModalEditar = (rep: Repuesto) => {
    setRepuestoEditando(rep);
    setCodigo(rep.codigo);
    setNombre(rep.nombre);
    setMarca(rep.marca);
    setCategoria(rep.categoria);
    setStockActual(rep.stockActual);
    setStockMinimo(rep.stockMinimo);
    setPrecioCosto(rep.precioCosto);
    setPrecioVenta(rep.precioVenta);
    setUbicacion(rep.ubicacion || 'Estante A-1');
    setModalAbierto(true);
  };

  const handleSubmitRepuesto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim()) return;

    onGuardarRepuesto({
      id: repuestoEditando ? repuestoEditando.id : undefined,
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      marca,
      categoria,
      stockActual: Number(stockActual) || 0,
      stockMinimo: Number(stockMinimo) || 1,
      precioCosto: Number(precioCosto) || 0,
      precioVenta: Number(precioVenta) || 0,
      ubicacion: ubicacion.trim(),
    });

    setModalAbierto(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Catálogo de Piezas (SKUs)</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {totalItems}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              Línea blanca multimarca
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSoloBajoStock(!soloBajoStock)}
          className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
            itemsBajoStock.length > 0
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Alertas de Stock Bajo
            </span>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
              {itemsBajoStock.length}
            </div>
            <span className="text-[11px] text-amber-600 underline mt-0.5 inline-block">
              {soloBajoStock ? 'Mostrando solo bajo stock (clic para ver todos)' : 'Clic para filtrar críticos'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Valoración de Stock (Costo)</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {formatearMoneda(valorTotalInventario)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              Capital invertido en bodega
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 rotate-180" />
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Botón Nuevo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código (ej. LG-PUMP), nombre de pieza o categoría..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            <option value="todos">Todas las Marcas</option>
            <option value="LG">LG</option>
            <option value="Samsung">Samsung</option>
            <option value="Whirlpool">Whirlpool</option>
            <option value="Mabe">Mabe</option>
            <option value="Genérico">Genérico</option>
          </select>
        </div>

        <button
          onClick={abrirModalCrear}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition-all flex items-center gap-1.5 self-end sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Repuesto</span>
        </button>
      </div>

      {/* 3. Tabla de Catálogo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px]">
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Descripción / Pieza</th>
                <th className="py-3 px-4 font-semibold">Marca Compatible</th>
                <th className="py-3 px-4 font-semibold">Ubicación</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Actual</th>
                <th className="py-3 px-4 font-semibold text-right">P. Venta</th>
                <th className="py-3 px-4 font-semibold text-center">Ajuste Rápido</th>
                <th className="py-3 px-4 font-semibold text-right">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {repuestosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron repuestos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                repuestosFiltrados.map((r) => {
                  const esCritico = r.stockActual <= r.stockMinimo;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {r.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{r.nombre}</div>
                        <div className="text-[11px] text-slate-400">{r.categoria}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{r.marca}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {r.ubicacion || 'Bodega'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                              esCritico
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {r.stockActual}
                          </span>
                          {esCritico && (
                            <span className="text-[10px] text-amber-600 font-semibold" title="Bajo stock mínimo">
                              Min: {r.stockMinimo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatearMoneda(r.precioVenta)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded p-1">
                          <button
                            type="button"
                            onClick={() => onAjustarStock(r.id, -1)}
                            disabled={r.stockActual <= 0}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-30 transition-colors"
                            title="Descontar 1 unidad"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => onAjustarStock(r.id, 1)}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition-colors"
                            title="Sumar 1 unidad recibida"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(r)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar detalles del repuesto"
                        >
                          <Edit className="w-3.5 h-3.5" />
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

      {/* Modal para Crear / Editar Repuesto */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {repuestoEditando ? 'Editar Pieza de Repuesto' : 'Alta de Nuevo Repuesto'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRepuesto} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Código de Referencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Marca Compatible *
                  </label>
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="LG">LG</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Whirlpool">Whirlpool</option>
                    <option value="Mabe">Mabe</option>
                    <option value="Electrolux">Electrolux</option>
                    <option value="Genérico">Genérico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nombre o Descripción Técnica *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Bomba de Drenaje 110V TurboWash"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Ubicación en Taller
                  </label>
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Estante A-2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockActual}
                    onChange={(e) => setStockActual(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Precio de Costo (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Precio de Venta al Cliente (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {repuestoEditando ? 'Guardar Cambios' : 'Crear Repuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
