import type { ProductoMerchRepositorio } from '../../domain/productos/producto-merch-repositorio.js'
import { ErrorValidacionProducto } from '../../domain/productos/errores-productos.js'
import { leerEntero, leerEnteroPositivo } from './parametros-productos.js'

export interface ConsultaProductos {
  page?: unknown
  limit?: unknown
  artista_id?: unknown
}

export class ListarProductos {
  constructor(private readonly repositorio: ProductoMerchRepositorio) {}

  async ejecutar(consulta: ConsultaProductos = {}) {
    const page = consulta.page === undefined ? 1 : leerEnteroPositivo(consulta.page, 'page')
    const limit = consulta.limit === undefined ? 10 : leerEnteroPositivo(consulta.limit, 'limit')
    if (limit > 50) {
      throw new ErrorValidacionProducto('limit no puede superar 50')
    }
    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new ErrorValidacionProducto('page está fuera de rango')
    }
    const filtro = consulta.artista_id === undefined
      ? {}
      : { artista_id: leerEntero(consulta.artista_id, 'artista_id') }
    const { total, productos } = await this.repositorio.listarVisibles({ page, limit, ...filtro })
    return {
      pagination: { total, currentPage: page, limit, totalPages: Math.ceil(total / limit) },
      data: productos,
    }
  }
}
