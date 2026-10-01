import { ErrorValidacionVenta } from "../../domain/ventas/errores-ventas.js";

export function validarEnteroCuerpo(
  valor: unknown,
  nombre: string,
): number {
  if (typeof valor !== "number" || !Number.isSafeInteger(valor)) {
    throw new ErrorValidacionVenta(`${nombre} debe ser un entero`);
  }

  return valor;
}

export function validarEnteroPositivoCuerpo(
  valor: unknown,
  nombre: string,
): number {
  const numero = validarEnteroCuerpo(valor, nombre);

  if (numero < 1) {
    throw new ErrorValidacionVenta(
      `${nombre} debe ser un entero positivo`,
    );
  }

  return numero;
}

export function validarCantidad(valor: unknown): number {
  const cantidad = validarEnteroCuerpo(valor, "cantidad");

  if (cantidad < 1 || cantidad > 5) {
    throw new ErrorValidacionVenta(
      "cantidad debe estar entre 1 y 5",
    );
  }

  return cantidad;
}