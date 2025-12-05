'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Lock, Trash2, Download, AlertCircle, Loader2 } from 'lucide-react';
import type { Presentacion } from '@/types/database';
import { ESTADOS_PRESENTACION, TIPOS_LIQUIDACION } from '@/types/database';

interface PresentacionesTableProps {
  presentaciones: Presentacion[];
  rol: 'COLEGIO' | 'AUDITOR';
  onRefresh: () => void;
}

export default function PresentacionesTable({
  presentaciones,
  rol,
  onRefresh
}: PresentacionesTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleCerrar = async (id: string) => {
    if (!confirm('Esta seguro que desea cerrar esta presentacion? Esta accion no se puede deshacer.')) {
      return;
    }

    setLoading(id);
    setError(null);

    try {
      const response = await fetch(`/api/presentaciones/${id}/cerrar`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cerrar la presentacion');
      } else {
        onRefresh();
      }
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setLoading(null);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('Esta seguro que desea eliminar esta presentacion? Se eliminaran todos los datos asociados.')) {
      return;
    }

    setLoading(id);
    setError(null);

    try {
      const response = await fetch(`/api/presentaciones/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al eliminar la presentacion');
      } else {
        onRefresh();
      }
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setLoading(null);
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  if (presentaciones.length === 0) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay presentaciones registradas</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {rol === 'AUDITOR' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colegio
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Periodo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Filas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {presentaciones.map((pres) => {
              const estadoBadge = getEstadoBadge(pres.estado);
              const isLoading = loading === pres.id;

              return (
                <tr key={pres.id} className="hover:bg-gray-50">
                  {rol === 'AUDITOR' && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pres.colegio?.codigo_nivel}-{pres.colegio?.codigo_colegio}
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPeriodo(pres.periodo)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getTipoNombre(pres.tipo_liquidacion)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`badge ${estadoBadge.color}`}>
                      {estadoBadge.nombre}
                    </span>
                    {pres.tipo_error && (
                      <span className="ml-2 text-xs text-red-600">
                        ({pres.tipo_error})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {pres.total_filas}
                    {pres.filas_con_error > 0 && (
                      <span className="text-red-600 ml-1">
                        ({pres.filas_con_error} errores)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatMonto(pres.costo_total_presentado)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(pres.fecha_subida), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <>
                          {pres.estado === 'RECHAZADA' && pres.ruta_archivo_errores && (
                            <a
                              href={`/api/descargas/errores/${pres.id}`}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Descargar errores"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}

                          {pres.estado === 'CARGADA' && (
                            <>
                              <button
                                onClick={() => handleCerrar(pres.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Cerrar presentacion"
                              >
                                <Lock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEliminar(pres.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar presentacion"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {rol === 'AUDITOR' && pres.ruta_archivo_original && (
                            <a
                              href={`/api/descargas/original/${pres.id}`}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                              title="Descargar original"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}

                          <a
                            href={`/${rol.toLowerCase()}/presentaciones/${pres.id}`}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
