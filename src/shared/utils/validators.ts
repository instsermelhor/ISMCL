/**
 * Validadores corporativos da Plataforma Aura
 *
 * Validações de documentos e dados brasileiros com algoritmos oficiais.
 * Usados tanto no frontend quanto exportados para uso via Shared Library.
 *
 * Referências: P103 (AEXP), P131 (AFPI)
 */

/**
 * Valida CPF com algoritmo oficial da Receita Federal.
 * Remove formatação antes de validar.
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Ex: 000.000.000-00

  const calcDigit = (arr: number[], len: number): number => {
    const sum = arr.slice(0, len).reduce((acc, val, i) => acc + val * (len + 1 - i), 0);
    const remainder = (sum * 10) % 11;
    return remainder >= 10 ? 0 : remainder;
  };

  const digits = cleaned.split('').map(Number);
  const d1 = calcDigit(digits, 9);
  const d2 = calcDigit(digits, 10);

  return digits[9] === d1 && digits[10] === d2;
}

/**
 * Valida CNPJ com algoritmo oficial da Receita Federal.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const calcDigit = (str: string, len: number): number => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = str
      .slice(0, len)
      .split('')
      .reduce((acc, val, i) => acc + Number(val) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const d1 = calcDigit(cleaned, 12);
  const d2 = calcDigit(cleaned, 13);

  return Number(cleaned[12]) === d1 && Number(cleaned[13]) === d2;
}

/**
 * Valida e-mail com regex RFC 5321 simplificada.
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

/**
 * Valida telefone brasileiro (fixo e celular) com e sem DDD.
 * Formatos aceitos: (11) 99999-9999, 11999999999, +5511999999999
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Com DDI (55): 12-13 dígitos | Com DDD: 10-11 | Sem DDD: 8-9
  return cleaned.length >= 8 && cleaned.length <= 13;
}

/**
 * Verifica se a senha atende aos critérios de complexidade:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 dígito
 * - Pelo menos 1 caractere especial
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;
  return true;
}

/**
 * Verifica se uma string de data é válida no formato dd/MM/yyyy.
 */
export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateStr)) return false;

  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Verifica se a data de nascimento indica maioridade (>= 18 anos).
 */
export function isAdult(birthDate: Date): boolean {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}
