# Configuracion de autenticacion

Esta rama deja listo el flujo de autenticacion con Supabase para:

- registro con nombre, correo y contrasena;
- inicio de sesion con correo y contrasena;
- inicio de sesion con Google;
- perfil automatico en `public.profiles` con `role = 'free_user'`.

## Variables de entorno

En local crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

En Railway configura los mismos valores, pero `NEXT_PUBLIC_APP_URL` debe ser
la URL publica de Railway, por ejemplo:

```bash
NEXT_PUBLIC_APP_URL=https://tu-app.up.railway.app
```

## Supabase

1. Entra a Supabase y abre tu proyecto.
2. Ve a `Authentication > Providers`.
3. Activa `Email` para permitir correo y contrasena.
4. Activa `Google`, pero deja esa pantalla abierta porque necesitaras el
   `Client ID` y el `Client Secret` de Google Cloud.
5. Ve a `Authentication > URL Configuration`.
6. En `Site URL` usa tu dominio principal:

```text
http://localhost:3000
```

Para produccion usa la URL de Railway.

7. En `Redirect URLs` agrega todas las URLs que vayas a usar:

```text
http://localhost:3000/auth/callback
https://tu-app.up.railway.app/auth/callback
```

## Google Cloud

1. Abre Google Cloud Console y crea o selecciona un proyecto.
2. Ve a `APIs & Services > OAuth consent screen`.
3. Configura el nombre de la app, correo de soporte y datos requeridos.
4. En modo pruebas, agrega tus correos en `Test users`.
5. Ve a `APIs & Services > Credentials`.
6. Crea un `OAuth client ID`.
7. Elige `Web application`.
8. En `Authorized JavaScript origins` agrega:

```text
http://localhost:3000
https://tu-app.up.railway.app
```

9. En `Authorized redirect URIs` agrega el callback de Supabase, no el de Next:

```text
https://TU-PROYECTO.supabase.co/auth/v1/callback
```

10. Copia el `Client ID` y `Client Secret`.
11. Vuelve a Supabase, pega esos valores en el proveedor Google y guarda.

## Base de datos

Aplica las migraciones en orden. La migracion nueva es:

```text
supabase/migrations/0027_google_oauth_profile_sync.sql
```

Esta actualiza el trigger que crea perfiles para que tambien guarde nombre y
avatar cuando el usuario entra con Google. Si no usas Supabase CLI, copia el
contenido de esa migracion y ejecutalo en `SQL Editor` dentro de Supabase.

Para dar permisos de administrador a un usuario ya registrado:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-correo@example.com';
```

## Verificacion manual

1. Corre la app localmente.
2. Abre `/register`, crea una cuenta con nombre, correo y contrasena.
3. Confirma que se crea una fila en `public.profiles`.
4. Cierra sesion.
5. Abre `/login` y entra con Google.
6. Confirma que vuelves a `/dashboard`.
7. Revisa que `public.profiles.full_name` y `avatar_url` se completen para el
   usuario de Google.
