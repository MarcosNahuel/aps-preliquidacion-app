'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Download, Loader2, FileSpreadsheet, Users, DollarSign,
  Calendar, AlertCircle, Edit2, Save, X, Trash2, Check
} from 'lucide-react';
import type { Usuario, Presentacion } from '@/types/database';
import { ESTADOS_PRESENTACION, TIPOS_LIQUIDACION, TIPOS_PLANTA } from '@/types/database';

// Helper para obtener nombre del tipo de planta
const getTipoPlantaNombre = (codigo: string | null | undefined): string => {
  if (!codigo) return 'Planta Titular';
  const tipo = TIPOS_PLANTA.find(t => t.codigo === codigo);
  return tipo?.nombre || codigo;
};

interface Liquidacion {
  id: string;
  legajo: string;
  apellido_nombres: string;
  cuil: string;
  cargo: string;
  horas: number;
  sueldo_bruto: number;
  sueldo_neto: number;
  item_arraigo: number;
}

export default function PresentacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [presentacion, setPresentacion] = useState<Presentacion | null>(null);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para edicion
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Liquidacion>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

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

      if (sessionData.user.rol !== 'COLEGIO') {
        router.push('/auditor');
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

  const formatMonto = (monto: number | null | undefined) => {
    if (monto === null || monto === undefined) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  // Funciones de edicion
  const startEdit = (liq: Liquidacion) => {
    setEditingId(liq.id);
    setEditData({ ...liq });
    setMensaje(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (campo: keyof Liquidacion, valor: string | number) => {
    setEditData(prev => ({ ...prev, [campo]: valor }));
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/liquidaciones/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar lista local
        setLiquidaciones(prev => prev.map(l =>
          l.id === editingId ? { ...l, ...editData } as Liquidacion : l
        ));
        setEditingId(null);
        setEditData({});
        setMensaje({ tipo: 'success', texto: 'Liquidacion actualizada correctamente' });

        // Recargar para obtener totales actualizados
        fetchData();
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al guardar' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexion' });
    } finally {
      setSaving(false);
    }
  };

  const deleteLiquidacion = async (liquidacionId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/liquidaciones/${liquidacionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setLiquidaciones(prev => prev.filter(l => l.id !== liquidacionId));
        setDeleteConfirm(null);
        setMensaje({ tipo: 'success', texto: 'Liquidacion eliminada correctamente' });

        // Recargar para obtener totales actualizados
        fetchData();
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al eliminar' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexion' });
    } finally {
      setSaving(false);
    }
  };

  // Verificar si se puede editar (solo presentaciones CARGADAS)
  const puedeEditar = presentacion?.estado === 'CARGADA';

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
              onClick={() => router.push('/colegio')}
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

  // Calcular totales
  const totalBruto = liquidaciones.reduce((sum, liq) => sum + (liq.sueldo_bruto || 0), 0);
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
              onClick={() => router.push('/colegio')}
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

        {/* Mensaje de exito/error */}
        {mensaje && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {mensaje.tipo === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {mensaje.texto}
            <button
              onClick={() => setMensaje(null)}
              className="ml-auto p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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

        {/* Info de edicion */}
        {puedeEditar && (
          <div className="card bg-blue-50 border-blue-200 mb-4">
            <div className="flex items-center">
              <Edit2 className="h-5 w-5 text-blue-600 mr-3" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">Modo edicion disponible:</span> Haga clic en el icono de editar en cada fila para modificar los datos.
                Los cambios se guardan individualmente.
              </p>
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
                    {puedeEditar && (
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                        Acciones
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Legajo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
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
                    <tr key={liq.id} className={`hover:bg-gray-50 ${editingId === liq.id ? 'bg-yellow-50' : ''}`}>
                      {/* Columna de acciones */}
                      {puedeEditar && (
                        <td className="px-2 py-3 text-center">
                          {editingId === liq.id ? (
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Guardar"
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : deleteConfirm === liq.id ? (
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={() => deleteLiquidacion(liq.id)}
                                disabled={saving}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Confirmar eliminar"
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={() => startEdit(liq)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(liq.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Legajo */}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {editingId === liq.id ? (
                          <input
                            type="text"
                            value={editData.legajo || ''}
                            onChange={(e) => handleEditChange('legajo', e.target.value)}
                            className="w-16 px-2 py-1 text-sm border rounded"
                          />
                        ) : (
                          liq.legajo
                        )}
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {editingId === liq.id ? (
                          <input
                            type="text"
                            value={editData.apellido_nombres || ''}
                            onChange={(e) => handleEditChange('apellido_nombres', e.target.value)}
                            className="w-40 px-2 py-1 text-sm border rounded"
                          />
                        ) : (
                          liq.apellido_nombres
                        )}
                      </td>

                      {/* CUIL */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {editingId === liq.id ? (
                          <input
                            type="text"
                            value={editData.cuil || ''}
                            onChange={(e) => handleEditChange('cuil', e.target.value)}
                            className="w-28 px-2 py-1 text-sm border rounded"
                          />
                        ) : (
                          liq.cuil
                        )}
                      </td>

                      {/* Cargo */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {editingId === liq.id ? (
                          <input
                            type="text"
                            value={editData.cargo || ''}
                            onChange={(e) => handleEditChange('cargo', e.target.value)}
                            className="w-32 px-2 py-1 text-sm border rounded"
                          />
                        ) : (
                          liq.cargo
                        )}
                      </td>

                      {/* Horas */}
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {editingId === liq.id ? (
                          <input
                            type="number"
                            value={editData.horas || 0}
                            onChange={(e) => handleEditChange('horas', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border rounded text-right"
                          />
                        ) : (
                          liq.horas
                        )}
                      </td>

                      {/* Bruto */}
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {editingId === liq.id ? (
                          <input
                            type="number"
                            value={editData.sueldo_bruto || 0}
                            onChange={(e) => handleEditChange('sueldo_bruto', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-sm border rounded text-right"
                          />
                        ) : (
                          formatMonto(liq.sueldo_bruto)
                        )}
                      </td>

                      {/* Neto */}
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {editingId === liq.id ? (
                          <input
                            type="number"
                            value={editData.sueldo_neto || 0}
                            onChange={(e) => handleEditChange('sueldo_neto', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-sm border rounded text-right"
                          />
                        ) : (
                          formatMonto(liq.sueldo_neto)
                        )}
                      </td>

                      {/* Arraigo */}
                      <td className="px-4 py-3 text-sm text-primary-600 text-right font-medium">
                        {editingId === liq.id ? (
                          <input
                            type="number"
                            value={editData.item_arraigo || 0}
                            onChange={(e) => handleEditChange('item_arraigo', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-sm border rounded text-right"
                          />
                        ) : (
                          formatMonto(liq.item_arraigo)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    {puedeEditar && <td></td>}
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">
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
