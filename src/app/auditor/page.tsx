'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PresentacionesTable from '@/components/PresentacionesTable';
import { Loader2, RefreshCw, Filter, Download, Building2, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import type { Usuario, Presentacion, Colegio, NivelCodigo, TipoLiquidacion, EstadoPresentacion, TipoPlanta } from '@/types/database';
import { NIVELES, TIPOS_LIQUIDACION, ESTADOS_PRESENTACION, TIPOS_PLANTA } from '@/types/database';

export default function AuditorPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [filtroNivel, setFiltroNivel] = useState<NivelCodigo | ''>('');
  const [filtroColegio, setFiltroColegio] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoLiquidacion | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPresentacion | ''>('');
  const [filtroTipoPlanta, setFiltroTipoPlanta] = useState<TipoPlanta | ''>('');

  // Descarga consolidada
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (usuario) {
      fetchPresentaciones();
    }
  }, [filtroNivel, filtroColegio, filtroPeriodo, filtroTipo, filtroEstado, filtroTipoPlanta]);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (!data.user) {
        router.push('/');
        return;
      }

      if (data.user.rol !== 'AUDITOR') {
        router.push('/colegio');
        return;
      }

      setUsuario(data.user);
      await Promise.all([fetchColegios(), fetchPresentaciones()]);
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchColegios = async () => {
    try {
      const response = await fetch('/api/colegios?activo=true');
      const data = await response.json();
      setColegios(data.colegios || []);
    } catch (error) {
      console.error('Error fetching colegios:', error);
    }
  };

  const fetchPresentaciones = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filtroColegio) params.append('id_colegio', filtroColegio);
      if (filtroPeriodo) params.append('periodo', filtroPeriodo);
      if (filtroTipo) params.append('tipo_liquidacion', filtroTipo);
      if (filtroEstado) params.append('estado', filtroEstado);

      const response = await fetch(`/api/presentaciones?${params.toString()}`);
      const data = await response.json();

      let filtered = data.presentaciones || [];

      // Filtrar por nivel en cliente (ya que el API no tiene ese filtro)
      if (filtroNivel) {
        filtered = filtered.filter((p: Presentacion) => p.colegio?.codigo_nivel === filtroNivel);
      }

      setPresentaciones(filtered);
    } catch (error) {
      console.error('Error fetching presentaciones:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroNivel('');
    setFiltroColegio('');
    setFiltroPeriodo('');
    setFiltroTipo('');
    setFiltroEstado('');
    setFiltroTipoPlanta('');
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtroNivel || filtroColegio || filtroPeriodo || filtroTipo || filtroEstado || filtroTipoPlanta;

  // Obtener nombre del colegio por ID
  const getNombreColegioFiltrado = () => {
    const colegio = colegios.find(c => c.id === filtroColegio);
    return colegio ? `${colegio.codigo_nivel}-${colegio.codigo_colegio}` : '';
  };

  // Generar chips de filtros activos
  const getFiltrosActivos = () => {
    const filtros: { label: string; value: string; onRemove: () => void }[] = [];

    if (filtroNivel) {
      const nivel = NIVELES.find(n => n.codigo === filtroNivel);
      filtros.push({
        label: 'Nivel',
        value: nivel ? `${nivel.codigo} - ${nivel.nombre}` : filtroNivel,
        onRemove: () => { setFiltroNivel(''); setFiltroColegio(''); }
      });
    }
    if (filtroColegio) {
      filtros.push({
        label: 'Colegio',
        value: getNombreColegioFiltrado(),
        onRemove: () => setFiltroColegio('')
      });
    }
    if (filtroPeriodo) {
      const periodos = generarPeriodos();
      const periodo = periodos.find(p => p.value === filtroPeriodo);
      filtros.push({
        label: 'Periodo',
        value: periodo?.label || filtroPeriodo,
        onRemove: () => setFiltroPeriodo('')
      });
    }
    if (filtroTipo) {
      const tipo = TIPOS_LIQUIDACION.find(t => t.codigo === filtroTipo);
      filtros.push({
        label: 'Tipo',
        value: tipo?.nombre || filtroTipo,
        onRemove: () => setFiltroTipo('')
      });
    }
    if (filtroTipoPlanta) {
      const planta = TIPOS_PLANTA.find(t => t.codigo === filtroTipoPlanta);
      filtros.push({
        label: 'Planta',
        value: planta?.nombre || filtroTipoPlanta,
        onRemove: () => setFiltroTipoPlanta('')
      });
    }
    if (filtroEstado) {
      const estado = ESTADOS_PRESENTACION.find(e => e.codigo === filtroEstado);
      filtros.push({
        label: 'Estado',
        value: estado?.nombre || filtroEstado,
        onRemove: () => setFiltroEstado('')
      });
    }

    return filtros;
  };

  // Descargar consolidado
  const handleDescargarConsolidado = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      const params = new URLSearchParams();
      if (filtroNivel) params.append('nivel', filtroNivel);
      if (filtroColegio) params.append('id_colegio', filtroColegio);
      if (filtroPeriodo) params.append('periodo', filtroPeriodo);
      if (filtroTipo) params.append('tipo_liquidacion', filtroTipo);
      if (filtroTipoPlanta) params.append('tipo_planta', filtroTipoPlanta);
      if (filtroEstado) {
        params.append('estado', filtroEstado);
      } else {
        params.append('estado', 'CERRADA'); // Por defecto solo cerradas
      }

      const response = await fetch(`/api/descargas/consolidado?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al descargar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'consolidado.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setDownloadError(error.message || 'Error al descargar el consolidado');
    } finally {
      setDownloading(false);
    }
  };

  // Generar periodos disponibles
  const generarPeriodos = () => {
    const periodos = [];
    const now = new Date();
    for (let i = 0; i <= 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodo = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nombre = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      periodos.push({ value: periodo, label: nombre.charAt(0).toUpperCase() + nombre.slice(1) });
    }
    return periodos;
  };

  // Estadisticas
  const stats = {
    total: presentaciones.length,
    cargadas: presentaciones.filter(p => p.estado === 'CARGADA').length,
    cerradas: presentaciones.filter(p => p.estado === 'CERRADA').length,
    rechazadas: presentaciones.filter(p => p.estado === 'RECHAZADA').length,
    costoTotal: presentaciones
      .filter(p => p.estado !== 'RECHAZADA')
      .reduce((sum, p) => sum + p.costo_total_presentado, 0)
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(monto);
  };

  // Filtrar colegios por nivel
  const colegiosFiltrados = filtroNivel
    ? colegios.filter(c => c.codigo_nivel === filtroNivel)
    : colegios;

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

      <main className="max-w-[92rem] mx-auto px-2 sm:px-4 lg:px-6 py-8">
        {/* Titulo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Panel de Auditoria</h2>
          <p className="text-gray-600">
            Direccion de Educacion Privada - Control de Preliquidaciones
          </p>
        </div>

        {/* Estadisticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.cargadas}</p>
            <p className="text-sm text-gray-500">Pendientes</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{stats.cerradas}</p>
            <p className="text-sm text-gray-500">Cerradas</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
            <p className="text-sm text-gray-500">Rechazadas</p>
          </div>
          <div className="card text-center col-span-2 md:col-span-1">
            <p className="text-xl font-bold text-primary-600">{formatMonto(stats.costoTotal)}</p>
            <p className="text-sm text-gray-500">Costo Total</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">Filtros</h3>
            </div>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nivel</label>
              <select
                value={filtroNivel}
                onChange={(e) => {
                  setFiltroNivel(e.target.value as NivelCodigo | '');
                  setFiltroColegio('');
                }}
                className="w-full text-sm"
              >
                <option value="">Todos</option>
                {NIVELES.map(n => (
                  <option key={n.codigo} value={n.codigo}>{n.codigo} - {n.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Colegio</label>
              <select
                value={filtroColegio}
                onChange={(e) => setFiltroColegio(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">Todos</option>
                {colegiosFiltrados.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.codigo_nivel}-{c.codigo_colegio}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Periodo</label>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">Todos</option>
                {generarPeriodos().map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Liq.</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoLiquidacion | '')}
                className="w-full text-sm"
              >
                <option value="">Todos</option>
                {TIPOS_LIQUIDACION.map(t => (
                  <option key={t.codigo} value={t.codigo}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Planta</label>
              <select
                value={filtroTipoPlanta}
                onChange={(e) => setFiltroTipoPlanta(e.target.value as TipoPlanta | '')}
                className="w-full text-sm"
              >
                <option value="">Todos</option>
                {TIPOS_PLANTA.map(t => (
                  <option key={t.codigo} value={t.codigo}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoPresentacion | '')}
                className="w-full text-sm"
              >
                <option value="">Todos</option>
                {ESTADOS_PRESENTACION.map(e => (
                  <option key={e.codigo} value={e.codigo}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chips de filtros activos */}
          {hayFiltrosActivos && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs text-gray-500 mr-1">Filtros activos:</span>
                {getFiltrosActivos().map((filtro, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    <span className="text-primary-600 mr-1">{filtro.label}:</span>
                    {filtro.value}
                    <button
                      onClick={filtro.onRemove}
                      className="ml-2 hover:text-primary-600 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seccion de Descarga Consolidada */}
        <div className="card mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Descargar Base Consolidada para Expediente</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Descargue un Excel con todas las liquidaciones {filtroEstado === 'CERRADA' || !filtroEstado ? 'cerradas' : ''}
                  {hayFiltrosActivos ? ' que coinciden con los filtros aplicados' : ' de todos los colegios'}.
                  Incluye resumen, detalle de liquidaciones y totales por colegio para el tramite de subvencion.
                </p>
                {hayFiltrosActivos && (
                  <p className="text-xs text-green-700 mt-2 font-medium">
                    Se exportaran {stats.cerradas} presentaciones cerradas con los filtros actuales
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleDescargarConsolidado}
                disabled={downloading || stats.cerradas === 0}
                className="btn-primary bg-green-600 hover:bg-green-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Consolidado
                  </>
                )}
              </button>
              {downloadError && (
                <div className="flex items-center text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {downloadError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listado de presentaciones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Presentaciones ({presentaciones.length})
            </h3>
            <button
              onClick={fetchPresentaciones}
              disabled={refreshing}
              className="btn-secondary text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          <PresentacionesTable
            presentaciones={presentaciones}
            rol="AUDITOR"
            onRefresh={fetchPresentaciones}
          />
        </div>
      </main>
    </div>
  );
}
