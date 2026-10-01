import type { PrismaClient } from "../../../generated/prisma/client.js";

import type {
  ActualizarVentaDatos,
  CrearVentaDatos,
  CriterioListadoVentas,
  VentaMerchRepositorio,
} from "../../domain/ventas/venta-merch-repositorio.js";

import type { VentaMerch } from "../../domain/ventas/venta-merch.js";

const camposVenta = {
  id: true,
  asistente_id: true,
  producto_id: true,
  cantidad: true,
  total: true,
  state: true,
} as const;

const camposProducto = {
  id: true,
  precio: true,
  stock: true,
  state: true,
} as const;

export class VentaMerchPrismaRepositorio
  implements VentaMerchRepositorio
{
  constructor(private readonly prisma: PrismaClient) {}

  async listarVisibles(
    criterio: CriterioListadoVentas,
  ) {
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

    return {
      total,
      ventas,
    };
  }

  async obtenerVisiblePorId(id: number) {
    return this.prisma.ventas_merch.findFirst({
      where: {
        id,
        state: {
          not: "REMOVED",
        },
      },
      select: camposVenta,
    });
  }

  async existeAsistente(id: number) {
    const total = await this.prisma.asistentes.count({
      where: {
        id,
      },
    });

    return total > 0;
  }

  async obtenerProductoPorId(id: number) {
    return this.prisma.productos_merch.findUnique({
      where: {
        id,
      },
      select: camposProducto,
    });
  }

  async obtenerCantidadActiva(
    asistenteId: number,
    productoId: number,
    excluirVentaId?: number,
  ) {
    const resultado =
      await this.prisma.ventas_merch.aggregate({
        where: {
          asistente_id: asistenteId,
          producto_id: productoId,
          state: {
            not: "REMOVED",
          },
          ...(excluirVentaId === undefined
            ? {}
            : {
                id: {
                  not: excluirVentaId,
                },
              }),
        },
        _sum: {
          cantidad: true,
        },
      });

    return resultado._sum.cantidad ?? 0;
  }

  async crearVentaConDescuentoStock(
    datos: CrearVentaDatos,
  ): Promise<VentaMerch> {
    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.ventas_merch.create({
        data: {
          asistente_id: datos.asistente_id,
          producto_id: datos.producto_id,
          cantidad: datos.cantidad,
          total: datos.total,
          state: "ACTIVE",
        },
        select: camposVenta,
      });

      await tx.productos_merch.update({
        where: {
          id: datos.producto_id,
        },
        data: {
          stock: {
            decrement: datos.cantidad,
          },
        },
      });

      return venta;
    });
  }

  async actualizarVentaConStock(
    venta: VentaMerch,
    datos: ActualizarVentaDatos,
  ): Promise<VentaMerch> {
    const diferencia =
      datos.cantidad - venta.cantidad;

    return this.prisma.$transaction(async (tx) => {
      if (diferencia > 0) {
        await tx.productos_merch.update({
          where: {
            id: venta.producto_id,
          },
          data: {
            stock: {
              decrement: diferencia,
            },
          },
        });
      }

      if (diferencia < 0) {
        await tx.productos_merch.update({
          where: {
            id: venta.producto_id,
          },
          data: {
            stock: {
              increment: Math.abs(diferencia),
            },
          },
        });
      }

      return tx.ventas_merch.update({
        where: {
          id: venta.id,
        },
        data: {
          cantidad: datos.cantidad,
          total: datos.total,
        },
        select: camposVenta,
      });
    });
  }

  async eliminarVentaYRestaurarStock(
    venta: VentaMerch,
  ): Promise<VentaMerch> {
    return this.prisma.$transaction(async (tx) => {
      const eliminada = await tx.ventas_merch.update({
        where: {
          id: venta.id,
        },
        data: {
          state: "REMOVED",
        },
        select: camposVenta,
      });

      await tx.productos_merch.update({
        where: {
          id: venta.producto_id,
        },
        data: {
          stock: {
            increment: venta.cantidad,
          },
        },
      });

      return eliminada;
    });
  }
}