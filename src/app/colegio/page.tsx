'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PresentacionesTable from '@/components/PresentacionesTable';
import { Loader2, RefreshCw } from 'lucide-react';
import type { Usuario, Presentacion } from '@/types/database';

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
            Nivel {usuario.colegio?.codigo_nivel} - Codigo {usuario.colegio?.codigo_colegio}
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

        {/* Listado de presentaciones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Presentaciones
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
            rol="COLEGIO"
            onRefresh={fetchPresentaciones}
          />
        </div>
      </main>
    </div>
  );
}
