# SedaChimbote-v.1
  - Una AppWeb que intenta mejorar, optimizar y gestionar de mejor manera el ciclo de vida de Tickets de reclamos de una empresa que ofrece servicios.
---

# Manual de Despliegue – Sistema de Gestión de Reclamos SEDACHIMBOTE

**Versión:** 1.0  
**Última actualización:** Mayo 2026  
**Autor:** Ledesma Arana Claudi  
---

##  Tabla de Contenidos

- [SedaChimbote-v.1](#sedachimbote-v1)
  - [Una AppWeb que intenta mejorar, optimizar y gestionar de mejor manera el ciclo de vida de Tickets de reclamos de una empresa que ofrece servicios.](#una-appweb-que-intenta-mejorar-optimizar-y-gestionar-de-mejor-manera-el-ciclo-de-vida-de-tickets-de-reclamos-de-una-empresa-que-ofrece-servicios)
- [ Manual de Despliegue – Sistema de Gestión de Reclamos SEDACHIMBOTE](#-manual-de-despliegue--sistema-de-gestión-de-reclamos-sedachimbote)
  - [ Tabla de Contenidos](#-tabla-de-contenidos)
  - [1. Requisitos previos](#1-requisitos-previos)
  - [2. Estructura del proyecto](#2-estructura-del-proyecto)
  - [3. Configuración del entorno de desarrollo](#3-configuración-del-entorno-de-desarrollo)
    - [3.1. Clonar el repositorio](#31-clonar-el-repositorio)
    - [3.2. Instalar dependencias](#32-instalar-dependencias)
    - [3.3. Variables de entorno (backend)](#33-variables-de-entorno-backend)
    - [3.4. Variables de entorno (frontend)](#34-variables-de-entorno-frontend)
    - [3.5. Base de datos (SQLite para desarrollo)](#35-base-de-datos-sqlite-para-desarrollo)
    - [3.6. Base de datos (PostgreSQL para producción)](#36-base-de-datos-postgresql-para-producción)
    - [3.7. Ejecutar migraciones y seeders](#37-ejecutar-migraciones-y-seeders)
    - [3.8. Ejecutar en modo desarrollo](#38-ejecutar-en-modo-desarrollo)
  - [4. Construcción para producción](#4-construcción-para-producción)
    - [4.1. Build del frontend](#41-build-del-frontend)
    - [4.2. Preparar el backend](#42-preparar-el-backend)
  - [5. Despliegue en servidor VPS (Ubuntu 22.04 LTS)](#5-despliegue-en-servidor-vps-ubuntu-2204-lts)
    - [5.1. Instalación de Node.js y npm](#51-instalación-de-nodejs-y-npm)
    - [5.2. Instalación de PostgreSQL](#52-instalación-de-postgresql)
    - [5.3. Instalación de Nginx](#53-instalación-de-nginx)
    - [5.4. Configurar PM2 para mantener el backend vivo](#54-configurar-pm2-para-mantener-el-backend-vivo)
    - [5.5. Configurar Nginx como proxy inverso](#55-configurar-nginx-como-proxy-inverso)
    - [5.6. Configurar SSL con Let's Encrypt](#56-configurar-ssl-con-lets-encrypt)
    - [5.7. Configurar el cron job para prioridad extrema](#57-configurar-el-cron-job-para-prioridad-extrema)
  - [6. Despliegue con Docker (opcional)](#6-despliegue-con-docker-opcional)
  - [7. Integración con Gemini API](#7-integración-con-gemini-api)
  - [8. Manejo de WebSockets (Socket.io) en producción](#8-manejo-de-websockets-socketio-en-producción)
  - [9. Variables de entorno completas (ejemplo)](#9-variables-de-entorno-completas-ejemplo)
  - [10. Solución de problemas comunes (Troubleshooting)](#10-solución-de-problemas-comunes-troubleshooting)
    - [ Error: `PrismaClientInitializationError` – No se puede conectar a la base de datos](#-error-prismaclientinitializationerror--no-se-puede-conectar-a-la-base-de-datos)
    - [ Error: `JWT_SECRET must be provided`](#-error-jwt_secret-must-be-provided)
    - [ Error: `403 Forbidden` al cargar fotos a la API](#-error-403-forbidden-al-cargar-fotos-a-la-api)
    - [ Error: `CORS` en peticiones desde el frontend](#-error-cors-en-peticiones-desde-el-frontend)
    - [ Error: `Socket.io` se desconecta cada cierto tiempo](#-error-socketio-se-desconecta-cada-cierto-tiempo)
    - [ Error: `Gemini API quota exceeded`](#-error-gemini-api-quota-exceeded)
    - [ Error: Los seeders fallan por duplicados](#-error-los-seeders-fallan-por-duplicados)
  - [11. Referencias y comandos útiles](#11-referencias-y-comandos-útiles)
    - [Comandos para mantener el sistema en producción](#comandos-para-mantener-el-sistema-en-producción)
    - [Enlaces útiles](#enlaces-útiles)
  - [¡Fin del manual!](#-fin-del-manual)

---

## 1. Requisitos previos

Antes de comenzar, asegúrate de tener:

- **Sistema operativo:** Ubuntu 22.04 LTS (recomendado), o cualquier distribución con systemd.
- **Git** instalado (`sudo apt install git`).
- **Node.js** versión 18.x o superior (incluye npm).
- **PostgreSQL** 14 o superior (para producción) o **SQLite** (para desarrollo).
- **Nginx** (para servir el frontend y proxy inverso).
- **PM2** (gestor de procesos para Node.js).
- **Certbot** (para SSL gratuito).
- **Cuenta de Google AI Studio** para obtener la API Key de Gemini.

---

## 2. Estructura del proyecto

El repositorio tiene la siguiente organización:

```
reclamos-ia/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Lógica de negocio
│   │   ├── routes/           # Endpoints API
│   │   ├── middleware/       # Autenticación, validaciones
│   │   ├── services/         # Integración con Gemini, notificaciones
│   │   ├── utils/            # Helpers, logger
│   │   ├── sockets/          # Configuración de Socket.io
│   │   └── app.js            # Configuración de Express
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos de base de datos
│   │   └── seed.js           # Datos iniciales
│   ├── .env.example
│   ├── package.json
│   └── server.js             # Punto de entrada
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React (shadcn/ui)
│   │   ├── pages/            # Vistas por rol (cliente, especialista, etc.)
│   │   ├── hooks/            # Custom hooks (WebSockets, auth)
│   │   ├── services/         # Llamadas a la API
│   │   └── App.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml        # Opcional
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf                # Configuración de ejemplo
└── README.md                 # Este documento
```

---

## 3. Configuración del entorno de desarrollo

### 3.1. Clonar el repositorio

```bash
git clone https://github.com/sedachimbote/reclamos-ia.git
cd reclamos-ia
```

### 3.2. Instalar dependencias

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3.3. Variables de entorno (backend)

Crea un archivo `.env` dentro de `backend/` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Puerto del servidor
PORT=3000

# Base de datos (elige una)
# Para SQLite (desarrollo):
DATABASE_URL="file:./dev.db"
# Para PostgreSQL (producción):
# DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/sedachimbote_db"

# JWT
JWT_SECRET="cambia_esta_clave_por_una_secreta_muy_larga"

# Gemini API
GEMINI_API_KEY="TU_API_KEY_DE_GOOGLE_AI_STUDIO"

# Configuración de correo (Nodemailer) - opcional
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="correo@sedachimbote.gob.pe"
SMTP_PASS="tu_contraseña_de_aplicacion"

# URL del frontend (para CORS)
FRONTEND_URL="http://localhost:5173"

# Entorno (development / production)
NODE_ENV="development"
```

### 3.4. Variables de entorno (frontend)

Crea `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 3.5. Base de datos (SQLite para desarrollo)

El proyecto usa Prisma. Para SQLite (rápido y sin servidor):

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

Esto crea el archivo `dev.db` y carga datos de prueba (admin, jefe, técnicos, especialidades).

### 3.6. Base de datos (PostgreSQL para producción)

Si usas PostgreSQL, asegúrate de que el servicio esté corriendo:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Crea la base de datos y el usuario:

```bash
sudo -u postgres psql
CREATE DATABASE sedachimbote_db;
CREATE USER reclamos_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE sedachimbote_db TO reclamos_user;
\q
```

Luego actualiza `DATABASE_URL` en `.env` y ejecuta:

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 3.7. Ejecutar migraciones y seeders

**Siempre** después de cambiar el esquema:

```bash
npx prisma migrate dev --name descripcion_del_cambio
npx prisma db seed
```

El seeder (`prisma/seed.js`) inserta:
- Especialidades (Fugas, Facturación, etc.)
- Usuario administrador (admin@sedachimbote.gob.pe / Admin123!)
- Usuario jefe (jefe@sedachimbote.gob.pe / Jefe123!)
- Un ciudadano de ejemplo con suministro válido.
- Un técnico de ejemplo.

### 3.8. Ejecutar en modo desarrollo

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
# Escucha en http://localhost:3000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
# Escucha en http://localhost:5173
```

Abre tu navegador en `http://localhost:5173` y prueba el login con las credenciales del seeder.

---

## 4. Construcción para producción

### 4.1. Build del frontend

```bash
cd frontend
npm run build
```

Esto genera la carpeta `dist/` con los archivos estáticos optimizados.

### 4.2. Preparar el backend

El backend no necesita "build" (ejecuta directamente Node.js). Solo asegúrate de tener `NODE_ENV=production` en `.env`. Prisma generará el cliente para producción:

```bash
cd backend
npx prisma generate
```

---

## 5. Despliegue en servidor VPS (Ubuntu 22.04 LTS)

Esta es la guía paso a paso para un servidor limpio. Suponemos que tienes acceso SSH con `root` o un usuario sudo.

### 5.1. Instalación de Node.js y npm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # debe mostrar v18.x
npm -v
```

### 5.2. Instalación de PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Crea la base de datos y usuario como se indicó en el paso 3.6.

### 5.3. Instalación de Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5.4. Configurar PM2 para mantener el backend vivo

Instala PM2 globalmente:

```bash
sudo npm install -g pm2
```

Copia el backend al servidor (desde tu máquina local usa `scp` o clona el repo directamente):

```bash
# En el servidor
git clone https://github.com/sedachimbote/reclamos-ia.git /opt/reclamos-ia
cd /opt/reclamos-ia/backend
npm install --production   # solo dependencias de producción
npx prisma generate
cp .env.example .env   # luego edita con tus valores reales
```

Ahora inicia la aplicación con PM2:

```bash
pm2 start server.js --name "reclamos-backend"
pm2 save
pm2 startup   # sigue las instrucciones para que PM2 arranque con el sistema
```

### 5.5. Configurar Nginx como proxy inverso

Creamos un archivo de configuración para el sitio:

```bash
sudo nano /etc/nginx/sites-available/reclamos
```

Contenido:

```nginx
server {
    listen 80;
    server_name reclamos.sedachimbote.gob.pe;  # Cambia por tu dominio o IP

    # Frontend (archivos estáticos)
    location / {
        root /opt/reclamos-ia/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSockets (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Habilitamos el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/reclamos /etc/nginx/sites-enabled/
sudo nginx -t   # prueba la configuración
sudo systemctl reload nginx
```

### 5.6. Configurar SSL con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d reclamos.sedachimbote.gob.pe
```

Sigue las instrucciones (ingresa tu correo y acepta términos). Certbot configurará automáticamente HTTPS y renovación automática.

### 5.7. Configurar el cron job para prioridad extrema

El backend tiene una función `updateOverdueTicketsToExtreme()` que debe ejecutarse diariamente. Usaremos `node-cron` dentro del mismo backend. Asegúrate de que en `server.js` esté iniciado:

```javascript
const cron = require('node-cron');
const { updateOverdueTicketsToExtreme } = require('./src/services/ticketService');

cron.schedule('0 1 * * *', async () => {
  console.log('Ejecutando job nocturno: actualizar tickets vencidos a prioridad EXTREMA');
  await updateOverdueTicketsToExtreme();
});
```

No necesitas cron del sistema; PM2 lo mantendrá vivo.

---

## 6. Despliegue con Docker (opcional)

Si prefieres contenedores, incluimos `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: sedachimbote_db
      POSTGRES_USER: reclamos_user
      POSTGRES_PASSWORD: tu_contraseña
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - reclamos-net

  backend:
    build:
      context: ./backend
      dockerfile: ../Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://reclamos_user:tu_contraseña@postgres:5432/sedachimbote_db
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - reclamos-net

  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - reclamos-net

volumes:
  postgres_data:

networks:
  reclamos-net:
```

Ejecutas:

```bash
docker-compose up -d
```

**Nota:** Los Dockerfiles no los detallo por extensión, pero puedes crearlos fácilmente (para backend: imagen Node + copia de código + `npm ci` + `CMD ["node","server.js"]`; para frontend: imagen nginx con los archivos `dist`).

---

## 7. Integración con Gemini API

El sistema usa **Gemini 1.5 Flash** para analizar texto + imágenes (multimodal). La clave de API se guarda en `GEMINI_API_KEY`. El flujo:

1. El ciudadano sube un reclamo con foto.
2. El backend envía a Gemini: prompt + imagen base64.
3. Gemini devuelve: categoría (Fugas, Facturación, etc.), prioridad sugerida, especialidad recomendada.
4. El ticket se guarda con esos metadatos.

**Recomendación de seguridad:** Nunca expongas la API key en el frontend. Siempre usa el backend como proxy.

**Prueba la conexión localmente:**

```bash
curl -X POST http://localhost:3000/api/test-gemini \
  -H "Content-Type: application/json" \
  -d '{"text":"Hay una fuga de agua en la calle"}' \
  -H "Authorization: Bearer <token_admin>"
```

Deberías recibir la respuesta de Gemini en formato JSON.

---

## 8. Manejo de WebSockets (Socket.io) en producción

El sistema usa Socket.io para eventos en tiempo real (técnico "Estoy afuera", notificaciones de estado). En producción con Nginx, la configuración ya incluye el manejo de WebSockets (las líneas `proxy_set_header Upgrade` y `proxy_set_header Connection "upgrade"`). Asegúrate de que el backend esté escuchando en el puerto 3000 y que el frontend conecte a `VITE_SOCKET_URL` (puede ser la misma URL base).

**Solución de problemas:** Si los websockets no funcionan, revisa que Nginx no esté cerrando conexiones largas. Agrega en el `location /socket.io/`:

```nginx
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;
```

---

## 9. Variables de entorno completas (ejemplo)

**Backend (.env) – Producción:**

```env
PORT=3000
DATABASE_URL=postgresql://reclamos_user:MiPasswordSegura123@localhost:5432/sedachimbote_db
JWT_SECRET=sup3r_s3cr3t0_jwt_2026_cambia_esto_ahora
GEMINI_API_KEY=AIzaSyD_xyz123...
FRONTEND_URL=https://reclamos.sedachimbote.gob.pe
NODE_ENV=production
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=soporte@sedachimbote.gob.pe
SMTP_PASS=securepassword
CRON_SCHEDULE="0 1 * * *"
```

**Frontend (.env) – Producción (construido en build time):**

```env
VITE_API_URL=https://reclamos.sedachimbote.gob.pe/api
VITE_SOCKET_URL=https://reclamos.sedachimbote.gob.pe
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 10. Solución de problemas comunes (Troubleshooting)

### ❌ Error: `PrismaClientInitializationError` – No se puede conectar a la base de datos

- **Causa:** URL de conexión incorrecta, PostgreSQL no corriendo, firewall bloqueando.
- **Solución:** Verifica `DATABASE_URL`, ejecuta `sudo systemctl status postgresql`, prueba conexión con `psql -U reclamos_user -h localhost -d sedachimbote_db`.

### ❌ Error: `JWT_SECRET must be provided`

- **Solución:** Asegúrate de que la variable `JWT_SECRET` esté definida en `.env`. Nunca uses valores por defecto en producción.

### ❌ Error: `403 Forbidden` al cargar fotos a la API

- **Causa:** Falta el token JWT o ha expirado.
- **Solución:** El frontend debe enviar `Authorization: Bearer <token>` en cada petición. Revisa el interceptor de axios.

### ❌ Error: `CORS` en peticiones desde el frontend

- **Causa:** El backend no tiene configurado `FRONTEND_URL` correctamente.
- **Solución:** En `app.js`, usa `cors({ origin: process.env.FRONTEND_URL, credentials: true })`.

### ❌ Error: `Socket.io` se desconecta cada cierto tiempo

- **Causa:** Timeout de Nginx o balanceador de carga.
- **Solución:** Agrega `proxy_read_timeout 3600s;` en la configuración de Nginx para `/socket.io/`.

### ❌ Error: `Gemini API quota exceeded`

- **Causa:** Llegaste al límite gratuito de la API.
- **Solución:** Mejora tu plan en Google Cloud Platform o implementa caché de respuestas por categorías comunes.

### ❌ Error: Los seeders fallan por duplicados

- **Solución:** Vacía las tablas antes de correr el seed: `npx prisma migrate reset` (solo en desarrollo).

---

## 11. Referencias y comandos útiles

### Comandos para mantener el sistema en producción

| Acción | Comando |
|--------|---------|
| Ver logs del backend | `pm2 logs reclamos-backend` |
| Reiniciar backend | `pm2 restart reclamos-backend` |
| Ver estado de PM2 | `pm2 status` |
| Recargar Nginx | `sudo systemctl reload nginx` |
| Ver logs de Nginx | `sudo tail -f /var/log/nginx/error.log` |
| Backup de base de datos | `pg_dump -U reclamos_user sedachimbote_db > backup_$(date +%Y%m%d).sql` |
| Renovar certificado SSL | `sudo certbot renew --dry-run` (para probar) |
| Actualizar código desde GitHub | `cd /opt/reclamos-ia && git pull && cd backend && npm install --production && npx prisma generate && pm2 restart reclamos-backend` |

### Enlaces útiles

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Guía de despliegue de Node.js en Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-22-04)
- [API de Gemini (Google AI Studio)](https://makersuite.google.com/app/apikey)
- [Socket.io en producción](https://socket.io/docs/v4/production-checklist/)
- [Configuración de Nginx con WebSockets](https://www.nginx.com/blog/websocket-nginx/)

---

## ✅ ¡Fin del manual!

Este documento está diseñado para que **cualquier desarrollador o administrador de sistemas** pueda poner en marcha el sistema completo desde cero, incluso en un entorno de producción real. Si sigues estos pasos al pie de la letra, tendrás una plataforma robusta, escalable y segura para gestionar reclamos con inteligencia artificial en SEDACHIMBOTE.

**¿Necesitas ayuda adicional?** Abre un issue en el repositorio de GitHub o contacta al equipo de soporte técnico.

---

**© 2026 – SEDACHIMBOTE EPS. Todos los derechos reservados.**
