'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, LogOut, User, Menu, X, RefreshCw } from 'lucide-react';
import type { Usuario } from '@/types/database';

interface HeaderProps {
  usuario: Usuario;
}

export default function Header({ usuario }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCambiarModo = () => {
    // Solo para AUDITOR: volver a la seleccion de modo sin cerrar sesion
    router.push('/seleccion-rol');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y titulo */}
          <div className="flex items-center">
            <div className="bg-primary-600 p-2 rounded-lg mr-3">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                PRELIQ-DGE
              </h1>
              <p className="text-xs text-gray-500">
                {usuario.rol === 'AUDITOR' ? 'Panel de Auditoria' : 'Portal de Colegio'}
              </p>
            </div>
          </div>

          {/* Info usuario desktop */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{usuario.nombre || usuario.email}</p>
              <p className="text-xs text-gray-500">
                {usuario.rol === 'AUDITOR' ? 'Auditor DGE' : usuario.colegio ?
                  `${usuario.colegio.codigo_nivel}-${usuario.colegio.codigo_colegio}` : 'Colegio'}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            {/* Solo mostrar "Cambiar Modo" para AUDITOR */}
            {usuario.rol === 'AUDITOR' && (
              <button
                onClick={handleCambiarModo}
                className="btn-secondary text-sm"
                title="Cambiar entre modo carga y auditoria"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Cambiar Modo
              </button>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary text-sm"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </button>
          </div>

          {/* Menu mobile */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu mobile expandido */}
        {menuOpen && (
          <div className="sm:hidden py-4 border-t">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full mr-3">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{usuario.nombre || usuario.email}</p>
                <p className="text-xs text-gray-500">
                  {usuario.rol === 'AUDITOR' ? 'Auditor DGE' : 'Colegio'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {/* Solo mostrar "Cambiar Modo" para AUDITOR en mobile */}
              {usuario.rol === 'AUDITOR' && (
                <button
                  onClick={handleCambiarModo}
                  className="btn-secondary w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cambiar Modo
                </button>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn-secondary w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
