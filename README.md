# Salón de belleza: sitio y reservas

React + Vite + Supabase + Vercel. El proyecto tiene dos partes:

- **Cliente** (`/`, `/servicios`, `/reservar`): portada, servicios con precios, galería, políticas, ubicación con mapa y horario. La reserva se hace en 4 pasos: servicio, fecha y hora, datos, listo.
- **Admin** (`/admin`): resumen del mes (citas, ingresos, proyectado y clientas nuevas), citas (confirmar abre WhatsApp con el mensaje listo), servicios y precios con fotos, galería, horarios, días no laborables y ajustes del sitio (logo, portada, contacto, políticas y promoción).

## Correr en local
```bash
npm install
npm run dev
```
Si no hay `.env.local`, la app corre en **modo demo**: los datos de ejemplo se guardan en el navegador y el admin entra con cualquier correo y contraseña.

## Conectar Supabase
1. Crea un proyecto en Supabase. Luego abre **SQL Editor** y ejecuta `supabase/schema.sql` completo.
2. En **Authentication → Users → Add user**, crea el usuario del admin. En **Authentication → Providers → Email**, desactiva *Allow new users to sign up*.
3. Copia `.env.example` como `.env.local` y llena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Entra a `/admin` y carga los servicios, el logo y las fotos.

## Desplegar en Vercel
Importa el repositorio, agrega las mismas 2 variables de entorno y despliega. `vercel.json` ya incluye el rewrite para las rutas del SPA.

## Reglas de agenda
- Cada servicio tiene su duración. Los horarios libres se calculan según el horario semanal, el intervalo (15, 30, 45 o 60 min), la anticipación mínima y las citas activas.
- La base de datos impide dos citas activas que se crucen (constraint `no_overlap`), aunque dos personas reserven al mismo tiempo.
- Los clientes no pueden leer las citas. Solo ven las horas ocupadas, a través de la RPC `busy_slots`, sin datos personales.
- La zona horaria es Panamá, UTC‑5 fijo.
