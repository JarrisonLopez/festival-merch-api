import type { PrismaClient } from "../../../generated/prisma/client.js";

import type {
  CriterioListadoVentas,
  VentaMerchRepositorio,
} from "../../domain/ventas/venta-merch-repositorio.js";

const camposVenta = {
  id: true,
  asistente_id: true,
  producto_id: true,
  cantidad: true,
  total: true,
  state: true,
} as const;

export class VentaMerchPrismaRepositorio implements VentaMerchRepositorio {
  constructor(private readonly prisma: Pick<PrismaClient, "ventas_merch">) {}

  async listarVisibles(criterio: CriterioListadoVentas) {
    const where = {
      state: { not: "REMOVED" },
      ...(criterio.asistente_id === undefined
        ? {}
        : { asistente_id: criterio.asistente_id }),
      ...(criterio.producto_id === undefined
        ? {}
        : { producto_id: criterio.producto_id }),
    };

    const [total, ventas] = await Promise.all([
      this.prisma.ventas_merch.count({ where }),

      this.prisma.ventas_merch.findMany({
        where,
        orderBy: { id: "asc" },
        skip: (criterio.page - 1) * criterio.limit,
        take: criterio.limit,
        select: camposVenta,
      }),
    ]);

    return { total, ventas };
  }

  async obtenerVisiblePorId(id: number) {
    return this.prisma.ventas_merch.findFirst({
      where: {
        id,
        state: { not: "REMOVED" },
      },
      select: camposVenta,
    });
  }
}