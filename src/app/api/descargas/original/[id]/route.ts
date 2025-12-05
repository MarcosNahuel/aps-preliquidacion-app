import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener presentacion
    const { data: presentacion } = await supabase
      .from('aps_presentaciones')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!presentacion) {
      return NextResponse.json({ error: 'Presentacion no encontrada' }, { status: 404 });
    }

    // Verificar acceso (solo auditores pueden descargar originales)
    if (userData.rol !== 'AUDITOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!presentacion.ruta_archivo_original) {
      return NextResponse.json({ error: 'No hay archivo original disponible' }, { status: 404 });
    }

    // Descargar archivo
    const { data, error } = await supabase.storage
      .from('archivos-originales')
      .download(presentacion.ruta_archivo_original);

    if (error) {
      return NextResponse.json({ error: 'Error al descargar archivo' }, { status: 500 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="original_${presentacion.periodo}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
