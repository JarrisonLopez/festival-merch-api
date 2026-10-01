import type { VentaMerchRepositorio } from "../../domain/ventas/venta-merch-repositorio.js";

import {
  ErrorConflictoVenta,
  ErrorVentaNoEncontrada,
  ErrorValidacionVenta,
} from "../../domain/ventas/errores-ventas.js";

import { leerEnteroPositivo } from "./parametros-ventas.js";
import { validarCantidad } from "./validar-cuerpo-venta.js";

export class ActualizarVenta {
  constructor(private readonly repositorio: VentaMerchRepositorio) {}

  async ejecutar(
    idCrudo: unknown,
    cuerpo: Record<string, unknown>,
  ) {
    const id = leerEnteroPositivo(idCrudo, "id");

    const campos = Object.keys(cuerpo);

    if (
      campos.length !== 1 ||
      campos[0] !== "cantidad"
    ) {
      throw new ErrorValidacionVenta(
        "Solo se permite modificar cantidad",
      );
    }

    const cantidad = validarCantidad(cuerpo.cantidad);

    const venta =
      await this.repositorio.obtenerVisiblePorId(id);

    if (!venta) {
      throw new ErrorVentaNoEncontrada();
    }

    const producto =
      await this.repositorio.obtenerProductoPorId(
        venta.producto_id,
      );

    if (!producto || producto.state === "REMOVED") {
      throw new ErrorVentaNoEncontrada(
        "Producto no encontrado",
      );
    }

    const otrasUnidades =
      await this.repositorio.obtenerCantidadActiva(
        venta.asistente_id,
        venta.producto_id,
        venta.id,
      );

    if (otrasUnidades + cantidad > 5) {
      throw new ErrorConflictoVenta(
        "El asistente no puede superar 5 unidades activas del mismo producto",
      );
    }

    const diferencia = cantidad - venta.cantidad;

    if (diferencia > 0 && producto.stock < diferencia) {
      throw new ErrorConflictoVenta(
        "Stock insuficiente para actualizar la venta",
      );
    }

    const total = producto.precio * cantidad;

    return this.repositorio.actualizarVentaConStock(
      venta,
      {
        cantidad,
        total,
      },
    );
  }
}