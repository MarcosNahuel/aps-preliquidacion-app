'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  // Verificar si ya hay sesion activa
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.user) {
        // Ya hay sesion, redirigir segun rol
        if (data.user.rol === 'AUDITOR') {
          router.push('/seleccion-rol');
        } else {
          router.push('/colegio');
        }
        return;
      }
    } catch (error) {
      // No hay sesion, continuar mostrando login
    }
    setCheckingSession(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usar el endpoint del servidor para login (maneja cookies correctamente)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesion');
        setLoading(false);
        return;
      }

      // Redirigir segun respuesta del servidor
      router.push(data.redirectUrl);
    } catch (err) {
      setError('Error al iniciar sesion. Intente nuevamente.');
      setLoading(false);
    }
  };

  // Mostrar spinner mientras verifica sesion
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
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

        {/* Formulario de login */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
            Iniciar Sesion
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="usuario@ejemplo.com"
                autoComplete="email"
                className="w-full"
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
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
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

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <div className="text-center">
              <button
                onClick={() => router.push('/recuperar-password')}
                className="text-gray-600 hover:text-gray-700 text-sm hover:underline"
              >
                ¿Olvidaste tu contrasena?
              </button>
            </div>

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
