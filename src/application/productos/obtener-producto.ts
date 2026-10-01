import type { ProductoMerchRepositorio } from '../../domain/productos/producto-merch-repositorio.js'
import { ErrorProductoNoEncontrado } from '../../domain/productos/errores-productos.js'
import { leerEnteroPositivo } from './parametros-productos.js'

export class ObtenerProducto {
  constructor(private readonly repositorio: ProductoMerchRepositorio) {}

  async ejecutar(idCrudo: unknown) {
    const id = leerEnteroPositivo(idCrudo, 'id')
    const producto = await this.repositorio.obtenerVisiblePorId(id)
    if (!producto || producto.state === 'REMOVED') {
      throw new ErrorProductoNoEncontrado()
    }
    return producto
  }
}
