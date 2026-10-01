import { ErrorValidacionProducto } from '../../domain/productos/errores-productos.js'

export function leerEntero(valor: unknown, nombre: string): number {
  if (typeof valor !== 'string' || !/^-?\d+$/.test(valor)) {
    throw new ErrorValidacionProducto(`${nombre} debe ser un entero`)
  }
  const numero = Number(valor)
  if (!Number.isSafeInteger(numero)) {
    throw new ErrorValidacionProducto(`${nombre} debe ser un entero seguro`)
  }
  return numero
}

export function leerEnteroPositivo(valor: unknown, nombre: string): number {
  const numero = leerEntero(valor, nombre)
  if (numero < 1) {
    throw new ErrorValidacionProducto(`${nombre} debe ser un entero positivo`)
  }
  return numero
}
