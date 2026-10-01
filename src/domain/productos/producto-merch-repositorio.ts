import type { ProductoMerch } from './producto-merch.js'

export interface CriterioListadoProductos {
  page: number
  limit: number
  artista_id?: number
}

export interface PaginaProductos {
  total: number
  productos: ProductoMerch[]
}

export interface ProductoMerchRepositorio {
  /** Excluye REMOVED, ordena por id ascendente y cuenta todos los resultados del filtro. */
  listarVisibles(criterio: CriterioListadoProductos): Promise<PaginaProductos>

  /** Devuelve null si el producto no existe o tiene state REMOVED. */
  obtenerVisiblePorId(id: number): Promise<ProductoMerch | null>
}
