import { Orden, Cliente, Equipo, RecordatorioMantenimiento } from '../types/taller';
import { formatearMoneda } from './formatters';

/**
 * Limpia y normaliza el número de teléfono para la API de WhatsApp.
 * Si es número colombiano (10 dígitos que empiezan por 3), le antepone el prefijo 57.
 */
export function normalizarNumeroWhatsApp(telefono: string): string {
  if (!telefono) return '';
  const soloDigitos = telefono.replace(/\D/g, '');

  // Si tiene 10 dígitos y empieza por 3 (formato celular Colombia: ej. 3101234567)
  if (soloDigitos.length === 10 && soloDigitos.startsWith('3')) {
    return `57${soloDigitos}`;
  }

  // Si ya tiene el 57 y 12 dígitos
  if (soloDigitos.length === 12 && soloDigitos.startsWith('573')) {
    return soloDigitos;
  }

  return soloDigitos;
}

/**
 * Genera el enlace de WhatsApp y el texto para el RESUMEN DE LA REPARACIÓN
 */
export function generarEnlaceWhatsAppResumen(
  orden: Orden,
  cliente?: Cliente,
  equipo?: Equipo,
  tecnicoNombre?: string
): { url: string; mensajeTexto: string; numero: string } {
  const clienteNombre = cliente?.nombre || 'Estimado(a) Cliente';
  const telefonoLimpio = normalizarNumeroWhatsApp(cliente?.telefono || '');
  const equipoDesc = `${equipo?.marca || ''} ${equipo?.tipo || ''} ${equipo?.modelo ? `(${equipo.modelo})` : ''}`.trim();
  const totalPagado = orden.pagos.reduce((acc, p) => acc + p.monto, 0);
  const totalPresupuesto = orden.presupuesto?.total || totalPagado;
  const saldoPendiente = Math.max(0, totalPresupuesto - totalPagado);

  const repuestosTxt =
    orden.presupuesto && orden.presupuesto.repuestos.length > 0
      ? orden.presupuesto.repuestos
          .map((r) => `   • ${r.nombre} (x${r.cantidad}) - ${formatearMoneda(r.subtotal)}`)
          .join('\n')
      : '   • Mano de obra técnica y diagnóstico general especializado';

  const manoDeObra = orden.presupuesto?.manoDeObra || 0;

  const mensaje = `*TALLERFLOW - RESUMEN DE SERVICIO TÉCNICO* 🛠️📋
Hola *${clienteNombre}*, te compartimos el informe y resumen de la reparación de tu electrodoméstico:

📌 *Orden de Servicio:* ${orden.codigo}
⚡ *Equipo:* ${equipoDesc}
🔍 *Número de Serie:* ${equipo?.numeroSerie || 'Registrado en taller'}
⚠️ *Falla Atendida:* ${orden.fallaReportada}
👨‍🔧 *Técnico Responsable:* ${tecnicoNombre || 'Equipo Técnico TallerFlow'}

━━━━━━━━━━━━━━━━━━━━
🔧 *CONCEPTOS & REPUESTOS INSTALADOS:*
${repuestosTxt}
   • Mano de obra calificada: ${formatearMoneda(manoDeObra)}

💰 *BALANCE FINANCIERO:*
   • Total del Servicio: *${formatearMoneda(totalPresupuesto)}*
   • Total Abonado: ${formatearMoneda(totalPagado)}
   • Saldo Pendiente: *${saldoPendiente === 0 ? '$0 (CANCELADO / AL DÍA)' : formatearMoneda(saldoPendiente)}*
━━━━━━━━━━━━━━━━━━━━

🛡️ *PÓLIZA DE GARANTÍA:*
Cuentas con *90 días calendario de garantía* a partir de la fecha de entrega sobre repuestos y mano de obra aplicada.

📍 *TallerFlow Bogotá D.C.*
📞 PBX: (601) 745-0988 | Cel: +57 310 892 4410
¡Gracias por confiar en nuestro servicio técnico!`;

  const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  return { url, mensajeTexto: mensaje, numero: telefonoLimpio };
}

/**
 * Genera el enlace de WhatsApp para remisión del COMPROBANTE OFICIAL EN PDF GENERADO
 */
export function generarEnlaceWhatsAppPDFComprobante(
  orden: Orden,
  cliente?: Cliente,
  equipo?: Equipo
): { url: string; mensajeTexto: string; numero: string } {
  const clienteNombre = cliente?.nombre || 'Estimado(a) Cliente';
  const telefonoLimpio = normalizarNumeroWhatsApp(cliente?.telefono || '');
  const equipoDesc = `${equipo?.marca || ''} ${equipo?.tipo || ''} ${equipo?.modelo ? `(${equipo.modelo})` : ''}`.trim();
  const totalPagado = orden.pagos.reduce((acc, p) => acc + p.monto, 0);
  const totalPresupuesto = orden.presupuesto?.total || totalPagado;
  const saldoPendiente = Math.max(0, totalPresupuesto - totalPagado);

  const mensaje = `📄 *COMPROBANTE OFICIAL DE ENTREGA EN PDF* - *${orden.codigo}*
Hola *${clienteNombre}*, te confirmamos la entrega satisfactoria de tu electrodoméstico y te remitimos el soporte digital de tu servicio.

⚡ *Equipo Entregado:* ${equipoDesc}
🔍 *Serial:* ${equipo?.numeroSerie || 'Registrado'}
💰 *Total Liquidado:* ${formatearMoneda(totalPresupuesto)}
💵 *Estado de Pago:* ${saldoPendiente === 0 ? 'PAGADO COMPLETO ($0)' : `Saldo pendiente: ${formatearMoneda(saldoPendiente)}`}
🛡️ *Garantía:* 90 días calendario sobre mano de obra y componentes instalados.
✍️ *Conformidad:* ${orden.firmaClienteBase64 ? 'Firmado a conformidad por el cliente ✅' : 'Entrega registrada en taller'}

📎 *Archivo PDF Adjunto:* Te adjuntamos a continuación el comprobante formal en PDF emitido por el sistema para que lo conserves como respaldo legal y de garantía.

¡Muchas gracias por elegir a *TallerFlow*! 👨‍🔧✨`;

  const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  return { url, mensajeTexto: mensaje, numero: telefonoLimpio };
}

/**
 * Genera el enlace de WhatsApp para enviar COTIZACIÓN / PRESUPUESTO para aprobación
 */
export function generarEnlaceWhatsAppPresupuesto(
  orden: Orden,
  cliente?: Cliente,
  equipo?: Equipo
): { url: string; mensajeTexto: string; numero: string } {
  const clienteNombre = cliente?.nombre || 'Estimado(a) Cliente';
  const telefonoLimpio = normalizarNumeroWhatsApp(cliente?.telefono || '');
  const equipoDesc = `${equipo?.marca || ''} ${equipo?.tipo || ''}`.trim();
  const presupuesto = orden.presupuesto;
  const total = presupuesto?.total || 0;

  const repuestosTxt =
    presupuesto && presupuesto.repuestos.length > 0
      ? presupuesto.repuestos.map((r) => `   • ${r.nombre} (x${r.cantidad}): ${formatearMoneda(r.subtotal)}`).join('\n')
      : '   • No requiere repuestos adicionales';

  const mensaje = `*TALLERFLOW - COTIZACIÓN DE REPARACIÓN* 🛠️💵
Hola *${clienteNombre}*, ya tenemos listo el diagnóstico técnico para tu *${equipoDesc}* (Orden *${orden.codigo}*):

🔍 *Falla Diagnosticada:* ${orden.fallaReportada}

📋 *Desglose de Cotización:*
${repuestosTxt}
   • Mano de obra técnica y calibración: ${formatearMoneda(presupuesto?.manoDeObra || 0)}

💰 *TOTAL PRESUPUESTADO:* *${formatearMoneda(total)}*
🛡️ Incluye 90 días de garantía sobre repuestos y mano de obra.

¿Nos autorizas a proceder con la reparación? Por favor respóndenos por este medio para iniciar de inmediato. ¡Muchas gracias!`;

  const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  return { url, mensajeTexto: mensaje, numero: telefonoLimpio };
}

/**
 * Compatibilidad con código previo
 */
export const generarEnlaceWhatsAppComprobante = generarEnlaceWhatsAppResumen;

/**
 * Genera el enlace de WhatsApp para recordatorio de mantenimiento preventivo (9-12 meses)
 */
export function generarEnlaceWhatsAppMantenimiento(
  recordatorio: RecordatorioMantenimiento
): { url: string; mensajeTexto: string; numero: string } {
  const telefonoLimpio = normalizarNumeroWhatsApp(recordatorio.clienteTelefono);

  const tipoDetalle =
    recordatorio.equipoTipo === 'Lavadora'
      ? 'limpieza profunda de tina, desinfección antibacteriana y desincrustación de sarro para prevenir obstrucción de bomba'
      : recordatorio.equipoTipo === 'Nevera'
      ? 'mantenimiento preventivo del serpentín condensador, calibración de gas y desinfección de ductos de frío'
      : 'mantenimiento preventivo integral, revisión eléctrica y limpieza técnica especializada';

  const mensaje = `Hola *${recordatorio.clienteNombre}*, te saludamos de *TallerFlow Servicio Técnico*. 👨‍🔧🧼

Esperamos que te encuentres muy bien. Te escribimos porque se cumplen *${recordatorio.intervaloMeses} meses* desde la reparación de tu *${recordatorio.equipoMarca} ${recordatorio.equipoTipo}* (Orden *${recordatorio.codigoOT}*).

Para extender la vida útil del electrodoméstico y mantener su máximo rendimiento energético, el fabricante recomienda realizar:
✨ *${tipoDetalle}*.

🎁 *Beneficio de Fidelización:* Por ser cliente registrado de TallerFlow, cuentas con un *15% de descuento* en tu servicio preventivo este mes.

¿Te gustaría que te agendemos una visita técnica esta semana o en qué horario te resulta más cómodo? ¡Quedamos atentos a tu respuesta!`;

  const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  return { url, mensajeTexto: mensaje, numero: telefonoLimpio };
}
