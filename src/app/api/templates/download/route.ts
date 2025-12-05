import { NextResponse } from 'next/server';
import { generarPlantillaModelo } from '@/lib/excel/generator';

export async function GET() {
  try {
    const buffer = await generarPlantillaModelo();

    // Convertir Buffer a Uint8Array para compatibilidad con NextResponse
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Plantilla_Preliquidacion.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generando plantilla:', error);
    return NextResponse.json(
      { error: 'Error al generar la plantilla' },
      { status: 500 }
    );
  }
}
