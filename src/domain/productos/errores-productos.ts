export class ErrorValidacionProducto extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorValidacionProducto'
  }
}

export class ErrorProductoNoEncontrado extends Error {
  constructor() {
    super('Producto no encontrado')
    this.name = 'ErrorProductoNoEncontrado'
  }
}
