# Especificaciones Tecnicas - Sistema APS Preliquidacion

## Arquitectura del Sistema

### Stack Tecnologico

| Componente | Tecnologia | Version |
|------------|------------|---------|
| Frontend | Next.js | 14.x |
| Framework UI | React | 18.x |
| Estilos | Tailwind CSS | 3.x |
| Backend | Next.js API Routes | 14.x |
| Base de Datos | PostgreSQL (Supabase) | 15.x |
| Autenticacion | Supabase Auth | - |
| Almacenamiento | Supabase Storage | - |
| Procesamiento Excel | ExcelJS | 4.x |
| Hosting | Vercel | - |
| Lenguaje | TypeScript | 5.x |

### Estructura del Proyecto

```
aps-preliquidacion-app/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Endpoints de autenticacion
│   │   │   ├── colegios/      # Endpoints de colegios
│   │   │   ├── presentaciones/# Endpoints de presentaciones
│   │   │   ├── descargas/     # Endpoints de descargas
│   │   │   └── templates/     # Endpoints de plantillas
│   │   ├── auditor/           # Pagina del panel de auditoria
│   │   ├── colegio/           # Paginas del portal de colegio
│   │   │   └── presentaciones/# Detalle de presentaciones
│   │   ├── registro/          # Pagina de registro
│   │   └── page.tsx           # Pagina de login
│   ├── components/            # Componentes React
│   │   ├── FileUpload.tsx     # Componente de carga de archivos
│   │   ├── Header.tsx         # Encabezado de la aplicacion
│   │   └── PresentacionesTable.tsx # Tabla de presentaciones
│   ├── lib/
│   │   ├── excel/             # Procesamiento de archivos Excel
│   │   │   ├── generator.ts   # Generacion de plantillas
│   │   │   └── validator.ts   # Validacion de archivos
│   │   └── supabase/          # Configuracion de Supabase
│   │       ├── client.ts      # Cliente del navegador
│   │       └── server.ts      # Cliente del servidor
│   └── types/
│       └── database.ts        # Tipos TypeScript
├── public/                    # Archivos estaticos
├── docs/                      # Documentacion
│   └── screenshots/           # Capturas de pantalla
└── package.json
```

---

## Modelo de Datos

### Diagrama Entidad-Relacion

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────────┐
│   aps_colegios  │     │    aps_usuarios     │     │   aps_presentaciones    │
├─────────────────┤     ├─────────────────────┤     ├─────────────────────────┤
│ id (PK)         │◄────│ id_colegio (FK)     │     │ id (PK)                 │
│ codigo_nivel    │     │ id (PK)             │────►│ id_colegio (FK)         │
│ codigo_colegio  │     │ email               │     │ id_usuario (FK)         │
│ nombre          │     │ nombre              │     │ periodo                 │
│ porcentaje_sub  │     │ rol                 │     │ tipo_liquidacion        │
│ activo          │     │ activo              │     │ estado                  │
│ created_at      │     │ created_at          │     │ archivo_original_url    │
└─────────────────┘     └─────────────────────┘     │ archivo_errores_url     │
                                                     │ total_filas             │
                                                     │ filas_con_error         │
                                                     │ costo_total_presentado  │
                                                     │ error_estructural       │
                                                     │ created_at              │
                                                     │ closed_at               │
                                                     └───────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                     ┌─────────────────────────┐
                                                     │ aps_liquidaciones_priv  │
                                                     ├─────────────────────────┤
                                                     │ id (PK)                 │
                                                     │ id_presentacion (FK)    │
                                                     │ fila_excel              │
                                                     │ legajo                  │
                                                     │ cuil                    │
                                                     │ cargo                   │
                                                     │ horas_catedra           │
                                                     │ sueldo_bruto            │
                                                     │ sueldo_neto             │
                                                     │ arraigo                 │
                                                     │ tiene_error             │
                                                     │ errores                 │
                                                     │ created_at              │
                                                     └─────────────────────────┘
```

### Tablas Principales

#### aps_colegios
Almacena la informacion de todos los colegios privados.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| codigo_nivel | VARCHAR | Codigo del nivel (P, PE, PP, PS, PT) |
| codigo_colegio | VARCHAR | Codigo numerico del colegio |
| nombre | VARCHAR | Nombre completo del colegio |
| porcentaje_subsidio | INTEGER | Porcentaje de subsidio estatal |
| activo | BOOLEAN | Estado del colegio |
| created_at | TIMESTAMP | Fecha de creacion |

#### aps_usuarios
Almacena los usuarios del sistema.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico (mismo que auth.users) |
| id_colegio | UUID | Referencia al colegio (NULL para auditores) |
| email | VARCHAR | Correo electronico |
| nombre | VARCHAR | Nombre completo |
| rol | ENUM | Rol del usuario (COLEGIO, AUDITOR) |
| activo | BOOLEAN | Estado del usuario |
| created_at | TIMESTAMP | Fecha de creacion |

#### aps_presentaciones
Almacena las presentaciones de preliquidacion.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| id_colegio | UUID | Referencia al colegio |
| id_usuario | UUID | Usuario que creo la presentacion |
| periodo | VARCHAR | Periodo en formato YYYYMM |
| tipo_liquidacion | ENUM | Tipo de liquidacion |
| estado | ENUM | Estado (CARGADA, CERRADA, RECHAZADA) |
| archivo_original_url | VARCHAR | URL del archivo original |
| archivo_errores_url | VARCHAR | URL del archivo de errores |
| total_filas | INTEGER | Total de filas procesadas |
| filas_con_error | INTEGER | Cantidad de filas con error |
| costo_total_presentado | DECIMAL | Costo total de la presentacion |
| error_estructural | TEXT | Descripcion del error estructural |
| created_at | TIMESTAMP | Fecha de creacion |
| closed_at | TIMESTAMP | Fecha de cierre |

#### aps_liquidaciones_privadas
Almacena el detalle de cada liquidacion individual.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| id_presentacion | UUID | Referencia a la presentacion |
| fila_excel | INTEGER | Numero de fila en el Excel |
| legajo | VARCHAR | Numero de legajo |
| cuil | VARCHAR | CUIL del empleado |
| cargo | VARCHAR | Descripcion del cargo |
| horas_catedra | INTEGER | Cantidad de horas |
| sueldo_bruto | DECIMAL | Sueldo bruto |
| sueldo_neto | DECIMAL | Sueldo neto |
| arraigo | DECIMAL | Monto de arraigo |
| tiene_error | BOOLEAN | Indica si tiene errores |
| errores | JSONB | Detalle de errores |
| created_at | TIMESTAMP | Fecha de creacion |

---

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado para garantizar que:
- Los usuarios de colegio solo pueden ver/modificar datos de su propio colegio
- Los auditores pueden ver todas las presentaciones
- Solo usuarios autenticados pueden acceder a los datos

### Politicas de Acceso

```sql
-- Ejemplo: Politica para presentaciones
CREATE POLICY "Colegios ven sus presentaciones" ON aps_presentaciones
  FOR SELECT USING (
    id_colegio IN (
      SELECT id_colegio FROM aps_usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM aps_usuarios WHERE id = auth.uid() AND rol = 'AUDITOR'
    )
  );
```

### Autenticacion

- Basada en JWT mediante Supabase Auth
- Tokens de sesion con expiracion automatica
- Cookies HTTP-only para mayor seguridad

---

## API Endpoints

### Autenticacion

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/auth/login | Iniciar sesion |
| POST | /api/auth/registro | Registrar usuario |
| POST | /api/auth/logout | Cerrar sesion |
| GET | /api/auth/session | Obtener sesion actual |
| POST | /api/auth/reset-password | Solicitar reset de contrasena |

### Colegios

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/colegios | Listar colegios |
| GET | /api/colegios?nivel=P | Filtrar por nivel |

### Presentaciones

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/presentaciones | Listar presentaciones |
| GET | /api/presentaciones/[id] | Obtener detalle |
| POST | /api/presentaciones/upload | Subir archivo |
| POST | /api/presentaciones/[id]/cerrar | Cerrar presentacion |

### Descargas

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/descargas/errores/[id] | Descargar archivo de errores |
| GET | /api/descargas/original/[id] | Descargar archivo original |
| GET | /api/templates/liquidacion | Descargar plantilla |

---

## Procesamiento de Archivos Excel

### Validacion Estructural

El sistema valida que el archivo Excel cumpla con:

1. **Formato correcto**: Extension .xlsx
2. **Hoja de datos**: Debe existir una hoja con datos
3. **Columnas requeridas**: Todas las columnas obligatorias presentes
4. **Tipos de datos**: Cada columna con el tipo esperado

### Columnas Requeridas

| Columna | Tipo | Obligatorio | Validacion |
|---------|------|-------------|------------|
| LEGAJO | String | Si | No vacio |
| CUIL | String | Si | 11 digitos |
| CARGO | String | Si | No vacio |
| HORAS | Number | Si | >= 0 |
| BRUTO | Number | Si | >= 0 |
| NETO | Number | Si | >= 0 |
| ARRAIGO | Number | No | >= 0 |

### Validacion de Datos

Para cada fila se valida:

```typescript
// Validacion de CUIL
const validarCUIL = (cuil: string): boolean => {
  // Debe tener 11 digitos
  if (!/^\d{11}$/.test(cuil)) return false;

  // Validacion de digito verificador
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuil[i]) * multiplicadores[i];
  }
  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  return parseInt(cuil[10]) === digitoVerificador;
};
```

### Generacion de Archivo de Errores

Cuando se detectan errores, se genera un archivo Excel con:

| Columna | Descripcion |
|---------|-------------|
| FILA | Numero de fila en el archivo original |
| COLUMNA | Nombre de la columna con error |
| VALOR | Valor actual de la celda |
| ERROR | Descripcion del error |

---

## Almacenamiento de Archivos

### Buckets de Supabase Storage

| Bucket | Descripcion | Acceso |
|--------|-------------|--------|
| archivos-originales | Archivos Excel subidos | Privado |
| archivos-errores | Archivos de errores generados | Privado |

### Politicas de Almacenamiento

- Los archivos originales solo son accesibles por auditores
- Los archivos de errores son accesibles por el colegio que los genero y auditores
- URLs firmadas con expiracion para descargas seguras

---

## Despliegue

### Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Aplicacion
NEXT_PUBLIC_APP_URL=https://aps-preliquidacion-app.vercel.app
```

### Proceso de Despliegue

1. Push a la rama `main` en GitHub
2. Vercel detecta el cambio automaticamente
3. Build del proyecto Next.js
4. Despliegue a produccion

### URLs

| Ambiente | URL |
|----------|-----|
| Produccion | https://aps-preliquidacion-app.vercel.app |
| Preview | https://aps-preliquidacion-app-*.vercel.app |

---

## Monitoreo y Logs

### Vercel Analytics
- Metricas de rendimiento
- Core Web Vitals
- Errores en tiempo real

### Supabase Dashboard
- Logs de base de datos
- Metricas de autenticacion
- Uso de almacenamiento

---

## Mantenimiento

### Respaldos
- Supabase realiza backups automaticos diarios
- Retencion de 7 dias en plan gratuito

### Actualizaciones
- Dependencias: `npm update`
- Next.js: Seguir guia de migracion oficial
- Supabase: Actualizaciones automaticas

---

*Documento tecnico - Version 1.0*
*Sistema APS Preliquidacion*
