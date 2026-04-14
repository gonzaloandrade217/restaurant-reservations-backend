// Para GUARDAR y MOSTRAR la reserva con su hora real
export function parseToDate(input: string | Date): Date {
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error('Fecha inválida');
  return d;
}

// Para manejar la CAPACIDAD del restaurante (solo el día)
export function getStartOfDayUTC(input: string | Date): Date {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}