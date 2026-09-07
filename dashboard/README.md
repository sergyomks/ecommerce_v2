# `dashboard/` — Carpeta en desuso

> ⚠️ Este directorio **ya no contiene el panel administrativo**.
> Conserva únicamente la configuración base de Vite para mantener
> el repositorio coherente con su historia como proyecto Git
> independiente (ver `.idea/vcs.xml`).

## ¿Dónde está el panel admin real?

El panel administrativo vive dentro del proyecto de cliente:

- Rutas: `cliente/src/admin/AdminApp.jsx`
- Componentes: `cliente/src/admin/components/`
- Modales: `cliente/src/admin/modals/`
- Estado global: `cliente/src/admin/store/`

Para levantarlo en local:

```bash
cd ../cliente
npm install
npm run dev
```

## ¿Por qué se conserva esta carpeta?

1. El backend la sigue referenciando en [server/config/config.env](../server/config/config.env.example)
   como `DASHBOARD_URL=http://localhost:5173` para configurar CORS.
2. Forma parte del historial del proyecto y `.idea/vcs.xml` la
   trata como un repositorio Git separado.

Si en el futuro quieres eliminarla por completo, antes hay que:

1. Quitar la variable `DASHBOARD_URL` de la configuración del servidor.
2. Actualizar `server/app.js` (lista de orígenes permitidos).
3. Eliminar la entrada en `.idea/vcs.xml` y en `.idea/workspace.xml`.

## Contenido actual

| Archivo/Carpeta | Para qué sirve |
|---|---|
| `package.json` | Dependencias Vite + React + Tailwind |
| `vite.config.js` | Configuración del bundler |
| `tailwind.config.js` / `postcss.config.js` | Estilos |
| `eslint.config.js` | Reglas de lint |
| `index.html` | Plantilla HTML |
| `src/main.jsx`, `src/App.jsx`, `src/index.css` | Placeholder mínimo |
| `public/` | Recursos estáticos |

No hay código de aplicación aquí. Si necesitas el panel admin,
dirígete a `cliente/src/admin/`.
