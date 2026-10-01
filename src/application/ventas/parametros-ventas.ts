import { ErrorValidacionVenta } from "../../domain/ventas/errores-ventas.js";

export function leerEntero(valor: unknown, nombre: string): number {
  if (typeof valor !== "string" || !/^-?\d+$/.test(valor)) {
    throw new ErrorValidacionVenta(`${nombre} debe ser un entero`);
  }

  const numero = Number(valor);

  if (!Number.isSafeInteger(numero)) {
    throw new ErrorValidacionVenta(`${nombre} debe ser un entero seguro`);
  }

  return numero;
}

export function leerEnteroPositivo(valor: unknown, nombre: string): number {
  const numero = leerEntero(valor, nombre);

  if (numero < 1) {
    throw new ErrorValidacionVenta(`${nombre} debe ser un entero positivo`);
  }

  return numero;
}