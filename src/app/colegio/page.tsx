'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PresentacionesTable from '@/components/PresentacionesTable';
import { Loader2, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import type { Usuario, Presentacion, NivelCodigo } from '@/types/database';
import { NIVELES, TIPOS_PLANTA } from '@/types/database';

// Helper para obtener nombre del tipo de planta
const getTipoPlantaNombre = (codigo: string | null | undefined): string => {
  if (!codigo) return 'Planta Titular';
  const tipo = TIPOS_PLANTA.find(t => t.codigo === codigo);
  return tipo?.nombre || codigo;
};

// Helper para obtener nombre completo del nivel
const getNivelNombre = (codigo: string | null | undefined): string => {
  if (!codigo) return '';
  const nivel = NIVELES.find(n => n.codigo === codigo);
  return nivel?.nombre || codigo;
};

export default function ColegioPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (!data.user) {
        router.push('/');
        return;
      }

      if (data.user.rol !== 'COLEGIO') {
        router.push('/auditor');
        return;
      }

      setUsuario(data.user);
      await fetchPresentaciones();
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresentaciones = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/presentaciones');
      const data = await response.json();
      setPresentaciones(data.presentaciones || []);
    } catch (error) {
      console.error('Error fetching presentaciones:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header usuario={usuario} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del colegio */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {usuario.colegio?.nombre || `Colegio ${usuario.colegio?.codigo_nivel}-${usuario.colegio?.codigo_colegio}`}
          </h2>
          <p className="text-gray-600">
            Nivel {getNivelNombre(usuario.colegio?.codigo_nivel)} ({usuario.colegio?.codigo_nivel}) - Codigo {usuario.colegio?.codigo_colegio}
            {usuario.colegio?.porcentaje_subsidio && (
              <span className="ml-2 text-primary-600">
                ({usuario.colegio.porcentaje_subsidio}% subsidio)
              </span>
            )}
          </p>
        </div>

        {/* Upload de archivo */}
        <div className="mb-8">
          <FileUpload
            idColegio={usuario.colegio?.id}
            onSuccess={fetchPresentaciones}
          />
        </div>

        {/* Separar presentaciones por estado */}
        {(() => {
          const cerradas = presentaciones.filter(p => p.estado === 'CERRADA');
          const enProceso = presentaciones.filter(p => p.estado !== 'CERRADA');

          const formatMonto = (monto: number) => {
            return new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS'
            }).format(monto);
          };

          // Calcular total bruto de cerradas
          const totalBrutoCerradas = cerradas.reduce((sum, p) => sum + (p.costo_total_presentado || 0), 0);

          return (
            <>
              {/* Presentaciones Cerradas */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Presentaciones Cerradas ({cerradas.length})
                    </h3>
                  </div>
                  <button
                    onClick={fetchPresentaciones}
                    disabled={refreshing}
                    className="btn-secondary text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                </div>

                {cerradas.length === 0 ? (
                  <div className="card text-center py-8 text-gray-500">
                    No hay presentaciones cerradas
                  </div>
                ) : (
                  <div className="card p-0 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Liq.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planta</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Filas</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Bruto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Cierre</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cerradas.map((pres) => (
                          <tr key={pres.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(parseInt(pres.periodo.substring(0, 4)), parseInt(pres.periodo.substring(4, 6)) - 1)
                                .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{pres.tipo_liquidacion}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{getTipoPlantaNombre(pres.tipo_planta)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{pres.total_filas}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              {formatMonto(pres.costo_total_presentado)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(pres.fecha_cierre || pres.fecha_subida).toLocaleDateString('es-AR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <a
                                href={`/colegio/presentaciones/${pres.id}`}
                                className="text-primary-600 hover:text-primary-800 font-medium"
                              >
                                Ver detalle
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-green-100 border-t-2 border-green-300">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">
                            TOTAL PRESENTACIONES CERRADAS
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            {formatMonto(totalBrutoCerradas)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Presentaciones en Proceso */}
              <div>
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Presentaciones en Proceso ({enProceso.length})
                  </h3>
                </div>

                <PresentacionesTable
                  presentaciones={enProceso}
                  rol="COLEGIO"
                  onRefresh={fetchPresentaciones}
                />
              </div>
            </>
          );
        })()}
      </main>
    </div>
  );
}
