import type { VentaMerchRepositorio } from "../../domain/ventas/venta-merch-repositorio.js";

import {
  ErrorConflictoVenta,
  ErrorVentaNoEncontrada,
} from "../../domain/ventas/errores-ventas.js";

import {
  validarCantidad,
  validarEnteroPositivoCuerpo,
} from "./validar-cuerpo-venta.js";

export interface CrearVentaEntrada {
  asistente_id?: unknown;
  producto_id?: unknown;
  cantidad?: unknown;
}

export class CrearVenta {
  constructor(private readonly repositorio: VentaMerchRepositorio) {}

  async ejecutar(entrada: CrearVentaEntrada) {
    const asistenteId = validarEnteroPositivoCuerpo(
      entrada.asistente_id,
      "asistente_id",
    );

    const productoId = validarEnteroPositivoCuerpo(
      entrada.producto_id,
      "producto_id",
    );

    const cantidad = validarCantidad(entrada.cantidad);

    const existeAsistente =
      await this.repositorio.existeAsistente(asistenteId);

    if (!existeAsistente) {
      throw new ErrorVentaNoEncontrada("Asistente no encontrado");
    }

    const producto =
      await this.repositorio.obtenerProductoPorId(productoId);

    if (!producto || producto.state === "REMOVED") {
      throw new ErrorVentaNoEncontrada("Producto no encontrado");
    }

    if (producto.stock < cantidad) {
      throw new ErrorConflictoVenta(
        "Stock insuficiente para realizar la venta",
      );
    }

    const cantidadActiva =
      await this.repositorio.obtenerCantidadActiva(
        asistenteId,
        productoId,
      );

    if (cantidadActiva + cantidad > 5) {
      throw new ErrorConflictoVenta(
        "El asistente no puede superar 5 unidades activas del mismo producto",
      );
    }

    const total = producto.precio * cantidad;

    return this.repositorio.crearVentaConDescuentoStock({
      asistente_id: asistenteId,
      producto_id: productoId,
      cantidad,
      total,
    });
  }
}