export function normalizeDate(input: string | Date): Date {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }

  // Normalizamos a inicio del día LOCAL
  date.setHours(0, 0, 0, 0);

  return date;
}
