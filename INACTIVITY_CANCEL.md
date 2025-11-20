# Cancelación de Partidas por Inactividad

## Implementación Actual (Frontend)

Se ha implementado un sistema de timeout en el frontend que cancela automáticamente la partida después de **5 minutos** sin movimientos.

### Cómo Funciona

1. **Tracking de Actividad:** Cada vez que un jugador hace clic en una carta, se actualiza `lastActivityRef.current`
2. **Verificación Periódica:** Cada 30 segundos se verifica si ha pasado el tiempo límite
3. **Cancelación Automática:** Si pasan 5 minutos sin actividad, se cancela la partida y redirige a `/game`

### Configuración

```typescript
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos en milisegundos
```

Puedes ajustar este valor según tus necesidades:

- 3 minutos: `3 * 60 * 1000`
- 10 minutos: `10 * 60 * 1000`
- 30 segundos (testing): `30 * 1000`

### Ventajas de Este Enfoque

✅ No requiere cambios en el backend
✅ Funciona inmediatamente para ambos jugadores
✅ No consume API calls adicionales
✅ Fácil de ajustar el tiempo límite

### Desventajas

❌ Si el jugador cierra la pestaña, su lado del timer se detiene
❌ Requiere que el navegador esté abierto

---

## Opción 2: Cancelación por Backend (Más Robusto)

Para un sistema más robusto, puedes implementar la verificación en el servidor:

### 1. Agregar columna `last_activity` a la tabla

```sql
ALTER TABLE matches
ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### 2. Actualizar `last_activity` en cada movimiento

En `match.ts`, modifica las funciones:

```typescript
// En markSlotsAsMatched
await pool.execute(
  `UPDATE matches SET ${scoreField} = ${scoreField} + 1, last_activity = NOW() WHERE match_id = ?`,
  [matchId]
);

// En resetSlots (después del cambio de turno)
await pool.execute(
  "UPDATE matches SET player_turn = ?, last_activity = NOW() WHERE match_id = ?",
  [newTurnPlayerId, matchId]
);
```

### 3. Crear endpoint para verificar inactividad

```typescript
async function checkAndCancelInactiveMatches(
  req: VercelRequest,
  res: VercelResponse
) {
  const pool = getDB();
  try {
    // Cancelar partidas con más de 5 minutos de inactividad
    await pool.execute(
      `UPDATE matches 
       SET state = 'cancelled' 
       WHERE state = 'playing' 
       AND last_activity < NOW() - INTERVAL 5 MINUTE`,
      []
    );

    return res.status(200).json({ message: "Inactive matches cancelled" });
  } finally {
    await pool.end();
  }
}
```

### 4. Llamar periódicamente desde el frontend

```typescript
useEffect(() => {
  const checkInactive = async () => {
    await fetch("/api/match?action=check-inactive", {
      method: "GET",
      credentials: "include",
    });
  };

  // Verificar cada 60 segundos
  const interval = setInterval(checkInactive, 60000);
  return () => clearInterval(interval);
}, []);
```

### Ventajas del Enfoque Backend

✅ Más robusto - funciona aunque el usuario cierre la pestaña
✅ Cancelación consistente en el servidor
✅ Puede limpiar partidas abandonadas

### Desventajas

❌ Requiere cambios en la base de datos
❌ Más API calls (aunque mínimas)
❌ Más complejo de implementar

---

## Opción 3: Cron Job (Vercel/Serverless)

Para producción, usa Vercel Cron Jobs:

### 1. Crear archivo `api/cron/cleanup-matches.ts`

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import mysql from "mysql2/promise";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar secret para seguridad
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });

  try {
    // Cancelar partidas inactivas (más de 5 minutos)
    const [result] = await pool.execute(
      `UPDATE matches 
       SET state = 'cancelled' 
       WHERE state = 'playing' 
       AND updated_at < NOW() - INTERVAL 5 MINUTE`
    );

    const cancelledCount = (result as any).affectedRows;

    return res.status(200).json({
      message: "Cleanup completed",
      cancelledMatches: cancelledCount,
    });
  } finally {
    await pool.end();
  }
}
```

### 2. Configurar en `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-matches",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Esto ejecuta el cleanup cada 5 minutos automáticamente.

### Ventajas del Cron Job

✅ Completamente automático
✅ No depende de que usuarios estén conectados
✅ Limpia partidas abandonadas
✅ Bajo consumo de recursos

### Desventajas

❌ Solo disponible en planes Vercel Pro+
❌ Delay de hasta 5 minutos para cancelar

---

## Recomendación

**Para tu caso actual:** La implementación frontend (Opción 1) es suficiente y ya está implementada.

**Para producción a largo plazo:** Combinar Opción 1 (frontend) + Opción 3 (cron job) para tener:

- Cancelación inmediata en el frontend
- Limpieza automática de partidas abandonadas en el backend

## Testing

Para probar el sistema de inactividad:

1. Cambia temporalmente el límite a 30 segundos:

```typescript
const INACTIVITY_LIMIT = 30 * 1000; // 30 segundos
```

2. Inicia una partida y espera 30 segundos sin hacer movimientos

3. Deberías ser redirigido a `/game` automáticamente
