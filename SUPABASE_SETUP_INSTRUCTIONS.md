# Supabase Database Setup Instructions

## Error Actual
```
PGRST205 - Could not find the table 'public.designs' in the schema cache
```

**Causa**: Las tablas de la base de datos no existen en tu proyecto Supabase.

## Solución: Ejecutar el Schema SQL

### Opción 1: UI de Supabase (Recomendado)

1. **Abrir Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Inicia sesión con tu cuenta

2. **Navegar al SQL Editor**
   - En el panel izquierdo, click en **"SQL Editor"**
   - O ve directamente a: https://supabase.com/dashboard/project/vavyzbeqdjrlushuqzjk/sql

3. **Ejecutar el Schema**
   - Click en **"New query"**
   - Copia TODO el contenido del archivo `lib/database/schema.sql`
   - Pega en el editor SQL
   - Click en **"Run"** (o presiona Ctrl+Enter)

4. **Verificar Éxito**
   - Deberías ver: "Success. No rows returned"
   - Ve a **"Table Editor"** en el panel izquierdo
   - Verifica que existen estas tablas:
     - ✅ `designs`
     - ✅ `leads`
     - ✅ `analytics_events`
     - ✅ `email_deliveries`
     - ✅ `email_preferences`

### Opción 2: Usando Supabase CLI

```bash
# Si tienes Supabase CLI instalado
npx supabase db push

# O ejecutar directamente el schema
npx supabase db execute --file lib/database/schema.sql
```

### Opción 3: Script de Node.js

Si prefieres un script automatizado, puedes crear uno:

```typescript
// scripts/setup-database.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const schema = fs.readFileSync('./lib/database/schema.sql', 'utf-8')

  const { error } = await supabase.rpc('exec', { sql: schema })

  if (error) {
    console.error('Error creating tables:', error)
  } else {
    console.log('✅ Database setup complete!')
  }
}

setupDatabase()
```

## Verificación Post-Setup

### 1. Verificar Tablas en Dashboard
- Ve a: https://supabase.com/dashboard/project/vavyzbeqdjrlushuqzjk/editor
- Verifica que `designs` tabla existe
- Click en la tabla para ver su estructura

### 2. Verificar Columnas de `designs`
La tabla debe tener estas columnas (en **snake_case**):
- `id` (uuid, primary key)
- `mug_color` (varchar)
- `uploaded_image_base64` (text)
- `custom_text` (text)
- `text_font` (varchar)
- `text_position` (jsonb)
- `created_at` (timestamp)
- `last_modified` (timestamp)
- `is_complete` (boolean)

### 3. Verificar RLS (Row Level Security)
- En la tabla `designs`, verifica que RLS está habilitado
- Debe existir una policy: "Allow service role access to designs"

### 4. Test desde la App
Después de ejecutar el schema:
1. Recarga tu aplicación en http://localhost:3000
2. Intenta generar un diseño con AI
3. Click en "Apply to Design"
4. Verifica en la consola del navegador:
   - ✅ No hay error `PGRST205`
   - ✅ Ves `POST /api/designs 201` (éxito)

## Troubleshooting

### Error: "permission denied for table designs"
**Solución**: Ejecuta estas queries adicionales:
```sql
-- Dar permisos al service role
GRANT ALL ON designs TO service_role;
GRANT ALL ON leads TO service_role;
GRANT ALL ON analytics_events TO service_role;
```

### Error: "relation designs does not exist"
**Solución**: El schema no se ejecutó correctamente. Verifica:
1. Estás ejecutando en el proyecto correcto
2. Tienes permisos de admin en Supabase
3. No hay errores de sintaxis en el schema

### Error: "duplicate key value violates unique constraint"
**Solución**: Las tablas ya existen. Puedes:
1. Usar `DROP TABLE IF EXISTS designs CASCADE;` antes del schema
2. O modificar el schema para usar `CREATE TABLE IF NOT EXISTS`

## Siguiente Paso

Una vez ejecutado el schema exitosamente:
1. ✅ Recarga tu aplicación
2. ✅ Prueba crear un diseño
3. ✅ Verifica que se guarda en Supabase (tabla `designs`)
4. ✅ El flujo de Epic 9 debería funcionar completamente

---

**Proyecto Supabase**: `vavyzbeqdjrlushuqzjk`
**URL Dashboard**: https://supabase.com/dashboard/project/vavyzbeqdjrlushuqzjk
