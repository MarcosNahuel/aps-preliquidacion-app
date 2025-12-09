'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.user && data.user.rol === 'AUDITOR') {
        router.push('/auditor');
        return;
      }
    } catch (err) {
      // No session, continue to login
    } finally {
      setCheckingSession(false);
    }
  };

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

        if (userData.rol !== 'AUDITOR') {
          setError('Este portal es solo para administradores. Use el portal de escuelas.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        router.push('/auditor');
      } else {
        if (rol !== 'AUDITOR') {
          setError('Este portal es solo para administradores. Use el portal de escuelas.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        router.push('/auditor');
      }
    } catch (err) {
      setError('Error al iniciar sesion. Intente nuevamente.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Portal Administrador
          </h1>
          <p className="mt-2 text-gray-600">
            Panel de Auditoria DGE
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
                placeholder="auditor@dge.mendoza.gov.ar"
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
              className="w-full py-3 px-4 flex items-center justify-center font-medium rounded-lg text-white transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
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
        </div>

        <div className="mt-4 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 mr-1" />
            Conexion segura - Portal Administrador
          </div>
        </div>
      </div>
    </div>
  );
}
