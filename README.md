README — Sistema de Reservas de Restaurantes

Backend desarrollado con NestJS + Prisma + PostgreSQL

🧱 Tecnologías principales

NestJS — Framework backend modular y escalable

Prisma ORM — Acceso a DB tipado y migraciones

PostgreSQL — Base de datos relacional

JWT + Passport — Autenticación segura

BCrypt — Hash de contraseñas

class-validator — Validaciones de DTO

Docker (opcional) — Contenedores para la app y la DB

🏗️ Arquitectura general

El proyecto está dividido en módulos:

/auth          → Registro, login, JWT, roles
/user          → Gestión de usuarios
/restaurant    → Restaurantes + mesas + administración
/reservation   → Reservas y estados (pending, accepted, rejected)
/review        → Reseñas de usuarios
/prisma        → Cliente de Prisma + migraciones


Cada módulo contiene:

controller.ts (rutas)

service.ts (lógica)

dto/ (validaciones)

🔐 Sistema de roles

El backend usa dos roles:

Rol	Permisos
USER	Crear reservas, ver restaurantes, revisar sus reservas
ADMIN	Administrar restaurantes, aceptar/rechazar reservas

Validación vía:

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)

🧩 Modelo de datos (Prisma)
🏢 Restaurant
model Restaurant {
  id            String     @id @default(uuid())
  name          String
  address       String
  phone         String
  description   String?

  mesaTipo      MesaTipo?
  mesaCapacidad Int?
  cantidadMesas Int?

  reservations  Reservation[]
  reviews       Review[]

  adminId       String?
  admin         User? @relation("RestaurantAdmin", fields: [adminId], references: [id])
}

🍽️ Mesas dentro del restaurante

No se modelan como tabla separada.
El restaurante contiene:

mesaTipo (enum: CUADRADA | RECTANGULAR | REDONDA)

mesaCapacidad (int)

cantidadMesas (int)

🚀 Endpoints principales
🔑 Auth
Método	Ruta	Descripción
POST	/auth/register	Registrar usuario
POST	/auth/login	Login con JWT
👤 Usuarios
Método	Ruta	Descripción
GET	/users/me	Información del usuario logueado
GET	/users	Lista de usuarios (ADMIN)
🏨 Restaurantes
Crear restaurante (ADMIN)
POST /restaurants
Authorization: Bearer token


Body:

{
  "name": "La Parrilla",
  "address": "Calle 123",
  "phone": "123456789",
  "cantidadMesas": 10,
  "mesaCapacidad": 4,
  "mesaTipo": "CUADRADA",
  "description": "Especialidad en carnes"
}

Actualizar restaurante (ADMIN)
PATCH /restaurants/:id

Eliminar restaurante (ADMIN)
DELETE /restaurants/:id


Elimina:

Reviews

Reservations

Restaurant

En ese orden.

Obtener restaurantes (público)
GET /restaurants

Obtener un restaurante
GET /restaurants/:id

📅 Reservas
Crear reserva (USER)
POST /reservations

Admin ver todas las reservas
GET /reservations/admin

Admin aceptar/rechazar reserva
PATCH /reservations/:id/status


Body:

{
  "status": "ACCEPTED"
}

⭐ Reviews
Crear reseña
POST /reviews

🧪 Validaciones importantes
DTO de restaurante

mesaTipo → Enum (no string)

mesaCapacidad → Número

cantidadMesas → Número obligatorio

name/address/phone → obligatorios

Esto evita errores de Prisma con enums.

🐛 Dificultades que se resolvieron
✔ Error: enum no aceptado en update

Solución: cambiar DTO para que mesaTipo sea del tipo MesaTipo.

✔ Valores llegando como string desde el frontend

Solución: casteo numérico en el controlador.

✔ Reservas que no llegaban al admin

Se ajustaron relaciones y filtros en el backend.

✔ Migraciones inconsistentes

Se limpiaron tablas y se regeneró el schema correctamente.

🚧 Mejoras futuras

Sistema real de mesas (tabla separada con disponibilidad por horario)

Dashboard Admin con estadísticas

Diferenciar horarios de reserva

Manejo de overbooking

Fotos de restaurantes

Google Login mejorado

📫 Contacto del desarrollador

Gonzalo Andrade
Estudiante de Tecnicatura en Programación Informática
Universidad Nacional de Quilmes
📧 gonzaloandrade217@gmail.com

📍 General Belgrano, Buenos Aires, Argentina