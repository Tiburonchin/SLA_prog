# Guía de Uso: Shadcn UI en Sistema HSE

Esta guía documenta la integración y configuración de **Shadcn UI** junto a **Tailwind CSS v4** y **React 19** para el desarrollo rápido y accesible de la interfaz orientada a operarios/supervisores.

---

## 🚀 1. Instalación e Inicialización

Shadcn ya está preparado en el repositorio, pero si alguna vez requieres re-inicializarlo, corre el siguiente comando en `/frontend`:

```bash
npx shadcn@latest init
```

*Nota: Utilizamos la versión `shadcn@latest` ya que tiene integración nativa con Tailwind CSS v4 a través de `@import "tailwindcss";`*

### Estructura de Integración:
- `components.json`: Configuración principal de resolución de rutas para shadcn-ui.
- `src/lib/utils.ts`: Contiene la función utilitaria `cn` para mezclar clases limpiamente utilizando `clsx` y `tailwind-merge`.
- `src/components/ui/`: Carpeta destino donde residirán los componentes crudos copiados por shadcn.

---

## 📦 2. Añadiendo Componentes

Shadcn **NO** es una librería distribuida por npm. Los componentes se descargan e inyectan en nuestro código fuente. 

Para instalar un nuevo componente (ej. un Botón):
```bash
npx shadcn@latest add button
```

Esto generará el archivo `src/components/ui/button.tsx`.

### Componentes Altamente Recomendados para nuestro Stack HSE:
- `button` (Interacciones táctiles pesadas)
- `card` (Tarjetas de inspección)
- `dialog` o `drawer` (Formularios y Alertas modales móviles)
- `form` (Validaciones de React Hook Form + Zod)
- `sheet` (Menú lateral de configuración)

---

## ✨ 3. Reglas de Modificación para Campo (Ergonomía)

Dado que las inspecciones y reportes se realizan bajo el sol, con lluvia o utilizando equipo de protección (guantes), debemos modificar las variantes que vengan de los componentes insertados.

Cuando agregues un componente, asegúrate de:

### 3.1 Tamaño de zonas táctiles (Tap Targets)
Edita el componente `button.tsx` o `input.tsx` incrustado modificando las clases base:
*Aumenta siempre la altura a un mínimo de 48px*
```diff
- className="h-9 px-4 py-2"  // Por defecto (36px)
+ className="min-h-12 px-6 py-4 text-base" // Ajustado (48px) para operarios
```

### 3.2 Alto Contraste
Las variantes en Tailwind se modifican en el archivo raíz global `src/index.css` que Shadcn genera, pero nosotros también integramos nuestros colores "Blue Industrial":

```tsx
// Ejemplo uso de botón primario
<Button className="bg-primary-600 hover:bg-primary-700 text-white font-bold min-h-[48px]">
  Validar Inspección
</Button>
```

### 3.3 Soporte Offline / Esqueletos
Cuando un dato se está sincronizando o está pendiente de conexión (Zustand PWA), utiliza el componente `Skeleton` de Shadcn UI para indicar estados de carga:

```bash
npx shadcn@latest add skeleton
```
```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function OperatorProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  )
}
```

---

## 🛠 4. Filosofía del Lead Frontend

1. **Si no lo usas, no lo agregues:** No descargues 40 componentes pre-armados de Shadcn de un tirón. Sólo instala lo que la vista actual necesita.
2. **Personalización Activa:** Modifica el `.tsx` que se descarga. Eres el dueño del código. Shadcn es un punto de partida para no escribir ARIA labels de cero.
3. **PWA Aware:** Si un DropdownMenu requiere internet para buscar datos, considera usar un `<Sheet>` en su lugar que contenga datos previamente oxigenados y cacheados.
