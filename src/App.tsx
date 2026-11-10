import React, { useState, useEffect } from 'react';
import { useTallerStore } from './store/tallerStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OrdersDashboard } from './components/orders/OrdersDashboard';
import { NewOrderModal } from './components/orders/NewOrderModal';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { PaperlessOCRView } from './components/ocr/PaperlessOCRView';
import { RetentionView } from './components/retention/RetentionView';
import { TestSuiteView } from './components/testing/TestSuiteView';
import { BackupView } from './components/backup/BackupView';
import { EstadoOrden } from './types/taller';

export default function App() {
  const store = useTallerStore();

  const [seccionActiva, setSeccionActiva] = useState<string>('dashboard');
  const [modalNuevaOrdenAbierto, setModalNuevaOrdenAbierto] = useState(false);
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<string | null>(null);

  // Modo Oscuro / Claro
  const [esModoOscuro, setEsModoOscuro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('tallerflow_theme');
      if (guardado) return guardado === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (esModoOscuro) {
      root.classList.add('dark');
      localStorage.setItem('tallerflow_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('tallerflow_theme', 'light');
    }
  }, [esModoOscuro]);

  const alternarModoOscuro = () => {
    setEsModoOscuro((prev) => !prev);
  };

  // Métricas para badges
  const ordenesActivasCount = store.ordenes.filter(
    (o) => o.estado !== 'entregado' && o.estado !== 'cancelado'
  ).length;

  const alertasStockCount = store.repuestos.filter(
    (r) => r.stockActual <= r.stockMinimo
  ).length;

  const alertasRetencionCount = store.recordatoriosMantenimiento.filter(
    (r) => r.estado === 'proximo' || r.estado === 'vencido'
  ).length;

  // Orden activa para el modal de detalle
  const ordenActiva = store.ordenes.find((o) => o.id === ordenSeleccionadaId);
  const clienteDeOrdenActiva = ordenActiva
    ? store.clientes.find((c) => c.id === ordenActiva.clienteId)
    : undefined;
  const equipoDeOrdenActiva = ordenActiva
    ? store.equipos.find((e) => e.id === ordenActiva.equipoId)
    : undefined;

  const handleCrearOrdenSubmit = (datos: any) => {
    const nueva = store.crearOrden(datos);
    setOrdenSeleccionadaId(nueva.id);
  };

  const handleNuevaOrdenParaCliente = (clienteId: string) => {
    setModalNuevaOrdenAbierto(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Cabecera Superior (Top Bar Contract) */}
      <Header
        onNuevaOrden={() => setModalNuevaOrdenAbierto(true)}
        onDigitalizarOCR={() => setSeccionActiva('ocr')}
        esModoOscuro={esModoOscuro}
        onAlternarModoOscuro={alternarModoOscuro}
        seccionActiva={seccionActiva}
        onCambiarSeccion={(sec) => {
          if (sec === 'nueva_orden') {
            setModalNuevaOrdenAbierto(true);
          } else {
            setSeccionActiva(sec);
          }
        }}
        alertasStockCount={alertasStockCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral de Navegación */}
        <div className="hidden md:flex">
          <Sidebar
            seccionActiva={seccionActiva}
            onCambiarSeccion={(sec) => {
              if (sec === 'nueva_orden') {
                setModalNuevaOrdenAbierto(true);
              } else {
                setSeccionActiva(sec);
              }
            }}
            ordenesActivasCount={ordenesActivasCount}
            alertasStockCount={alertasStockCount}
            alertasRetencionCount={alertasRetencionCount}
          />
        </div>

        {/* Área Principal de Trabajo */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {seccionActiva === 'dashboard' && (
              <OrdersDashboard
                ordenes={store.ordenes}
                clientes={store.clientes}
                equipos={store.equipos}
                tecnicos={store.tecnicos}
                recordatoriosMantenimiento={store.recordatoriosMantenimiento}
                onSeleccionarOrden={(id) => setOrdenSeleccionadaId(id)}
                onNuevaOrden={() => setModalNuevaOrdenAbierto(true)}
                onCambiarEstado={(id, nuevoEstado) => store.actualizarEstadoOrden(id, nuevoEstado)}
                onIrARetencion={() => setSeccionActiva('retencion')}
              />
            )}

            {seccionActiva === 'inventario' && (
              <InventoryView
                repuestos={store.repuestos}
                onGuardarRepuesto={store.guardarRepuesto}
                onAjustarStock={store.ajustarStock}
              />
            )}

            {seccionActiva === 'clientes' && (
              <CustomersView
                clientes={store.clientes}
                equipos={store.equipos}
                ordenes={store.ordenes}
                onSeleccionarOrden={(id) => setOrdenSeleccionadaId(id)}
                onNuevaOrdenParaCliente={handleNuevaOrdenParaCliente}
              />
            )}

            {seccionActiva === 'retencion' && (
              <RetentionView
                recordatorios={store.recordatoriosMantenimiento}
                onActualizarEstado={store.actualizarEstadoRecordatorio}
              />
            )}

            {seccionActiva === 'ocr' && (
              <PaperlessOCRView
                documentos={store.documentosOCR}
                onDocumentoProcesado={store.guardarDocumentoOCR}
                onCrearOrdenDesdeOCR={(datos) => {
                  const nueva = store.crearOrden(datos);
                  setOrdenSeleccionadaId(nueva.id);
                  setSeccionActiva('dashboard');
                }}
                onSumarStockDesdeFactura={(docId) => {
                  store.sumarRepuestosDeFacturaOCR(docId);
                  setSeccionActiva('inventario');
                }}
              />
            )}

            {seccionActiva === 'pruebas' && <TestSuiteView />}

            {seccionActiva === 'respaldo' && (
              <BackupView
                onExportarJSON={store.exportarBackupJSON}
                onImportarJSON={store.importarBackupJSON}
                onReiniciarDemo={store.reiniciarDemo}
                stats={{
                  totalOrdenes: store.ordenes.length,
                  totalClientes: store.clientes.length,
                  totalEquipos: store.equipos.length,
                  totalRepuestos: store.repuestos.length,
                  totalDocumentosOCR: store.documentosOCR.length,
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal Nueva Orden (Recepción Asistida) */}
      <NewOrderModal
        isOpen={modalNuevaOrdenAbierto}
        onClose={() => setModalNuevaOrdenAbierto(false)}
        clientes={store.clientes}
        equipos={store.equipos}
        tecnicos={store.tecnicos}
        onSubmit={handleCrearOrdenSubmit}
        codigoSugerido={store.generarSiguienteCodigoOT()}
      />

      {/* Modal Ficha Detallada de Orden (Diagnóstico, Presupuesto, Pagos, Comprobante) */}
      {ordenActiva && (
        <OrderDetailModal
          orden={ordenActiva}
          cliente={clienteDeOrdenActiva}
          equipo={equipoDeOrdenActiva}
          tecnicos={store.tecnicos}
          repuestosDisponibles={store.repuestos}
          onClose={() => setOrdenSeleccionadaId(null)}
          onActualizarEstado={(nuevoEstado, nota) =>
            store.actualizarEstadoOrden(ordenActiva.id, nuevoEstado, nota)
          }
          onAsignarTecnico={(tecnicoId) => store.asignarTecnico(ordenActiva.id, tecnicoId)}
          onGuardarPresupuesto={(datos) => store.guardarPresupuesto(ordenActiva.id, datos)}
          onAprobarPresupuesto={() => store.aprobarPresupuesto(ordenActiva.id)}
          onRechazarPresupuesto={(motivo) => store.rechazarPresupuesto(ordenActiva.id, motivo)}
          onRegistrarPago={(datos) => store.registrarPago(ordenActiva.id, datos)}
          onAgregarNota={(datos) => store.agregarNotaTecnica(ordenActiva.id, datos)}
          onConcluirYEntregar={(intervaloMeses) => store.concluirYEntregarOrden(ordenActiva.id, intervaloMeses)}
          onGuardarFirma={(ordenId, firmaBase64) => store.guardarFirmaCliente(ordenId, firmaBase64)}
        />
      )}
    </div>
  );
}
