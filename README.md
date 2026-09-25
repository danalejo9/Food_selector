# La Nevera — ¿qué cocino hoy?

Eliges lo que tienes en la nevera y la página te dice qué recetas puedes preparar, en tiempo real.

- **Cocina** (uso diario): ingredientes a la izquierda con iconos, recetas a la derecha en
  *Puedes hacerla* y *Te falta poco* (1–2 ingredientes). Filtros por momento del día
  (desayuno, almuerzo, once, cena, entre comidas), tiempo y favoritas.
- **Detalle**: ingredientes marcados según lo que tienes, porciones ajustables, modo
  *cocinar paso a paso* con temporizador y pantalla encendida, favoritas e historial.
- **Compras**: lo que falta va a una lista; al volver del mercado pasa a la nevera.
- **Recetario**: crear y editar recetas e ingredientes, y **carga masiva con plantilla Excel**.
- Se instala en el celular (PWA) y funciona sin internet.

## Diseño

Sigue los lineamientos gráficos de Daniel: paleta niebla / asfalto / musgo (acción y selección) /
señal (estados: falta, pendiente), una sola familia tipográfica (Schibsted Grotesk, autoalojada),
retícula de 12 columnas, iconos lineales (Lucide para la interfaz, set propio para ingredientes) y
solo modo claro; el modo cocinar usa fondo oscuro por ser una vista de concentración.
Las ilustraciones de platos (mantel + plato) son **temporales**: se reemplazan subiendo una foto
real desde el editor de cada receta.

## Correrla

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos: `npm test`, `npm run validate` (revisa el recetario), `npm run build`.

## Dónde viven las recetas

Todo el recetario está en **`data/recetario.json`** (y las fotos en `public/fotos/`).
Ese archivo es la fuente de verdad: lo que está en el repo es lo que ven el computador y el celular.

Cuando editas desde la app, los cambios quedan como **borrador en ese navegador** (barra amarilla
en el Recetario). Para guardarlos:

1. Pulsa **Descargar recetario** → baja un `.zip` con `data/recetario.json` y las fotos nuevas.
2. Descomprímelo encima del proyecto (reemplaza el archivo).
3. `git commit` y `git push`.
4. En la app, **Descartar borrador** para volver a leer el archivo del repo.

Lo personal (qué hay hoy en la nevera, favoritas, historial, lista de compras) se queda en cada
dispositivo y no va al repo.

### Modo editor

En la página publicada el Recetario es **solo de consulta**: se ven recetas e ingredientes, pero no
hay botones para crear, editar, borrar ni cargar en masa, y se ignora cualquier borrador local.
Con `npm run dev` en tu computador siempre puedes editar.

Para editar desde la página publicada (por ejemplo, en el celular):

1. En el computador, define la clave una sola vez: `npm run clave -- "tu clave"`.
   Solo se guarda su huella (SHA-256) en `src/editorKey.ts`, nunca la clave.
2. Haz commit y push de ese archivo.
3. En el navegador donde quieras editar, abre `…/Food_selector/#/editor` y escribe la clave.
   Ese navegador queda en modo editor hasta que pulses **Salir del modo editor** en el Recetario.

Esto oculta la edición a los visitantes; la protección real es que solo tú puedes subir cambios al repo.

### Videos por paso (modo cocinar)

Cada paso puede tener un video corto de YouTube que aparece debajo del texto en el modo cocinar.

1. En la app de YouTube: **Crear → Subir video**, visibilidad **No listado** (o súbelo como Short).
2. **Compartir → Copiar enlace**. Sirven `youtu.be/…`, `youtube.com/watch?v=…` y `youtube.com/shorts/…`.
3. En La Nevera (modo editor): Recetario → la receta → en el paso, pega el enlace en
   *Video* → **Guardar receta**. Luego descarga el recetario y reemplaza `data/recetario.json`.
   En la plantilla de Excel se escribe al final del paso: `Batir los huevos (2 min) [video: https://youtu.be/…]`.

Los Shorts se ven en vertical. Los videos necesitan internet (el resto de la app funciona sin conexión).

### Carga masiva

Recetario → **Carga masiva** → *Descargar plantilla .xlsx*. Una fila por receta:

| columna | ejemplo |
|---|---|
| momentos | `desayuno, once` |
| ingredientes | `harina 1 1/2 taza; huevos 2; miel (opcional); tomate 1, picado; sal al gusto` |
| pasos | uno por línea (Alt+Enter) o separados por `\|`; `(10 min)` al final activa el temporizador |

Al cargarla ves una vista previa con errores por fila, ingredientes nuevos (con su categoría) y
recetas repetidas (omitir o reemplazar). *Exportar .xlsx* genera el mismo formato con todo el
recetario, para editarlo en Excel y volver a cargarlo.

### Familias de ingredientes

Un ingrediente puede pertenecer a otro más general: *Queso campesino* es de la familia *Queso*.
Si una receta pide *queso*, cualquier queso sirve; si pide *queso mozzarella*, solo ese.

## Publicarla (GitHub Pages)

El workflow `.github/workflows/pages.yml` publica la app en cada push a `main`.
Actívalo una vez en *Settings → Pages → Source: GitHub Actions*. Después, cada vez que subas un
`recetario.json` nuevo, el sitio se actualiza solo.
