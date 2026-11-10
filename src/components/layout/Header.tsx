import React from 'react';
import { Wrench, Plus, Sun, Moon, Bell } from 'lucide-react';

interface HeaderProps {
  onNuevaOrden: () => void;
  onDigitalizarOCR: () => void;
  esModoOscuro: boolean;
  onAlternarModoOscuro: () => void;
  seccionActiva: string;
  onCambiarSeccion: (seccion: string) => void;
  alertasStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNuevaOrden,
  onDigitalizarOCR,
  esModoOscuro,
  onAlternarModoOscuro,
  seccionActiva,
  onCambiarSeccion,
  alertasStockCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zona 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <Wrench className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            TallerFlow
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Línea Blanca Multimarca
          </span>
        </div>
      </div>

      {/* Zona 2: Enlaces rápidos de navegación */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => onCambiarSeccion('dashboard')}
          className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${
            seccionActiva === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
        >
          Tablero de Órdenes
        </button>
        <button
          onClick={() => onCambiarSeccion('inventario')}
          className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            seccionActiva === 'inventario' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
        >
          Inventario
          {alertasStockCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {alertasStockCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onCambiarSeccion('clientes')}
          className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${
            seccionActiva === 'clientes' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
        >
          Historial Clientes
        </button>
        <button
          onClick={() => onCambiarSeccion('ocr')}
          className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${
            seccionActiva === 'ocr' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
        >
          Ingesta OCR
        </button>
        <button
          onClick={() => onCambiarSeccion('retencion')}
          className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            seccionActiva === 'retencion' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
        >
          <span>Retención (9-12m)</span>
        </button>
        <button
          onClick={() => onCambiarSeccion('pruebas')}
          className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${
            seccionActiva === 'pruebas' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
        >
          Suite de Pruebas
        </button>
      </nav>

      {/* Zona 3: Acciones primarias */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onAlternarModoOscuro}
          title={esModoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Alternar tema"
        >
          {esModoOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onDigitalizarOCR}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Escanear Doc
        </button>

        <button
          onClick={onNuevaOrden}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden</span>
        </button>
      </div>
    </header>
  );
};
