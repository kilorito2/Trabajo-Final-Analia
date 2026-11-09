/** "Amoxicilina" + "comprimidos 500 mg" → "Amoxicilina comprimidos 500 mg". */
export const nombreCompleto = (m: { nombre: string; presentacion: string }) =>
  `${m.nombre} ${m.presentacion}`;
