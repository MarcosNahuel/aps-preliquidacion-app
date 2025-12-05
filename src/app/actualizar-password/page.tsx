'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = createClient();

      // Escuchar eventos de autenticacion
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event, 'Session:', !!session);

          if (event === 'PASSWORD_RECOVERY') {
            // Usuario viene del link de recuperacion
            setValidSession(true);
            setInitializing(false);
          } else if (event === 'SIGNED_IN' && session) {
            // Usuario ya tiene sesion activa (puede ser de recovery)
            setValidSession(true);
            setInitializing(false);
          } else if (event === 'SIGNED_OUT') {
            setValidSession(false);
            setInitializing(false);
          }
        }
      );

      // Verificar si ya hay una sesion activa
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setValidSession(true);
      } else {
        // Dar tiempo para que se procese el hash de la URL
        setTimeout(() => {
          if (validSession === null) {
            setValidSession(false);
          }
          setInitializing(false);
        }, 2000);
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        setError('Error al actualizar la contrasena: ' + updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Cerrar sesion y redirigir al login despues de 3 segundos
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/');
      }, 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se inicializa
  if (initializing || validSession === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-600">Verificando enlace de recuperacion...</p>
      </div>
    );
  }

  // Sesion no valida
  if (validSession === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-600 p-3 rounded-xl">
                <XCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enlace Invalido
            </h1>
          </div>

          <div className="card text-center">
            <p className="text-gray-600 mb-6">
              El enlace de recuperacion ha expirado o no es valido.
              Por favor, solicita un nuevo enlace.
            </p>

            <button
              onClick={() => router.push('/recuperar-password')}
              className="btn-primary w-full py-3"
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exito al actualizar
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-3 rounded-xl">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Contrasena Actualizada
            </h1>
          </div>

          <div className="card text-center">
            <p className="text-gray-600 mb-4">
              Tu contrasena ha sido actualizada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Seras redirigido al inicio de sesion en unos segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nueva Contrasena
          </h1>
          <p className="mt-2 text-gray-600">
            Ingresa tu nueva contrasena
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimo 6 caracteres"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repite la contrasena"
                  className="pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar contrasena'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
