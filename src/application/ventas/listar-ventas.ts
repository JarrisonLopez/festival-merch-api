import type { VentaMerchRepositorio } from "../../domain/ventas/venta-merch-repositorio.js";
import { ErrorValidacionVenta } from "../../domain/ventas/errores-ventas.js";
import { leerEnteroPositivo } from "./parametros-ventas.js";

export interface ConsultaVentas {
  page?: unknown;
  limit?: unknown;
  asistente_id?: unknown;
  producto_id?: unknown;
}

export class ListarVentas {
  constructor(private readonly repositorio: VentaMerchRepositorio) {}

  async ejecutar(consulta: ConsultaVentas = {}) {
    const page =
      consulta.page === undefined
        ? 1
        : leerEnteroPositivo(consulta.page, "page");

    const limit =
      consulta.limit === undefined
        ? 10
        : leerEnteroPositivo(consulta.limit, "limit");

    if (limit > 50) {
      throw new ErrorValidacionVenta("limit no puede superar 50");
    }

    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new ErrorValidacionVenta("page está fuera de rango");
    }

    const asistente_id =
      consulta.asistente_id === undefined
        ? undefined
        : leerEnteroPositivo(consulta.asistente_id, "asistente_id");

    const producto_id =
      consulta.producto_id === undefined
        ? undefined
        : leerEnteroPositivo(consulta.producto_id, "producto_id");

    const { total, ventas } = await this.repositorio.listarVisibles({
      page,
      limit,
      ...(asistente_id === undefined ? {} : { asistente_id }),
      ...(producto_id === undefined ? {} : { producto_id }),
    });

    return {
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: ventas,
    };
  }
}