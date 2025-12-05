'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PresentacionesTable from '@/components/PresentacionesTable';
import { Loader2, RefreshCw, Filter, Download, Building2 } from 'lucide-react';
import type { Usuario, Presentacion, Colegio, NivelCodigo, TipoLiquidacion, EstadoPresentacion } from '@/types/database';
import { NIVELES, TIPOS_LIQUIDACION, ESTADOS_PRESENTACION } from '@/types/database';

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

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (usuario) {
      fetchPresentaciones();
    }
  }, [filtroNivel, filtroColegio, filtroPeriodo, filtroTipo, filtroEstado]);

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <button
              onClick={limpiarFiltros}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
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
