import type { PrismaClient } from '../../../generated/prisma/client.js'
import type {
  CriterioListadoProductos,
  ProductoMerchRepositorio,
} from '../../domain/productos/producto-merch-repositorio.js'

const camposProducto = {
  id: true,
  nombre: true,
  artista_id: true,
  precio: true,
  stock: true,
  state: true,
} as const

export class ProductoMerchPrismaRepositorio implements ProductoMerchRepositorio {
  constructor(private readonly prisma: Pick<PrismaClient, 'productos_merch'>) {}

  async listarVisibles(criterio: CriterioListadoProductos) {
    const where = {
      state: { not: 'REMOVED' },
      ...(criterio.artista_id === undefined ? {} : { artista_id: criterio.artista_id }),
    }
    const [total, productos] = await Promise.all([
      this.prisma.productos_merch.count({ where }),
      this.prisma.productos_merch.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (criterio.page - 1) * criterio.limit,
        take: criterio.limit,
        select: camposProducto,
      }),
    ])
    return { total, productos }
  }

  async obtenerVisiblePorId(id: number) {
    return this.prisma.productos_merch.findFirst({
      where: { id, state: { not: 'REMOVED' } },
      select: camposProducto,
    })
  }
}
