# OroCoins 🪙

Tienda de monedas para juegos — Venezuela, Costa Rica, Ecuador, Colombia y México.

## Tech Stack

- **Next.js 15** — App Router, Server Components
- **Neon** — PostgreSQL serverless database
- **Vercel** — Hosting & deployment
- **Tailwind CSS** — Styling

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos (Neon)

1. Crea un proyecto en [neon.tech](https://console.neon.tech)
2. Copia el **Connection String**
3. En el **SQL Editor** de Neon, ejecuta el schema:

```sql
-- Pega el contenido de db/schema.sql
```

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
# Edita .env.local con tu DATABASE_URL de Neon
```

### 4. Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Deploy en Vercel

1. Push a GitHub
2. Conecta el repo en [vercel.com](https://vercel.com)
3. Agrega la variable de entorno `DATABASE_URL` en Vercel
4. Deploy ✅

## Estructura

```
app/
├── page.tsx                    # Home — selección de país
├── [country]/page.tsx          # Paquetes por país
├── pedido/[orderNumber]/       # Confirmación de pedido
└── api/orders/                 # API endpoints

components/
├── PackageGrid.tsx             # Grid de paquetes + calculadora
├── OrderModal.tsx              # Modal de orden
└── CopyButton.tsx              # Botón copiar al portapapeles

lib/
├── data.ts                     # Precios y datos de países
└── db.ts                       # Conexión Neon + queries

db/
└── schema.sql                  # Migración de base de datos
```

## Calculadora de monedas

La tasa de conversión es fija por país (derivada del primer paquete):
- La calculadora usa la misma tasa para montos personalizados
- Ejemplo CR: 650₡ = 1500 monedas → tasa = 2.307 monedas/₡
- Si el cliente paga 5.000₡ → recibe 11.538 monedas

## Países y métodos de pago

| País | Moneda | Método |
|------|--------|--------|
| Costa Rica | Colones (₡) | Sinpe Móvil |
| México | Pesos MXN ($) | Transferencia / Tarjeta |
| Colombia | Pesos COP ($) | Nequi / Daviplata |
| Venezuela | Bolívares (Bs.) | Banco Mercantil |
| Ecuador | Dólares (USD) | Banco Pichincha |
