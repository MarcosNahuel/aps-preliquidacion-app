'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { TipoLiquidacion, ErrorValidacion } from '@/types/database';
import { TIPOS_LIQUIDACION } from '@/types/database';

interface FileUploadProps {
  idColegio?: string;
  onSuccess?: () => void;
}

export default function FileUpload({ idColegio, onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [periodo, setPeriodo] = useState('');
  const [tipoLiquidacion, setTipoLiquidacion] = useState<TipoLiquidacion>('MENSUAL');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    mensaje: string;
    tipo_error?: string;
    detalles?: string[];
    errores?: ErrorValidacion[];
    presentacion_id?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !periodo) {
      setResult({
        success: false,
        mensaje: 'Debe seleccionar un archivo y especificar el periodo.'
      });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('periodo', periodo);
      formData.append('tipo_liquidacion', tipoLiquidacion);
      if (idColegio) {
        formData.append('id_colegio', idColegio);
      }

      const response = await fetch('/api/presentaciones/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          mensaje: data.mensaje,
          presentacion_id: data.presentacion_id
        });
        setFile(null);
        setPeriodo('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSuccess?.();
      } else {
        setResult({
          success: false,
          mensaje: data.mensaje || data.error,
          tipo_error: data.tipo_error,
          detalles: data.detalles,
          errores: data.errores,
          presentacion_id: data.presentacion_id
        });
      }
    } catch (error) {
      setResult({
        success: false,
        mensaje: 'Error al subir el archivo. Intente nuevamente.'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.open('/api/templates/download', '_blank');
  };

  const downloadErrors = () => {
    if (result?.presentacion_id) {
      window.open(`/api/descargas/errores/${result.presentacion_id}`, '_blank');
    }
  };

  // Generar periodos disponibles (ultimos 12 meses + 6 meses futuros)
  const generarPeriodos = () => {
    const periodos = [];
    const now = new Date();
    for (let i = -6; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodo = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nombre = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      periodos.push({ value: periodo, label: nombre.charAt(0).toUpperCase() + nombre.slice(1) });
    }
    return periodos;
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cargar Preliquidacion</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleccion de periodo y tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodo de Liquidacion *
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
              className="w-full"
            >
              <option value="">Seleccione un periodo</option>
              {generarPeriodos().map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Liquidacion *
            </label>
            <select
              value={tipoLiquidacion}
              onChange={(e) => setTipoLiquidacion(e.target.value as TipoLiquidacion)}
              className="w-full"
            >
              {TIPOS_LIQUIDACION.map(tipo => (
                <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Area de carga de archivo */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            file ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center space-x-3">
              <FileSpreadsheet className="h-10 w-10 text-primary-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Arrastre el archivo Excel aqui o haga clic para seleccionar
              </p>
              <p className="text-sm text-gray-500">
                Solo archivos .xlsx (Excel 2007 o superior)
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Botones de accion */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={uploading || !file || !periodo}
            className="btn-primary flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Subir Archivo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={downloadTemplate}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Descargar Plantilla
          </button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.mensaje}
                </p>

                {result.detalles && result.detalles.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {result.detalles.map((detalle, i) => (
                      <li key={i}>{detalle}</li>
                    ))}
                  </ul>
                )}

                {result.errores && result.errores.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-red-700 font-medium mb-2">
                      Primeros errores encontrados:
                    </p>
                    <div className="max-h-48 overflow-y-auto bg-white rounded border border-red-200 p-2">
                      {result.errores.slice(0, 10).map((error, i) => (
                        <div key={i} className="text-xs text-red-600 py-1 border-b border-red-100 last:border-0">
                          <span className="font-medium">Fila {error.fila}, {error.columna}:</span> {error.mensaje}
                        </div>
                      ))}
                    </div>
                    {result.tipo_error === 'DATOS' && result.presentacion_id && (
                      <button
                        type="button"
                        onClick={downloadErrors}
                        className="mt-3 text-sm text-red-700 underline hover:text-red-800"
                      >
                        Descargar Excel con todos los errores
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
