'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import type { Colegio, RolUsuario, NivelCodigo } from '@/types/database';
import { NIVELES } from '@/types/database';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolUsuario>('COLEGIO');
  const [nivel, setNivel] = useState<NivelCodigo | ''>('');
  const [idColegio, setIdColegio] = useState('');
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingColegios, setLoadingColegios] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar colegios cuando cambia el nivel
  useEffect(() => {
    if (nivel && rol === 'COLEGIO') {
      fetchColegios();
    }
  }, [nivel, rol]);

  const fetchColegios = async () => {
    setLoadingColegios(true);
    try {
      // Endpoint publico temporal para registro
      const response = await fetch(`/api/colegios/publico?nivel=${nivel}`);
      const data = await response.json();
      setColegios(data.colegios || []);
    } catch (error) {
      console.error('Error cargando colegios:', error);
    } finally {
      setLoadingColegios(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nombre,
          rol,
          id_colegio: rol === 'COLEGIO' ? idColegio : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Usuario ${data.usuario.email} creado exitosamente. Ahora puede iniciar sesion.`);
        // Limpiar formulario
        setEmail('');
        setPassword('');
        setNombre('');
        setIdColegio('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Registro de Usuario
          </h1>
          <p className="mt-2 text-gray-600">
            PRELIQ-DGE
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Usuario *
              </label>
              <select
                value={rol}
                onChange={(e) => {
                  setRol(e.target.value as RolUsuario);
                  setIdColegio('');
                  setNivel('');
                }}
                className="w-full"
              >
                <option value="COLEGIO">Colegio</option>
                <option value="AUDITOR">Auditor DGE</option>
              </select>
            </div>

            {rol === 'COLEGIO' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel *
                  </label>
                  <select
                    value={nivel}
                    onChange={(e) => {
                      setNivel(e.target.value as NivelCodigo);
                      setIdColegio('');
                    }}
                    required={rol === 'COLEGIO'}
                    className="w-full"
                  >
                    <option value="">Seleccione un nivel</option>
                    {NIVELES.map(n => (
                      <option key={n.codigo} value={n.codigo}>
                        {n.codigo} - {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colegio *
                  </label>
                  <select
                    value={idColegio}
                    onChange={(e) => setIdColegio(e.target.value)}
                    required={rol === 'COLEGIO'}
                    disabled={!nivel || loadingColegios}
                    className="w-full"
                  >
                    <option value="">
                      {loadingColegios ? 'Cargando...' : 'Seleccione un colegio'}
                    </option>
                    {colegios.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.codigo_nivel}-{c.codigo_colegio} {c.nombre ? `- ${c.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Perez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electronico *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contrasena *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creando usuario...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Crear Usuario
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al inicio de sesion
          </button>
        </div>
      </div>
    </div>
  );
}
