export class ErrorValidacionVenta extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorValidacionVenta";
  }
}

export class ErrorVentaNoEncontrada extends Error {
  constructor(mensaje = "Venta no encontrada") {
    super(mensaje);
    this.name = "ErrorVentaNoEncontrada";
  }
}

export class ErrorConflictoVenta extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorConflictoVenta";
  }
}