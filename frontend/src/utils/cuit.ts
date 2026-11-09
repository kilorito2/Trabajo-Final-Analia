// Mismo algoritmo que el validador @Cuit del backend: pesos 5,4,3,2,7,6,5,4,3,2 sobre
// los primeros 10 dígitos; DV = 11 − (suma mod 11); 11 → 0; 10 → inválido.
const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Saca los guiones. No descarta otros caracteres: "20-1234567A-6" tiene que dar inválido. */
function normalizarCuit(cuit: string): string {
  return cuit.trim().replaceAll('-', '');
}

export function esCuitValido(cuit: string): boolean {
  const digitos = normalizarCuit(cuit);
  if (!/^\d{11}$/.test(digitos)) return false;

  const suma = PESOS.reduce((total, peso, i) => total + peso * Number(digitos[i]), 0);
  const resto = 11 - (suma % 11);
  if (resto === 10) return false;
  const verificador = resto === 11 ? 0 : resto;
  return verificador === Number(digitos[10]);
}

/** Máscara XX-XXXXXXXX-X mientras se escribe: ignora lo que no es dígito y corta en 11. */
export function aplicarMascaraCuit(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 10) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}
