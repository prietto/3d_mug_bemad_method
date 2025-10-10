# 🎭 Demo Mode Instructions

## Problema Actual
La aplicación está devolviendo error 500 en `POST /api/generate-texture` porque la API key de Google AI Studio no está configurada.

## Solución Rápida: Demo Mode

### Paso 1: Activar Demo Mode
Agrega esta variable al archivo `.env.local`:

```env
ENABLE_AI_GENERATION=false
```

### Paso 2: Opción 1 - Configurar API Key Real
1. Ve a: https://aistudio.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Copia la key
5. Reemplaza en `.env.local`:

```env
GOOGLE_AI_STUDIO_API_KEY=tu_real_api_key_aqui
ENABLE_AI_GENERATION=true
```

### Paso 3: Opción 2 - Usar Imágenes de Demo
Mientras obtienes la API key, puedes probar las otras funcionalidades:

✅ **Funcionalidades Disponibles Sin API Key:**
- Upload manual de imágenes
- Cambio de colores del mug
- Adición de texto personalizado
- Rotación 3D y controles
- Lead capture y analytics
- Diseño responsive

### Características de Demo Mode
- Muestra interfaz completa de AI generation
- Mensaje amigable "Demo mode - configure API key para usar"
- Todas las demás funcionalidades trabajan normalmente

## Testing Recomendado

### Sin API Key (Demo Mode):
1. Prueba upload manual de imágenes
2. Cambia colores del mug
3. Añade texto
4. Verifica formulario de contacto

### Con API Key:
1. Genera imágenes con text-to-image
2. Prueba image-to-image enhancement
3. Verifica rate limiting
4. Revisa quota display

---

**Recomendación:** Configura la API key para probar todas las funcionalidades de AI.