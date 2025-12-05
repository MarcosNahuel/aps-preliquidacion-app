'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/actualizar-password`,
      });

      if (resetError) {
        setError('Error al enviar el correo. Verifique que el email sea correcto.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

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
              Correo Enviado
            </h1>
          </div>

          <div className="card text-center">
            <p className="text-gray-600 mb-4">
              Hemos enviado un enlace de recuperacion a:
            </p>
            <p className="font-medium text-gray-900 mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contrasena.
              Si no encuentras el correo, revisa la carpeta de spam.
            </p>

            <button
              onClick={() => router.push('/')}
              className="btn-primary w-full py-3"
            >
              Volver al inicio de sesion
            </button>
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
            Recuperar Contrasena
          </h1>
          <p className="mt-2 text-gray-600">
            Ingresa tu correo y te enviaremos un enlace
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@ejemplo.com"
                  autoComplete="email"
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
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperacion'
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
