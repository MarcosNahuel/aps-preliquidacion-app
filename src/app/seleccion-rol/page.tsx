'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, ClipboardCheck, LogOut, School, ChevronDown, Search } from 'lucide-react';
import type { Usuario, Colegio } from '@/types/database';

export default function SeleccionRolPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [showColegioSelector, setShowColegioSelector] = useState(false);
  const [selectedColegio, setSelectedColegio] = useState<Colegio | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectingColegio, setSelectingColegio] = useState(false);

  useEffect(() => {
    checkSession();
    fetchColegios();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (!data.user) {
        router.push('/');
        return;
      }

      // Solo AUDITOR puede ver esta pagina
      if (data.user.rol !== 'AUDITOR') {
        router.push('/colegio');
        return;
      }

      setUsuario(data.user);

      // Si ya tiene un colegio seleccionado, cargarlo
      if (data.user.colegio) {
        setSelectedColegio(data.user.colegio);
      }
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

  const handleSelectColegio = async (colegio: Colegio) => {
    setSelectingColegio(true);
    try {
      const response = await fetch('/api/auth/select-colegio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colegioId: colegio.id })
      });

      if (response.ok) {
        setSelectedColegio(colegio);
        setShowColegioSelector(false);
        // Navegar al modulo de carga
        router.push('/colegio');
      }
    } catch (error) {
      console.error('Error selecting colegio:', error);
    } finally {
      setSelectingColegio(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const handleGoToCargar = () => {
    if (selectedColegio) {
      router.push('/colegio');
    } else {
      setShowColegioSelector(true);
    }
  };

  // Filtrar colegios por busqueda
  const filteredColegios = colegios.filter(c => {
    const search = searchTerm.toLowerCase();
    const codigo = `${c.codigo_nivel}-${c.codigo_colegio}`.toLowerCase();
    const nombre = (c.nombre || '').toLowerCase();
    return codigo.includes(search) || nombre.includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      {/* Header simple */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-primary-700">PRELIQ-DGE</h1>
              <p className="text-sm text-gray-600">Sistema de Preliquidaciones</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {usuario.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Seleccione un modulo
            </h2>
            <p className="text-gray-600">
              Como administrador, puede acceder a ambos modulos del sistema
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Opcion: Cargar Presentaciones */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-primary-500 transition-all">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cargar Presentaciones
              </h3>
              <p className="text-gray-600 mb-4">
                Acceda al modulo de carga para subir y gestionar presentaciones de liquidaciones.
              </p>

              {/* Selector de colegio */}
              {selectedColegio ? (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {selectedColegio.codigo_nivel}-{selectedColegio.codigo_colegio}
                      </span>
                      {selectedColegio.nombre && (
                        <span className="text-sm text-blue-600">
                          - {selectedColegio.nombre}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowColegioSelector(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Debe seleccionar un colegio para cargar presentaciones
                  </p>
                </div>
              )}

              <button
                onClick={handleGoToCargar}
                className="w-full btn-primary"
              >
                {selectedColegio ? 'Ir al modulo de carga' : 'Seleccionar colegio'}
              </button>
            </div>

            {/* Opcion: Panel de Auditoria */}
            <button
              onClick={() => router.push('/auditor')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-6 group-hover:bg-green-200 transition-colors">
                <ClipboardCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Panel de Auditoria
              </h3>
              <p className="text-gray-600 mb-4">
                Revise, audite y gestione todas las presentaciones de los colegios. Descargue reportes consolidados.
              </p>
              <span className="text-green-600 font-medium group-hover:underline">
                Ir al panel de auditoria →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal selector de colegio */}
      {showColegioSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Seleccionar Colegio
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Elija el colegio para el cual desea cargar presentaciones
              </p>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por codigo o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Lista de colegios */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredColegios.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No se encontraron colegios
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredColegios.map((colegio) => (
                    <button
                      key={colegio.id}
                      onClick={() => handleSelectColegio(colegio)}
                      disabled={selectingColegio}
                      className="w-full p-3 text-left rounded-lg border hover:bg-primary-50 hover:border-primary-300 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {colegio.codigo_nivel}-{colegio.codigo_colegio}
                          </span>
                          {colegio.nombre && (
                            <span className="ml-2 text-gray-600">
                              - {colegio.nombre}
                            </span>
                          )}
                        </div>
                        {colegio.porcentaje_subsidio && (
                          <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                            {colegio.porcentaje_subsidio}%
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer del modal */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowColegioSelector(false)}
                className="w-full btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          Direccion General de Escuelas - Gobierno de Mendoza
        </div>
      </div>
    </div>
  );
}
