import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NIVELES, TIPOS_LIQUIDACION, TIPOS_PLANTA } from '@/types/database';

// Mapear codigo de nivel a nombre completo
function getNivelCompleto(codigo: string | null): string {
  if (!codigo) return '';
  const nivel = NIVELES.find(n => n.codigo === codigo);
  return nivel?.nombre || codigo;
}

// Mapear codigo de tipo liquidacion a nombre
function getTipoLiquidacionNombre(codigo: string | null): string {
  if (!codigo) return '';
  const tipo = TIPOS_LIQUIDACION.find(t => t.codigo === codigo);
  return tipo?.nombre || codigo;
}

// Mapear codigo de tipo planta a nombre
function getTipoPlantaNombre(codigo: string | null): string {
  if (!codigo) return 'Planta Titular'; // Valor por defecto para presentaciones antiguas
  const tipo = TIPOS_PLANTA.find(t => t.codigo === codigo);
  return tipo?.nombre || codigo;
}

// Formatear monto
function formatMonto(monto: number | null): string {
  if (monto === null || monto === undefined) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(monto);
}

// Formatear fecha
function formatFecha(fecha: string | null): string {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatear periodo
function formatPeriodo(periodo: string): string {
  const year = periodo.substring(0, 4);
  const month = parseInt(periodo.substring(4, 6)) - 1;
  const date = new Date(parseInt(year), month);
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener usuario
    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*, colegio:aps_colegios(*)')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener presentacion
    const { data: presentacion, error: presError } = await supabase
      .from('aps_presentaciones')
      .select('*, colegio:aps_colegios(*), usuario:aps_usuarios(*)')
      .eq('id', id)
      .single();

    if (presError || !presentacion) {
      return NextResponse.json({ error: 'Presentacion no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    if (userData.rol === 'COLEGIO' && presentacion.id_colegio !== userData.id_colegio) {
      return NextResponse.json({ error: 'Sin acceso a esta presentacion' }, { status: 403 });
    }

    // Obtener liquidaciones
    const { data: liquidaciones } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('*')
      .eq('id_presentacion', id)
      .order('fila_excel', { ascending: true });

    // Calcular totales
    const totalBruto = liquidaciones?.reduce((sum, l) => sum + (l.total_remunerativo || 0), 0) || 0;
    const totalNeto = liquidaciones?.reduce((sum, l) => sum + (l.sueldo_neto || 0), 0) || 0;
    const totalArraigo = liquidaciones?.reduce((sum, l) => sum + (l.item_arraigo || 0), 0) || 0;
    const totalHoras = liquidaciones?.reduce((sum, l) => sum + (l.horas || 0), 0) || 0;

    const colegioCode = `${presentacion.colegio?.codigo_nivel}-${presentacion.colegio?.codigo_colegio}`;
    const colegioNombre = presentacion.colegio?.nombre || colegioCode;

    // Generar HTML del comprobante
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Presentacion - ${colegioCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      margin: 0 auto;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .header h2 {
      font-size: 14px;
      color: #666;
    }
    .info-section {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .info-section h3 {
      font-size: 14px;
      color: #1e40af;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 10px;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 13px;
      color: #333;
    }
    .resumen-box {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      text-align: center;
      padding: 15px;
      background: #f0f9ff;
      border-radius: 8px;
      border: 1px solid #bae6fd;
    }
    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
    }
    .stat-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 4px 6px;
      text-align: left;
    }
    th {
      background: #1e40af;
      color: white;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8px;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .totals-row {
      background: #dbeafe !important;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
    }
    .firma-box {
      padding-top: 40px;
      border-top: 1px solid #333;
    }
    .firma-label {
      font-size: 10px;
      color: #666;
    }
    .estado-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
    }
    .estado-CERRADA { background: #dcfce7; color: #166534; }
    .estado-CARGADA { background: #fef9c3; color: #854d0e; }
    .estado-RECHAZADA { background: #fee2e2; color: #991b1b; }
    .print-only { display: none; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { width: 100%; padding: 10mm; }
      .no-print { display: none; }
      .print-only { display: block; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>COMPROBANTE DE PRESENTACION</h1>
      <h2>Sistema de Preliquidaciones - DGE Mendoza</h2>
    </div>

    <div class="info-section">
      <h3>Datos del Colegio</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Codigo</span>
          <span class="info-value">${colegioCode}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Nombre</span>
          <span class="info-value">${colegioNombre}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Nivel</span>
          <span class="info-value">${getNivelCompleto(presentacion.colegio?.codigo_nivel)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">CUIT</span>
          <span class="info-value">${presentacion.colegio?.cuit || '-'}</span>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>Datos de la Presentacion</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Periodo</span>
          <span class="info-value">${formatPeriodo(presentacion.periodo)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tipo de Liquidacion</span>
          <span class="info-value">${getTipoLiquidacionNombre(presentacion.tipo_liquidacion)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tipo de Planta</span>
          <span class="info-value">${getTipoPlantaNombre(presentacion.tipo_planta)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Estado</span>
          <span class="info-value">
            <span class="estado-badge estado-${presentacion.estado}">${presentacion.estado}</span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Fecha de Carga</span>
          <span class="info-value">${formatFecha(presentacion.fecha_subida)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Fecha de Cierre</span>
          <span class="info-value">${presentacion.fecha_cierre ? formatFecha(presentacion.fecha_cierre) : 'Pendiente'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Usuario</span>
          <span class="info-value">${presentacion.usuario?.email || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ID Presentacion</span>
          <span class="info-value" style="font-size: 10px;">${presentacion.id}</span>
        </div>
      </div>
    </div>

    <div class="resumen-box">
      <div class="stat-card">
        <div class="stat-value">${liquidaciones?.length || 0}</div>
        <div class="stat-label">Total Filas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalHoras}</div>
        <div class="stat-label">Total Horas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatMonto(totalBruto)}</div>
        <div class="stat-label">Total Bruto</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatMonto(totalNeto)}</div>
        <div class="stat-label">Total Neto</div>
      </div>
    </div>

    <h3 style="margin-bottom: 10px; color: #1e40af;">Detalle de Liquidaciones</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Legajo</th>
          <th>Apellido y Nombre</th>
          <th>DNI</th>
          <th>CUIL</th>
          <th>Cargo</th>
          <th class="text-right">Horas</th>
          <th class="text-right">Bruto</th>
          <th class="text-right">Neto</th>
          <th class="text-right">Arraigo</th>
        </tr>
      </thead>
      <tbody>
        ${liquidaciones?.map((liq, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${liq.legajo || '-'}</td>
          <td>${liq.apellido || ''} ${liq.nombres || ''}</td>
          <td>${liq.dni || '-'}</td>
          <td>${liq.cuil || '-'}</td>
          <td>${liq.cargo || '-'}</td>
          <td class="text-right">${liq.horas || 0}</td>
          <td class="text-right">${formatMonto(liq.total_remunerativo)}</td>
          <td class="text-right">${formatMonto(liq.sueldo_neto)}</td>
          <td class="text-right">${formatMonto(liq.item_arraigo)}</td>
        </tr>
        `).join('') || '<tr><td colspan="10" style="text-align: center;">No hay liquidaciones</td></tr>'}
        <tr class="totals-row">
          <td colspan="6"><strong>TOTALES</strong></td>
          <td class="text-right"><strong>${totalHoras}</strong></td>
          <td class="text-right"><strong>${formatMonto(totalBruto)}</strong></td>
          <td class="text-right"><strong>${formatMonto(totalNeto)}</strong></td>
          <td class="text-right"><strong>${formatMonto(totalArraigo)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>
        <div class="firma-box">
          <div class="firma-label">Firma Responsable</div>
        </div>
      </div>
      <div>
        <div class="firma-box">
          <div class="firma-label">Sello del Establecimiento</div>
        </div>
      </div>
      <div>
        <div class="firma-box">
          <div class="firma-label">Fecha</div>
        </div>
      </div>
    </div>

    <p style="margin-top: 30px; font-size: 9px; color: #666; text-align: center;">
      Documento generado automaticamente por PRELIQ-DGE el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}
    </p>
  </div>

  <script>
    // Auto print when loaded (only if opened in new window)
    // window.onload = () => window.print();
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generando comprobante:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
