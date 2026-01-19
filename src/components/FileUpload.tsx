'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle, Loader2, FileUp } from 'lucide-react';
import type { TipoLiquidacion, TipoPlanta, ErrorValidacion } from '@/types/database';
import { TIPOS_LIQUIDACION, TIPOS_PLANTA } from '@/types/database';

interface FileUploadProps {
  idColegio?: string;
  onSuccess?: () => void;
}

export default function FileUpload({ idColegio, onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [periodo, setPeriodo] = useState('');
  const [tipoLiquidacion, setTipoLiquidacion] = useState<TipoLiquidacion>('MENSUAL');
  const [tipoPlanta, setTipoPlanta] = useState<TipoPlanta>('TITULAR');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    mensaje: string;
    tipo_error?: string;
    detalles?: string[];
    errores?: ErrorValidacion[];
    presentacion_id?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo desactivar si salimos del dropzone (no de un hijo)
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

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
      formData.append('tipo_planta', tipoPlanta);
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
        {/* Seleccion de periodo, tipo y planta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              !periodo && file ? 'text-red-600' : 'text-gray-700'
            }`}>
              Periodo de Liquidacion *
              {!periodo && file && (
                <span className="ml-2 text-xs font-normal animate-pulse">← Requerido</span>
              )}
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
              className={`w-full transition-all ${
                !periodo && file
                  ? 'ring-2 ring-red-400 border-red-400 animate-pulse'
                  : ''
              }`}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Planta *
            </label>
            <select
              value={tipoPlanta}
              onChange={(e) => setTipoPlanta(e.target.value as TipoPlanta)}
              className="w-full"
            >
              {TIPOS_PLANTA.map(tipo => (
                <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Area de carga de archivo - Mejorada */}
        <div
          ref={dropZoneRef}
          className={`
            relative rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${file
              ? 'bg-primary-50 border-2 border-primary-400'
              : isDragging
                ? 'bg-primary-100 border-3 border-primary-500 border-dashed scale-[1.02] shadow-lg'
                : 'bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          {/* Indicador visual cuando se arrastra */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary-500/10 rounded-xl flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white rounded-lg shadow-xl px-6 py-4 flex items-center space-x-3 animate-pulse">
                <FileUp className="h-8 w-8 text-primary-600" />
                <span className="text-lg font-semibold text-primary-700">Soltar archivo aqui</span>
              </div>
            </div>
          )}

          {file ? (
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-primary-100 rounded-lg p-3">
                <FileSpreadsheet className="h-10 w-10 text-primary-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB - Listo para subir
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                title="Quitar archivo"
              >
                <X className="h-5 w-5 text-red-500" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Icono grande y llamativo */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mx-auto">
                <Upload className="h-10 w-10 text-primary-600" />
              </div>

              {/* Texto principal */}
              <div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Arrastre su archivo Excel aqui
                </p>
                <p className="text-sm text-gray-500">
                  o <span className="text-primary-600 font-medium hover:underline">haga clic para seleccionar</span>
                </p>
              </div>

              {/* Badge de formato */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Solo archivos .xlsx (Excel 2007+)
              </div>
            </div>
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

        {/* Mensaje de ayuda cuando falta seleccionar algo */}
        {(!periodo || !file) && !uploading && !result && (
          <p className="text-xs text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {!periodo && !file && 'Debe seleccionar un periodo y un archivo para poder subir'}
            {!periodo && file && 'Debe seleccionar un periodo para poder subir el archivo'}
            {periodo && !file && 'Debe seleccionar un archivo Excel para subir'}
          </p>
        )}

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
