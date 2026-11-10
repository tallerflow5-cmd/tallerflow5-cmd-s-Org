import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Users,
  FileScan,
  CheckCircle2,
  Database,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';

interface SidebarProps {
  seccionActiva: string;
  onCambiarSeccion: (seccion: string) => void;
  ordenesActivasCount: number;
  alertasStockCount: number;
  alertasRetencionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  seccionActiva,
  onCambiarSeccion,
  ordenesActivasCount,
  alertasStockCount,
  alertasRetencionCount = 0,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tablero de Órdenes',
      icon: LayoutDashboard,
      badge: ordenesActivasCount > 0 ? ordenesActivasCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      id: 'nueva_orden',
      label: 'Recepción / Nueva OT',
      icon: PlusCircle,
    },
    {
      id: 'inventario',
      label: 'Inventario de Repuestos',
      icon: Package,
      badge: alertasStockCount > 0 ? `${alertasStockCount} bajos` : undefined,
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      id: 'clientes',
      label: 'Clientes & Equipos',
      icon: Users,
    },
    {
      id: 'retencion',
      label: 'Retención (9 a 12m)',
      icon: CalendarClock,
      badge: alertasRetencionCount > 0 ? `${alertasRetencionCount} alertas` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      id: 'ocr',
      label: 'Ingesta OCR (Paperless)',
      icon: FileScan,
    },
    {
      id: 'pruebas',
      label: 'Suite de Pruebas',
      icon: CheckCircle2,
    },
    {
      id: 'respaldo',
      label: 'Respaldo & Ajustes',
      icon: Database,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 transition-colors">
      <div className="space-y-6">
        {/* Título de sección */}
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-3">
            Operaciones del Taller
          </span>
          <nav className="mt-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const activo = seccionActiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onCambiarSeccion(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activo
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${activo ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Marcas de soporte */}
        <div className="px-3 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Marcas Homologadas</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Especialidad en repuestos y protocolos de servicio: LG, Samsung, Whirlpool, Mabe.
          </p>
        </div>
      </div>

      {/* Footer de la barra lateral */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-2">
        <span>TallerFlow MVP v1.0</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Listo
        </span>
      </div>
    </aside>
  );
};
