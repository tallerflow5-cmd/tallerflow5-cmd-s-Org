import React, { useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Database,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileJson,
} from 'lucide-react';

interface BackupViewProps {
  onExportarJSON: () => string;
  onImportarJSON: (jsonStr: string) => boolean;
  onReiniciarDemo: () => void;
  stats: {
    totalOrdenes: number;
    totalClientes: number;
    totalEquipos: number;
    totalRepuestos: number;
    totalDocumentosOCR: number;
  };
}

export const BackupView: React.FC<BackupViewProps> = ({
  onExportarJSON,
  onImportarJSON,
  onReiniciarDemo,
  stats,
}) => {
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleDescargarBackup = () => {
    const jsonStr = onExportarJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `tallerflow_backup_${fecha}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMensaje({
      tipo: 'exito',
      texto: 'Respaldo completo exportado y descargado exitosamente en archivo JSON.',
    });
  };

  const handleSubirBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      const exito = onImportarJSON(contenido);
      if (exito) {
        setMensaje({
          tipo: 'exito',
          texto: 'Base de datos de TallerFlow restaurada correctamente desde el archivo.',
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: 'El archivo JSON no tiene la estructura válida de TallerFlow.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleReiniciarDemoClick = () => {
    if (
      window.confirm(
        '¿Desea restaurar los datos de demostración iniciales de línea blanca (LG, Samsung, Whirlpool, Mabe)?'
      )
    ) {
      onReiniciarDemo();
      setMensaje({
        tipo: 'exito',
        texto: 'Datos de demostración restaurados exitosamente.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabecera */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-1">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Respaldo de Base de Datos y Mantenimiento
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Descargue copias de seguridad portátiles en formato JSON, restaure información previa o reinicie los datos del taller.
        </p>
      </div>

      {mensaje && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {mensaje.tipo === 'exito' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Resumen de Datos Almacenados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono">
          <span className="text-[11px] text-slate-400 font-sans block">Órdenes de Trabajo</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.totalOrdenes}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono">
          <span className="text-[11px] text-slate-400 font-sans block">Clientes Registrados</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.totalClientes}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono">
          <span className="text-[11px] text-slate-400 font-sans block">Repuestos en Catálogo</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.totalRepuestos}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono">
          <span className="text-[11px] text-slate-400 font-sans block">Documentos OCR</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.totalDocumentosOCR}
          </div>
        </div>
      </div>

      {/* Acciones de Respaldo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Exportar Respaldo Completo
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Genera un archivo JSON descargable con todas las órdenes de servicio, clientes, repuestos, notas y comprobantes del taller para resguardo o migración.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDescargarBackup}
            className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Archivo JSON</span>
          </button>
        </div>

        {/* Importar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Restaurar desde Respaldo
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seleccione un archivo JSON de respaldo de TallerFlow previamente exportado para recuperar la base de datos completa.
            </p>
          </div>

          <div>
            <input
              type="file"
              id="file-backup-upload"
              accept=".json,application/json"
              onChange={handleSubirBackup}
              className="hidden"
            />
            <label
              htmlFor="file-backup-upload"
              className="w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Seleccionar Archivo JSON</span>
            </label>
          </div>
        </div>
      </div>

      {/* Zona de Peligro / Restaurar Demo */}
      <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Restablecer Datos Demo Iniciales
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Recarga los técnicos, repuestos de catálogo y órdenes iniciales de línea blanca (LG, Samsung, Whirlpool, Mabe).
          </p>
        </div>

        <button
          type="button"
          onClick={handleReiniciarDemoClick}
          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Datos Demo</span>
        </button>
      </div>
    </div>
  );
};
