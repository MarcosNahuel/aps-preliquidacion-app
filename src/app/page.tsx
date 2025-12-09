'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, ShieldCheck, Loader2, GraduationCap, Shield, ArrowLeft } from 'lucide-react';

type TipoAcceso = 'seleccion' | 'colegio' | 'auditor';

export default function LoginPage() {
  const router = useRouter();
  const [tipoAcceso, setTipoAcceso] = useState<TipoAcceso>('seleccion');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Credenciales incorrectas. Verifique su email y contrasena.');
        setLoading(false);
        return;
      }

      // Obtener rol del metadata del usuario de auth
      const userMetadata = authData.user.user_metadata;
      const rol = userMetadata?.rol;

      if (!rol) {
        // Si no hay rol en metadata, intentar obtener de la tabla
        const { data: userData, error: userError } = await supabase
          .from('aps_usuarios')
          .select('id, rol, activo')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (userError || !userData) {
          setError('Usuario no encontrado en el sistema. Contacte al administrador.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!userData.activo) {
          setError('Su cuenta esta desactivada. Contacte al administrador.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Verificar que el tipo de acceso coincide con el rol
        if (tipoAcceso === 'auditor' && userData.rol !== 'AUDITOR') {
          setError('Este usuario no tiene permisos de administrador.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (tipoAcceso === 'colegio' && userData.rol !== 'COLEGIO') {
          setError('Este usuario no esta asociado a ningun colegio.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Redirigir segun rol de la DB
        if (userData.rol === 'AUDITOR') {
          router.push('/auditor');
        } else {
          router.push('/colegio');
        }
      } else {
        // Verificar que el tipo de acceso coincide con el rol
        if (tipoAcceso === 'auditor' && rol !== 'AUDITOR') {
          setError('Este usuario no tiene permisos de administrador.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (tipoAcceso === 'colegio' && rol !== 'COLEGIO') {
          setError('Este usuario no esta asociado a ningun colegio.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Redirigir segun rol del metadata
        if (rol === 'AUDITOR') {
          router.push('/auditor');
        } else {
          router.push('/colegio');
        }
      }
    } catch (err) {
      setError('Error al iniciar sesion. Intente nuevamente.');
      setLoading(false);
    }
  };

  const volverASeleccion = () => {
    setTipoAcceso('seleccion');
    setEmail('');
    setPassword('');
    setError('');
  };

  // Pantalla de seleccion de tipo de acceso
  if (tipoAcceso === 'seleccion') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-600 p-4 rounded-2xl shadow-lg">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              PRELIQ-DGE
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Sistema de Preliquidaciones Colegios Privados
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Direccion General de Escuelas - Mendoza
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
              Seleccione el tipo de acceso
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Boton Colegio */}
              <button
                onClick={() => setTipoAcceso('colegio')}
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 hover:shadow-lg"
              >
                <div className="bg-blue-500 p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Colegio
                </h3>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Acceso para escuelas y colegios privados
                </p>
              </button>

              {/* Boton Administrador/Auditor */}
              <button
                onClick={() => setTipoAcceso('auditor')}
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-200 hover:shadow-lg"
              >
                <div className="bg-emerald-500 p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Administrador
                </h3>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Acceso para auditores DGE
                </p>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <span className="text-sm text-gray-600">¿No tienes cuenta? </span>
                <button
                  onClick={() => router.push('/registro')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline"
                >
                  Registrate aqui
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Conexion segura
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de login para tipo especifico
  const esAuditor = tipoAcceso === 'auditor';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      esAuditor ? 'bg-gradient-to-b from-emerald-50 to-gray-100' : 'bg-gradient-to-b from-blue-50 to-gray-100'
    }`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-xl shadow-lg ${
              esAuditor ? 'bg-emerald-500' : 'bg-blue-500'
            }`}>
              {esAuditor ? (
                <Shield className="h-10 w-10 text-white" />
              ) : (
                <GraduationCap className="h-10 w-10 text-white" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {esAuditor ? 'Acceso Administrador' : 'Acceso Colegio'}
          </h1>
          <p className="mt-2 text-gray-600">
            {esAuditor ? 'Panel de Auditoria DGE' : 'Portal de Colegio'}
          </p>
          <p className="text-sm text-gray-500">
            PRELIQ-DGE
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={esAuditor ? 'auditor@dge.mendoza.gov.ar' : 'usuario@colegio.edu.ar'}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 flex items-center justify-center font-medium rounded-lg text-white transition-colors ${
                esAuditor
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Iniciando sesion...
                </>
              ) : (
                'Iniciar sesion'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              onClick={() => router.push('/recuperar-password')}
              className="text-gray-600 hover:text-gray-700 text-sm hover:underline"
            >
              ¿Olvidaste tu contrasena?
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={volverASeleccion}
              className={`text-sm flex items-center justify-center mx-auto ${
                esAuditor ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a seleccionar tipo de acceso
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 mr-1" />
            Conexion segura
          </div>
        </div>
      </div>
    </div>
  );
}
