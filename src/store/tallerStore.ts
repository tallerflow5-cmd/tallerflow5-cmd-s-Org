import { useState, useEffect } from 'react';
import {
  Cliente,
  Equipo,
  Tecnico,
  Repuesto,
  Orden,
  DocumentoOCR,
  EstadoOrden,
  Presupuesto,
  Pago,
  NotaTecnica,
  RecordatorioMantenimiento,
} from '../types/taller';
import {
  SEED_CLIENTES,
  SEED_EQUIPOS,
  SEED_TECNICOS,
  SEED_REPUESTOS,
  SEED_ORDENES,
  SEED_DOCUMENTOS_OCR,
  SEED_RECORDATORIOS_MANTENIMIENTO,
} from './seedData';

interface TallerStoreData {
  clientes: Cliente[];
  equipos: Equipo[];
  tecnicos: Tecnico[];
  repuestos: Repuesto[];
  ordenes: Orden[];
  documentosOCR: DocumentoOCR[];
  recordatoriosMantenimiento: RecordatorioMantenimiento[];
  version: string;
}

const STORAGE_KEY = 'tallerflow_mvp_store_v1';

// Initial state builder
function getInitialData(): TallerStoreData {
  if (typeof window === 'undefined') {
    return {
      clientes: SEED_CLIENTES,
      equipos: SEED_EQUIPOS,
      tecnicos: SEED_TECNICOS,
      repuestos: SEED_REPUESTOS,
      ordenes: SEED_ORDENES,
      documentosOCR: SEED_DOCUMENTOS_OCR,
      recordatoriosMantenimiento: SEED_RECORDATORIOS_MANTENIMIENTO,
      version: '1.0.0',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.ordenes)) {
        if (!Array.isArray(parsed.recordatoriosMantenimiento)) {
          parsed.recordatoriosMantenimiento = SEED_RECORDATORIOS_MANTENIMIENTO;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error al leer datos locales de TallerFlow:', err);
  }

  const initial: TallerStoreData = {
    clientes: SEED_CLIENTES,
    equipos: SEED_EQUIPOS,
    tecnicos: SEED_TECNICOS,
    repuestos: SEED_REPUESTOS,
    ordenes: SEED_ORDENES,
    documentosOCR: SEED_DOCUMENTOS_OCR,
    recordatoriosMantenimiento: SEED_RECORDATORIOS_MANTENIMIENTO,
    version: '1.0.0',
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {
    console.warn('LocalStorage no disponible:', e);
  }
  return initial;
}

let storeMemory: TallerStoreData = getInitialData();
const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeMemory));
    } catch (err) {
      console.error('Error al persistir en localStorage:', err);
    }
  }
  listeners.forEach((listener) => listener());
}

export const tallerStore = {
  getSnapshot(): TallerStoreData {
    return storeMemory;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Generar código correlativo de orden de trabajo
  generarSiguienteCodigoOT(): string {
    const numeros = storeMemory.ordenes
      .map((o) => {
        const match = o.codigo.match(/OT-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = numeros.length > 0 ? Math.max(...numeros) : 100;
    const siguiente = max + 1;
    return `OT-${siguiente.toString().padStart(5, '0')}`;
  },

  // Crear una nueva orden completa (recepción)
  crearOrden(params: {
    clienteExistenteId?: string;
    nuevoCliente?: Omit<Cliente, 'id' | 'fechaRegistro'>;
    equipoExistenteId?: string;
    nuevoEquipo?: Omit<Equipo, 'id' | 'clienteId' | 'fechaRegistro'>;
    orden: {
      fallaReportada: string;
      accesorios?: string;
      observacionesVisuales?: string;
      prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
      tecnicoId?: string;
      fechaPrometida?: string;
      notaInicial?: string;
    };
  }): Orden {
    const hoy = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let clienteId = params.clienteExistenteId;

    // Si es cliente nuevo
    if (!clienteId && params.nuevoCliente) {
      const nuevoCli: Cliente = {
        id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...params.nuevoCliente,
        fechaRegistro: hoy.split(' ')[0],
      };
      storeMemory = {
        ...storeMemory,
        clientes: [nuevoCli, ...storeMemory.clientes],
      };
      clienteId = nuevoCli.id;
    }

    if (!clienteId) {
      throw new Error('Debe especificar un cliente existente o datos para uno nuevo.');
    }

    let equipoId = params.equipoExistenteId;
    if (!equipoId && params.nuevoEquipo) {
      const nuevoEq: Equipo = {
        id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clienteId,
        ...params.nuevoEquipo,
        fechaRegistro: hoy.split(' ')[0],
      };
      storeMemory = {
        ...storeMemory,
        equipos: [nuevoEq, ...storeMemory.equipos],
      };
      equipoId = nuevoEq.id;
    }

    if (!equipoId) {
      throw new Error('Debe especificar un equipo existente o datos para uno nuevo.');
    }

    const nuevaOT: Orden = {
      id: `ord-${Date.now()}`,
      codigo: this.generarSiguienteCodigoOT(),
      clienteId,
      equipoId,
      tecnicoId: params.orden.tecnicoId || undefined,
      estado: 'recibido',
      fallaReportada: params.orden.fallaReportada,
      accesorios: params.orden.accesorios || '',
      observacionesVisuales: params.orden.observacionesVisuales || '',
      prioridad: params.orden.prioridad || 'normal',
      fechaIngreso: hoy,
      fechaPrometida: params.orden.fechaPrometida || undefined,
      notasTecnicas: params.orden.notaInicial
        ? [
            {
              id: `not-${Date.now()}`,
              ordenId: `ord-${Date.now()}`,
              tecnicoId: params.orden.tecnicoId || 'recepcion',
              tecnicoNombre: 'Recepción',
              tipo: 'interno',
              contenido: params.orden.notaInicial,
              fecha: hoy,
            },
          ]
        : [],
      pagos: [],
    };

    storeMemory = {
      ...storeMemory,
      ordenes: [nuevaOT, ...storeMemory.ordenes],
    };
    notify();
    return nuevaOT;
  },

  // Transición de estado con trazabilidad
  actualizarEstadoOrden(ordenId: string, nuevoEstado: EstadoOrden, nota?: string): void {
    const orden = storeMemory.ordenes.find((o) => o.id === ordenId);
    if (!orden) return;

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const notasActualizadas = [...orden.notasTecnicas];

    if (nota) {
      notasActualizadas.push({
        id: `not-${Date.now()}`,
        ordenId,
        tecnicoId: orden.tecnicoId || 'sistema',
        tecnicoNombre: 'Sistema de Taller',
        tipo: 'interno',
        contenido: `Cambio de estado a [${nuevoEstado}]: ${nota}`,
        fecha: ahora,
      });
    }

    const updatePatch: Partial<Orden> = {
      estado: nuevoEstado,
      notasTecnicas: notasActualizadas,
    };

    if (nuevoEstado === 'en_diagnostico' && !orden.fechaDiagnostico) {
      updatePatch.fechaDiagnostico = ahora;
    } else if (nuevoEstado === 'listo_entrega' && !orden.fechaReparacion) {
      updatePatch.fechaReparacion = ahora;
    } else if (nuevoEstado === 'entregado' && !orden.fechaEntrega) {
      updatePatch.fechaEntrega = ahora;
    }

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => (o.id === ordenId ? { ...o, ...updatePatch } : o)),
    };
    notify();
  },

  // Asignar técnico
  asignarTecnico(ordenId: string, tecnicoId: string): void {
    const tecnico = storeMemory.tecnicos.find((t) => t.id === tecnicoId);
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          tecnicoId,
          notasTecnicas: [
            ...o.notasTecnicas,
            {
              id: `not-${Date.now()}`,
              ordenId,
              tecnicoId,
              tecnicoNombre: tecnico ? tecnico.nombre : 'Técnico asignado',
              tipo: 'interno',
              contenido: `Técnico ${tecnico ? tecnico.nombre : ''} asignado a la orden.`,
              fecha: ahora,
            },
          ],
        };
      }),
    };
    notify();
  },

  // Guardar o actualizar presupuesto
  guardarPresupuesto(
    ordenId: string,
    data: {
      manoDeObra: number;
      repuestos: Array<{
        repuestoId?: string;
        codigo?: string;
        nombre: string;
        cantidad: number;
        precioUnitario: number;
      }>;
      notas?: string;
    }
  ): Presupuesto {
    const items = data.repuestos.map((r, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      repuestoId: r.repuestoId,
      codigo: r.codigo,
      nombre: r.nombre,
      cantidad: r.cantidad,
      precioUnitario: r.precioUnitario,
      subtotal: r.cantidad * r.precioUnitario,
    }));

    const totalRepuestos = items.reduce((acc, it) => acc + it.subtotal, 0);
    const total = data.manoDeObra + totalRepuestos;
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const nuevoPresupuesto: Presupuesto = {
      id: `pre-${Date.now()}`,
      ordenId,
      estado: 'enviado',
      manoDeObra: data.manoDeObra,
      repuestos: items,
      totalRepuestos,
      total,
      fechaEmision: ahora,
      notas: data.notas || '',
    };

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          presupuesto: nuevoPresupuesto,
          estado: 'esperando_aprobacion',
        };
      }),
    };
    notify();
    return nuevoPresupuesto;
  },

  // Aprobar presupuesto: DESCUENTA STOCK DE REPUESTOS Y CAMBIA A EN_REPARACION
  aprobarPresupuesto(ordenId: string): { success: boolean; mensaje: string } {
    const orden = storeMemory.ordenes.find((o) => o.id === ordenId);
    if (!orden || !orden.presupuesto) {
      return { success: false, mensaje: 'La orden no tiene un presupuesto asociado.' };
    }

    const presupuesto = orden.presupuesto;
    if (presupuesto.estado === 'aprobado') {
      return { success: false, mensaje: 'El presupuesto ya se encuentra aprobado.' };
    }

    // 1. Verificar stock disponible para los repuestos asociados
    const stockActualizado = [...storeMemory.repuestos];
    const repuestosFaltantes: string[] = [];

    for (const item of presupuesto.repuestos) {
      if (item.repuestoId) {
        const rep = stockActualizado.find((r) => r.id === item.repuestoId);
        if (rep) {
          if (rep.stockActual < item.cantidad) {
            repuestosFaltantes.push(`${rep.nombre} (Stock: ${rep.stockActual}, Necesario: ${item.cantidad})`);
          }
        }
      }
    }

    // Si falta stock crítico, avisar o permitir pero marcar alerta
    let pasaAEstado: EstadoOrden = 'en_reparacion';
    let advertenciaStock = '';
    if (repuestosFaltantes.length > 0) {
      pasaAEstado = 'esperando_repuesto';
      advertenciaStock = ` AVISO: Repuestos con stock insuficiente: ${repuestosFaltantes.join(', ')}. Estado colocado en "esperando_repuesto".`;
    }

    // 2. Descontar stock atómicamente
    for (const item of presupuesto.repuestos) {
      if (item.repuestoId) {
        const idx = stockActualizado.findIndex((r) => r.id === item.repuestoId);
        if (idx !== -1) {
          stockActualizado[idx] = {
            ...stockActualizado[idx],
            stockActual: Math.max(0, stockActualizado[idx].stockActual - item.cantidad),
          };
        }
      }
    }

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const presupuestoAprobado: Presupuesto = {
      ...presupuesto,
      estado: 'aprobado',
      fechaRespuesta: ahora,
    };

    storeMemory = {
      ...storeMemory,
      repuestos: stockActualizado,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          presupuesto: presupuestoAprobado,
          estado: pasaAEstado,
          notasTecnicas: [
            ...o.notasTecnicas,
            {
              id: `not-${Date.now()}`,
              ordenId,
              tecnicoId: o.tecnicoId || 'sistema',
              tecnicoNombre: 'Sistema de Taller',
              tipo: 'avance',
              contenido: `Presupuesto aprobado por el cliente por un total de $${presupuesto.total.toLocaleString()} COP. Stock descontado en inventario.${advertenciaStock}`,
              fecha: ahora,
            },
          ],
        };
      }),
    };

    notify();
    return {
      success: true,
      mensaje: `Presupuesto aprobado exitosamente. Stock descontado.${advertenciaStock}`,
    };
  },

  // Rechazar presupuesto
  rechazarPresupuesto(ordenId: string, motivo: string): void {
    const orden = storeMemory.ordenes.find((o) => o.id === ordenId);
    if (!orden || !orden.presupuesto) return;

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const presupuestoRechazado: Presupuesto = {
      ...orden.presupuesto,
      estado: 'rechazado',
      fechaRespuesta: ahora,
      motivoRechazo: motivo,
    };

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          presupuesto: presupuestoRechazado,
          estado: 'cancelado',
          notasTecnicas: [
            ...o.notasTecnicas,
            {
              id: `not-${Date.now()}`,
              ordenId,
              tecnicoId: o.tecnicoId || 'sistema',
              tecnicoNombre: 'Sistema de Taller',
              tipo: 'interno',
              contenido: `Presupuesto rechazado por el cliente. Motivo: ${motivo}`,
              fecha: ahora,
            },
          ],
        };
      }),
    };
    notify();
  },

  // Registrar pago
  registrarPago(
    ordenId: string,
    pagoData: {
      monto: number;
      metodoPago: Pago['metodoPago'];
      referencia?: string;
      notas?: string;
      recibidoPor?: string;
    }
  ): Pago {
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nuevoPago: Pago = {
      id: `pay-${Date.now()}`,
      ordenId,
      monto: pagoData.monto,
      metodoPago: pagoData.metodoPago,
      referencia: pagoData.referencia || '',
      notas: pagoData.notas || '',
      recibidoPor: pagoData.recibidoPor || 'Caja / Recepción',
      fecha: ahora,
    };

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          pagos: [...o.pagos, nuevoPago],
        };
      }),
    };
    notify();
    return nuevoPago;
  },

  // Agregar nota técnica
  agregarNotaTecnica(
    ordenId: string,
    nota: {
      tecnicoId: string;
      tecnicoNombre: string;
      tipo: 'diagnostico' | 'avance' | 'interno';
      contenido: string;
    }
  ): NotaTecnica {
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nuevaNota: NotaTecnica = {
      id: `not-${Date.now()}`,
      ordenId,
      ...nota,
      fecha: ahora,
    };

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          notasTecnicas: [...o.notasTecnicas, nuevaNota],
        };
      }),
    };
    notify();
    return nuevaNota;
  },

  // Gestión de repuestos
  guardarRepuesto(rep: Omit<Repuesto, 'id'> & { id?: string }): Repuesto {
    if (rep.id) {
      // Actualizar
      const actualizado = rep as Repuesto;
      storeMemory = {
        ...storeMemory,
        repuestos: storeMemory.repuestos.map((r) => (r.id === rep.id ? actualizado : r)),
      };
      notify();
      return actualizado;
    } else {
      // Crear
      const nuevo: Repuesto = {
        ...rep,
        id: `rep-${Date.now()}`,
      };
      storeMemory = {
        ...storeMemory,
        repuestos: [nuevo, ...storeMemory.repuestos],
      };
      notify();
      return nuevo;
    }
  },

  ajustarStock(repuestoId: string, cantidadDelta: number, motivo?: string): void {
    storeMemory = {
      ...storeMemory,
      repuestos: storeMemory.repuestos.map((r) => {
        if (r.id !== repuestoId) return r;
        const nuevoStock = Math.max(0, r.stockActual + cantidadDelta);
        return { ...r, stockActual: nuevoStock };
      }),
    };
    notify();
  },

  // Ingesta OCR Documentos
  guardarDocumentoOCR(doc: Omit<DocumentoOCR, 'id' | 'fechaSubida'>): DocumentoOCR {
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nuevoDoc: DocumentoOCR = {
      id: `doc-ocr-${Date.now()}`,
      fechaSubida: ahora,
      ...doc,
    };
    storeMemory = {
      ...storeMemory,
      documentosOCR: [nuevoDoc, ...storeMemory.documentosOCR],
    };
    notify();
    return nuevoDoc;
  },

  // Cargar repuestos detectados por OCR al inventario de repuestos
  sumarRepuestosDeFacturaOCR(docId: string): number {
    const doc = storeMemory.documentosOCR.find((d) => d.id === docId);
    if (!doc || !doc.datosExtraidos?.repuestos) return 0;

    let itemsProcesados = 0;
    const stockActual = [...storeMemory.repuestos];

    for (const r of doc.datosExtraidos.repuestos) {
      if (!r.nombre) continue;
      // Buscar si existe por código o nombre similar
      const existente = stockActual.find(
        (item) =>
          (r.codigo && item.codigo.toLowerCase() === r.codigo.toLowerCase()) ||
          item.nombre.toLowerCase().includes(r.nombre.toLowerCase())
      );

      if (existente) {
        existente.stockActual += Number(r.cantidad) || 1;
        if (r.precioUnitario && r.precioUnitario > 0) {
          existente.precioCosto = r.precioUnitario;
        }
      } else {
        const precioCosto = Number(r.precioUnitario) || 0;
        stockActual.push({
          id: `rep-${Date.now()}-${itemsProcesados}`,
          codigo: r.codigo || `OCR-${Date.now().toString().slice(-4)}-${itemsProcesados}`,
          nombre: r.nombre,
          marca: r.marcaCompatible || 'Multimarca',
          categoria: 'Repuestos Ingestados OCR',
          stockActual: Number(r.cantidad) || 1,
          stockMinimo: 2,
          precioCosto,
          precioVenta: Math.round(precioCosto * 1.6),
          ubicacion: 'Recepción OCR',
        });
      }
      itemsProcesados++;
    }

    storeMemory = {
      ...storeMemory,
      repuestos: stockActual,
    };
    notify();
    return itemsProcesados;
  },

  // Programar o actualizar recordatorio de mantenimiento
  programarRecordatorioMantenimiento(
    datos: Omit<RecordatorioMantenimiento, 'id'>
  ): RecordatorioMantenimiento {
    const nuevo: RecordatorioMantenimiento = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...datos,
    };
    storeMemory = {
      ...storeMemory,
      recordatoriosMantenimiento: [nuevo, ...storeMemory.recordatoriosMantenimiento],
    };
    notify();
    return nuevo;
  },

  actualizarEstadoRecordatorio(
    id: string,
    nuevoEstado: RecordatorioMantenimiento['estado'],
    notas?: string
  ): void {
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    storeMemory = {
      ...storeMemory,
      recordatoriosMantenimiento: storeMemory.recordatoriosMantenimiento.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          estado: nuevoEstado,
          notasSeguimiento: notas !== undefined ? notas : r.notasSeguimiento,
          fechaUltimoContacto: ahora,
        };
      }),
    };
    notify();
  },

  // Concluir servicio, marcar como entregado y programar recordatorio de 9 a 12 meses automáticamente
  concluirYEntregarOrden(
    ordenId: string,
    intervaloMeses: number = 9,
    tipoMantenimiento?: RecordatorioMantenimiento['tipoMantenimiento']
  ): { orden: Orden; recordatorio: RecordatorioMantenimiento } {
    const orden = storeMemory.ordenes.find((o) => o.id === ordenId);
    if (!orden) throw new Error('Orden no encontrada');

    const cliente = storeMemory.clientes.find((c) => c.id === orden.clienteId);
    const equipo = storeMemory.equipos.find((e) => e.id === orden.equipoId);
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Calcular fecha futura sumando intervaloMeses (9 a 12 meses)
    const fechaObj = new Date();
    fechaObj.setMonth(fechaObj.getMonth() + (Number(intervaloMeses) || 9));
    const fechaProgramada = fechaObj.toISOString().split('T')[0];

    const tipoFinal: RecordatorioMantenimiento['tipoMantenimiento'] =
      tipoMantenimiento ||
      (equipo?.tipo === 'Lavadora'
        ? 'desinfeccion_tina'
        : equipo?.tipo === 'Nevera'
        ? 'limpieza_profunda'
        : 'mantenimiento_preventivo_anual');

    const recordatorio: RecordatorioMantenimiento = {
      id: `rec-${Date.now()}`,
      ordenOrigenId: orden.id,
      codigoOT: orden.codigo,
      clienteId: orden.clienteId,
      clienteNombre: cliente ? cliente.nombre : 'Cliente',
      clienteTelefono: cliente ? cliente.telefono : '',
      equipoId: orden.equipoId,
      equipoTipo: equipo ? equipo.tipo : 'Electrodoméstico',
      equipoMarca: equipo ? equipo.marca : 'Línea Blanca',
      equipoModelo: equipo ? equipo.modelo : '',
      fallaOriginal: orden.fallaReportada,
      fechaServicioOriginal: ahora.split(' ')[0],
      intervaloMeses: Number(intervaloMeses) || 9,
      fechaProgramada,
      tipoMantenimiento: tipoFinal,
      estado: 'pendiente',
      notasSeguimiento: `Programado automáticamente al concluir la orden ${orden.codigo}. Sugerencia preventiva de ${intervaloMeses} meses.`,
    };

    const ordenActualizada: Orden = {
      ...orden,
      estado: 'entregado',
      fechaEntrega: ahora,
      notasTecnicas: [
        ...orden.notasTecnicas,
        {
          id: `not-${Date.now()}`,
          ordenId,
          tecnicoId: orden.tecnicoId || 'sistema',
          tecnicoNombre: 'Recepción / Sistema',
          tipo: 'interno',
          contenido: `Servicio concluido y entregado al cliente. Recordatorio preventivo de mantenimiento programado automáticamente a ${intervaloMeses} meses (${fechaProgramada}).`,
          fecha: ahora,
        },
      ],
    };

    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => (o.id === ordenId ? ordenActualizada : o)),
      recordatoriosMantenimiento: [recordatorio, ...storeMemory.recordatoriosMantenimiento],
    };

    notify();
    return { orden: ordenActualizada, recordatorio };
  },

  // Guardar firma táctil del cliente en la orden
  guardarFirmaCliente(ordenId: string, firmaBase64: string): void {
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    storeMemory = {
      ...storeMemory,
      ordenes: storeMemory.ordenes.map((o) => {
        if (o.id !== ordenId) return o;
        return {
          ...o,
          firmaClienteBase64: firmaBase64,
          fechaFirmaCliente: ahora,
          notasTecnicas: [
            ...o.notasTecnicas,
            {
              id: `not-${Date.now()}`,
              ordenId,
              tecnicoId: 'recepcion',
              tecnicoNombre: 'Recepción',
              tipo: 'interno',
              contenido: 'Firma táctil de conformidad del cliente registrada en el comprobante de entrega.',
              fecha: ahora,
            },
          ],
        };
      }),
    };
    notify();
  },

  // Exportar backup
  exportarBackupJSON(): string {
    return JSON.stringify(storeMemory, null, 2);
  },

  // Importar backup
  importarBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.ordenes) && Array.isArray(data.repuestos)) {
        storeMemory = data;
        notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error al importar backup:', e);
      return false;
    }
  },

  // Restaurar demo
  reiniciarDemo(): void {
    storeMemory = {
      clientes: SEED_CLIENTES,
      equipos: SEED_EQUIPOS,
      tecnicos: SEED_TECNICOS,
      repuestos: SEED_REPUESTOS,
      ordenes: SEED_ORDENES,
      documentosOCR: SEED_DOCUMENTOS_OCR,
      recordatoriosMantenimiento: SEED_RECORDATORIOS_MANTENIMIENTO,
      version: '1.0.0',
    };
    notify();
  },
};

// React Hook
export function useTallerStore() {
  const [state, setState] = useState<TallerStoreData>(tallerStore.getSnapshot());

  useEffect(() => {
    return tallerStore.subscribe(() => {
      setState(tallerStore.getSnapshot());
    });
  }, []);

  return {
    ...state,
    crearOrden: tallerStore.crearOrden.bind(tallerStore),
    actualizarEstadoOrden: tallerStore.actualizarEstadoOrden.bind(tallerStore),
    asignarTecnico: tallerStore.asignarTecnico.bind(tallerStore),
    guardarPresupuesto: tallerStore.guardarPresupuesto.bind(tallerStore),
    aprobarPresupuesto: tallerStore.aprobarPresupuesto.bind(tallerStore),
    rechazarPresupuesto: tallerStore.rechazarPresupuesto.bind(tallerStore),
    registrarPago: tallerStore.registrarPago.bind(tallerStore),
    agregarNotaTecnica: tallerStore.agregarNotaTecnica.bind(tallerStore),
    guardarRepuesto: tallerStore.guardarRepuesto.bind(tallerStore),
    ajustarStock: tallerStore.ajustarStock.bind(tallerStore),
    guardarDocumentoOCR: tallerStore.guardarDocumentoOCR.bind(tallerStore),
    sumarRepuestosDeFacturaOCR: tallerStore.sumarRepuestosDeFacturaOCR.bind(tallerStore),
    programarRecordatorioMantenimiento: tallerStore.programarRecordatorioMantenimiento.bind(tallerStore),
    actualizarEstadoRecordatorio: tallerStore.actualizarEstadoRecordatorio.bind(tallerStore),
    concluirYEntregarOrden: tallerStore.concluirYEntregarOrden.bind(tallerStore),
    guardarFirmaCliente: tallerStore.guardarFirmaCliente.bind(tallerStore),
    exportarBackupJSON: tallerStore.exportarBackupJSON.bind(tallerStore),
    importarBackupJSON: tallerStore.importarBackupJSON.bind(tallerStore),
    reiniciarDemo: tallerStore.reiniciarDemo.bind(tallerStore),
    generarSiguienteCodigoOT: tallerStore.generarSiguienteCodigoOT.bind(tallerStore),
  };
}
