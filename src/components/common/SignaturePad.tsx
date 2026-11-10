import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, PenTool, X } from 'lucide-react';

interface SignaturePadProps {
  onGuardarFirma: (base64: string) => void;
  onCancelar?: () => void;
  clienteNombre?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onGuardarFirma,
  onCancelar,
  clienteNombre,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneTrazos, setTieneTrazos] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Inicializar canvas con escalado para pantallas Retina / Móviles
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a'; // Tinta oscura azulada elegante
  }, []);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const iniciarDibujo = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      // Prevenir scroll en pantalla táctil mientras se firma
      e.stopPropagation();
    }
    const coords = getCoordinates(e);
    if (!coords) return;

    setDibujando(true);
    lastPosRef.current = coords;
  };

  const dibujar = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dibujando || !lastPosRef.current) return;
    if ('touches' in e) {
      e.preventDefault(); // Detiene scroll del navegador
      e.stopPropagation();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
    if (!tieneTrazos) {
      setTieneTrazos(true);
    }
  };

  const detenerDibujo = () => {
    setDibujando(false);
    lastPosRef.current = null;
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazos(false);
  };

  const guardarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas || !tieneTrazos) return;

    // Exportar como imagen PNG base64
    const base64 = canvas.toDataURL('image/png');
    onGuardarFirma(base64);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Captura de Firma Táctil del Cliente
            </h4>
            <span className="text-[11px] text-slate-500">
              {clienteNombre ? `Firma de conformidad de: ${clienteNombre}` : 'Recepción a conformidad'}
            </span>
          </div>
        </div>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Área del Canvas Táctil */}
      <div className="relative bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={iniciarDibujo}
          onMouseMove={dibujar}
          onMouseUp={detenerDibujo}
          onMouseLeave={detenerDibujo}
          onTouchStart={iniciarDibujo}
          onTouchMove={dibujar}
          onTouchEnd={detenerDibujo}
          className="w-full h-44 block select-none"
        />

        {/* Guía visual para firma */}
        {!tieneTrazos && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
            <span className="font-medium">Firme aquí con el dedo o lápiz óptico</span>
            <span className="text-[10px] text-slate-400/80 mt-1">
              (Acepto la entrega y conformidad del servicio técnico)
            </span>
          </div>
        )}

        {/* Línea base de firma */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-slate-300 dark:border-slate-800 pointer-events-none flex justify-between text-[10px] text-slate-400">
          <span>X</span>
          <span>Firma del titular</span>
        </div>
      </div>

      {/* Controles de Acción */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={limpiarFirma}
          disabled={!tieneTrazos}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Borrar y Repetir</span>
        </button>

        <div className="flex items-center gap-2">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            disabled={!tieneTrazos}
            onClick={guardarFirma}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg shadow-sm shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Firma en Orden</span>
          </button>
        </div>
      </div>
    </div>
  );
};
