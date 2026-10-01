import type { VentaMerchRepositorio } from "../../domain/ventas/venta-merch-repositorio.js";

import { ErrorVentaNoEncontrada } from "../../domain/ventas/errores-ventas.js";

import { leerEnteroPositivo } from "./parametros-ventas.js";

export class EliminarVenta {
  constructor(private readonly repositorio: VentaMerchRepositorio) {}

  async ejecutar(idCrudo: unknown) {
    const id = leerEnteroPositivo(idCrudo, "id");

    const venta =
      await this.repositorio.obtenerVisiblePorId(id);

    if (!venta) {
      throw new ErrorVentaNoEncontrada();
    }

    return this.repositorio.eliminarVentaYRestaurarStock(
      venta,
    );
  }
}