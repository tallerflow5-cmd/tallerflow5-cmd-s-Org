import { Orden, Cliente, Equipo } from '../types/taller';
import { formatearMoneda, formatearFecha } from './formatters';

/**
 * Abre una ventana emergente limpia formateada para impresión / guardado directo como PDF (Ctrl+P / Command+P)
 */
export function imprimirComprobantePDF(orden: Orden, cliente?: Cliente, equipo?: Equipo): void {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    window.print();
    return;
  }

  const clienteNombre = cliente?.nombre || 'Consumidor Final';
  const clienteDoc = cliente?.documento || 'S/D';
  const clienteTel = cliente?.telefono || '—';
  const clienteDir = cliente?.direccion || '—';

  const equipoDesc = `${equipo?.marca || ''} ${equipo?.tipo || ''} ${equipo?.modelo || ''}`.trim();
  const serial = equipo?.numeroSerie || '—';

  const totalPagado = orden.pagos.reduce((acc, p) => acc + p.monto, 0);
  const totalPresupuesto = orden.presupuesto?.total || totalPagado;
  const saldoPendiente = Math.max(0, totalPresupuesto - totalPagado);

  const repuestosRows =
    orden.presupuesto?.repuestos && orden.presupuesto.repuestos.length > 0
      ? orden.presupuesto.repuestos
          .map(
            (r) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${r.nombre}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${r.cantidad}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${formatearMoneda(r.precioUnitario)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">${formatearMoneda(r.subtotal)}</td>
        </tr>
      `
          )
          .join('')
      : `
        <tr>
          <td colspan="4" style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-style: italic;">
            Mano de obra técnica y diagnóstico general especializado
          </td>
        </tr>
      `;

  const manoDeObra = orden.presupuesto?.manoDeObra || 0;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Entrega - ${orden.codigo}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 30px;
      margin: 0;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      color: #1d4ed8;
      letter-spacing: -0.5px;
    }
    .badge-code {
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 8px;
      font-size: 11px;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
    }
    .financials {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
      font-family: monospace;
    }
    .financials-box {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
    }
    .warranty {
      font-size: 10px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      margin-bottom: 30px;
      text-align: justify;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      text-align: center;
      font-size: 11px;
      margin-top: 40px;
    }
    .sign-line {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">TALLERFLOW</div>
      <div style="font-size: 12px; color: #475569; font-weight: 500;">Servicio Técnico Especializado en Electrodomésticos de Línea Blanca</div>
      <div style="font-size: 11px; color: #64748b;">Bogotá D.C. · Tel: (601) 745-0988 · Cel: +57 310 892 4410</div>
    </div>
    <div style="text-align: right;">
      <span class="badge-code">${orden.codigo}</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Fecha: ${formatearFecha(orden.fechaIngreso).split(',')[0]}</div>
    </div>
  </div>

  <div class="grid-info">
    <div>
      <div class="section-title">Información del Cliente</div>
      <div style="font-size: 13px; font-weight: bold;">${clienteNombre}</div>
      <div>Cédula / NIT: ${clienteDoc}</div>
      <div>Teléfono: ${clienteTel}</div>
      <div>Dirección: ${clienteDir}</div>
    </div>
    <div>
      <div class="section-title">Electrodoméstico Reparado</div>
      <div style="font-size: 13px; font-weight: bold;">${equipoDesc}</div>
      <div style="font-family: monospace;">Serial: ${serial}</div>
      <div style="font-style: italic; color: #475569; margin-top: 3px;">Falla atendida: ${orden.fallaReportada}</div>
    </div>
  </div>

  <div class="section-title">Conceptos de Reparación & Repuestos Instalados</div>
  <table>
    <thead>
      <tr>
        <th>Descripción de Repuesto / Trabajo</th>
        <th style="text-align: center;">Cant</th>
        <th style="text-align: right;">P. Unitario</th>
        <th style="text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${repuestosRows}
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">Mano de Obra y Calibración Técnica</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">1</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${formatearMoneda(manoDeObra)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">${formatearMoneda(manoDeObra)}</td>
      </tr>
    </tbody>
  </table>

  <div class="financials">
    <div class="financials-box">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Total Servicio:</span>
        <strong style="font-size: 13px;">${formatearMoneda(totalPresupuesto)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; color: #16a34a; margin-bottom: 4px;">
        <span>Total Pagado:</span>
        <strong>${formatearMoneda(totalPagado)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; font-weight: bold; color: ${saldoPendiente > 0 ? '#d97706' : '#0f172a'};">
        <span>Saldo Restante:</span>
        <span>${saldoPendiente === 0 ? '$0 (CANCELADO)' : formatearMoneda(saldoPendiente)}</span>
      </div>
    </div>
  </div>

  <div class="warranty">
    <strong>TÉRMINOS Y PÓLIZA DE GARANTÍA:</strong> Este servicio técnico cuenta con noventa (90) días calendario de garantía legal a partir de la fecha de entrega, cubriendo exclusivamente los repuestos sustituidos y la mano de obra detallada. La garantía quedará sin validez por variaciones de voltaje, sobrecargas eléctricas, manipulaciones de personas no autorizadas, ingreso de plagas o golpes. Todo electrodoméstico reparado no retirado dentro de los 30 días posteriores al aviso generará gastos de bodegaje.
  </div>

  <div class="signatures">
    <div>
      <div style="height: 50px;"></div>
      <div class="sign-line">
        <strong>TallerFlow Servicio Técnico</strong>
        <div style="font-size: 10px; color: #64748b;">Firma Técnico Responsable</div>
      </div>
    </div>
    <div>
      ${
        orden.firmaClienteBase64
          ? `
        <div style="text-align: center; height: 50px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; margin-bottom: 4px;">
          <img src="${orden.firmaClienteBase64}" alt="Firma del cliente" style="max-height: 44px; max-width: 170px; object-fit: contain; display: block;" />
          <div style="font-size: 8px; color: #16a34a; font-family: monospace;">Firma digital registrada ${orden.fechaFirmaCliente ? `(${orden.fechaFirmaCliente})` : ''}</div>
        </div>
      `
          : '<div style="height: 50px;"></div>'
      }
      <div class="sign-line">
        <strong>${clienteNombre}</strong>
        <div style="font-size: 10px; color: #64748b;">Recibí Equipo a Conformidad</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
