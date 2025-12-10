'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Download, Loader2, FileSpreadsheet, Users, DollarSign,
  Calendar, AlertCircle, Building2
} from 'lucide-react';
import type { Usuario, Presentacion } from '@/types/database';
import { ESTADOS_PRESENTACION, TIPOS_LIQUIDACION, TIPOS_PLANTA } from '@/types/database';

interface Liquidacion {
  id: string;
  legajo: string;
  apellido: string;
  nombres: string;
  cuil: string;
  cargo: string;
  horas: number;
  total_remunerativo: number;
  sueldo_neto: number;
  item_arraigo: number;
}

interface PresentacionConColegio extends Omit<Presentacion, 'colegio'> {
  colegio?: {
    id: string;
    codigo_nivel: string;
    codigo_colegio: string;
    nombre: string | null;
    cuit: string | null;
    porcentaje_subsidio: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
  };
}

export default function AuditorPresentacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [presentacion, setPresentacion] = useState<PresentacionConColegio | null>(null);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Verificar sesion
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.user) {
        router.push('/');
        return;
      }

      if (sessionData.user.rol !== 'AUDITOR') {
        router.push('/colegio');
        return;
      }

      setUsuario(sessionData.user);

      // Obtener presentacion
      const presRes = await fetch(`/api/presentaciones/${id}`);
      const presData = await presRes.json();

      if (!presRes.ok) {
        setError(presData.error || 'Error al cargar la presentacion');
        return;
      }

      setPresentacion(presData.presentacion);
      setLiquidaciones(presData.liquidaciones || []);
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const formatPeriodo = (periodo: string) => {
    const year = periodo.substring(0, 4);
    const month = parseInt(periodo.substring(4, 6)) - 1;
    const date = new Date(parseInt(year), month);
    return format(date, 'MMMM yyyy', { locale: es });
  };

  const getEstadoBadge = (estado: string) => {
    const config = ESTADOS_PRESENTACION.find(e => e.codigo === estado);
    return config || { nombre: estado, color: 'bg-gray-100 text-gray-800' };
  };

  const getTipoNombre = (tipo: string) => {
    const config = TIPOS_LIQUIDACION.find(t => t.codigo === tipo);
    return config?.nombre || tipo;
  };

  const getTipoPlantaNombre = (tipo: string) => {
    const config = TIPOS_PLANTA.find(t => t.codigo === tipo);
    return config?.nombre || tipo;
  };

  const formatMonto = (monto: number | null | undefined) => {
    if (monto === null || monto === undefined) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !presentacion) {
    return (
      <div className="min-h-screen bg-gray-50">
        {usuario && <Header usuario={usuario} />}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error || 'Presentacion no encontrada'}</p>
            <button
              onClick={() => router.push('/auditor')}
              className="mt-4 btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </button>
          </div>
        </main>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(presentacion.estado);
  const colegioCode = presentacion.colegio
    ? `${presentacion.colegio.codigo_nivel}-${presentacion.colegio.codigo_colegio}`
    : 'N/A';

  // Calcular totales
  const totalBruto = liquidaciones.reduce((sum, liq) => sum + (liq.total_remunerativo || 0), 0);
  const totalNeto = liquidaciones.reduce((sum, liq) => sum + (liq.sueldo_neto || 0), 0);
  const totalArraigo = liquidaciones.reduce((sum, liq) => sum + (liq.item_arraigo || 0), 0);
  const totalHoras = liquidaciones.reduce((sum, liq) => sum + (liq.horas || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {usuario && <Header usuario={usuario} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/auditor')}
              className="mr-4 p-2 hover:bg-gray-200 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Presentacion {formatPeriodo(presentacion.periodo)}
              </h1>
              <p className="text-gray-600">
                {getTipoNombre(presentacion.tipo_liquidacion)} - {getTipoPlantaNombre(presentacion.tipo_planta)}
              </p>
            </div>
          </div>
          <span className={`badge ${estadoBadge.color} text-sm px-3 py-1`}>
            {estadoBadge.nombre}
          </span>
        </div>

        {/* Info del Colegio */}
        <div className="card bg-green-50 border-green-200 mb-6">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">
                Colegio: {colegioCode}
              </p>
              <p className="text-sm text-green-600">
                {presentacion.colegio?.nombre || 'Sin nombre registrado'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Filas</p>
              <p className="text-xl font-bold text-gray-900">{liquidaciones.length}</p>
            </div>
          </div>

          <div className="card flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-xl font-bold text-gray-900">
                {formatMonto(totalBruto)}
              </p>
            </div>
          </div>

          <div className="card flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha Subida</p>
              <p className="text-lg font-medium text-gray-900">
                {format(new Date(presentacion.fecha_subida), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>

          <div className="card flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <FileSpreadsheet className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Errores</p>
              <p className="text-xl font-bold text-gray-900">
                {presentacion.filas_con_error}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de descarga */}
        <div className="card bg-blue-50 border-blue-200 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Descargas disponibles</p>
                <p className="text-sm text-blue-600">
                  Descargue el Excel completo o el comprobante de presentacion
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/descargas/excel/${presentacion.id}`}
                className="btn-secondary bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel
              </a>
              <a
                href={`/api/descargas/comprobante/${presentacion.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Comprobante PDF
              </a>
            </div>
          </div>
        </div>

        {/* Errores si existen */}
        {presentacion.estado === 'RECHAZADA' && presentacion.ruta_archivo_errores && (
          <div className="card bg-red-50 border-red-200 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-800">Presentacion con errores</p>
                  <p className="text-sm text-red-600">
                    Se encontraron {presentacion.filas_con_error} filas con errores
                  </p>
                </div>
              </div>
              <a
                href={`/api/descargas/errores/${presentacion.id}`}
                className="btn-secondary bg-white text-red-600 border-red-300 hover:bg-red-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Errores
              </a>
            </div>
          </div>
        )}

        {/* Tabla de liquidaciones */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900">
              Detalle de Liquidaciones ({liquidaciones.length})
            </h3>
          </div>

          {liquidaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay liquidaciones cargadas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Legajo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Apellido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombres
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CUIL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cargo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Horas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Bruto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Neto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Arraigo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {liquidaciones.map((liq) => (
                    <tr key={liq.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {liq.legajo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {liq.apellido || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {liq.nombres || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {liq.cuil || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {liq.cargo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {liq.horas || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatMonto(liq.total_remunerativo)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatMonto(liq.sueldo_neto)}
                      </td>
                      <td className="px-4 py-3 text-sm text-primary-600 text-right font-medium">
                        {formatMonto(liq.item_arraigo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-900">
                      TOTALES
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {totalHoras}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {formatMonto(totalBruto)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {formatMonto(totalNeto)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-primary-600 text-right">
                      {formatMonto(totalArraigo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
