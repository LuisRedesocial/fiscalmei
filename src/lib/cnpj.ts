export function cleanCnpj(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCnpj(value: string): string {
  const numbers = cleanCnpj(value).slice(0, 14)
  return numbers
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function isValidCnpj(value: string): boolean {
  const cnpj = cleanCnpj(value)

  if (cnpj.length !== 14) return false

  // Rejeita sequências iguais (ex: 00000000000000)
  if (/^(\d)\1+$/.test(cnpj)) return false

  // Validação do primeiro dígito verificador
  let size = cnpj.length - 2
  let numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits.charAt(0))) return false

  // Validação do segundo dígito verificador
  size = size + 1
  numbers = cnpj.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits.charAt(1))) return false

  return true
}