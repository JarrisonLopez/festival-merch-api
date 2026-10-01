import { Router, type ErrorRequestHandler } from "express";

import type { ListarVentas } from "../../application/ventas/listar-ventas.js";
import type { ObtenerVenta } from "../../application/ventas/obtener-venta.js";

import {
  ErrorValidacionVenta,
  ErrorVentaNoEncontrada,
} from "../../domain/ventas/errores-ventas.js";

export function crearRutasVentas(dependencias: {
  listarVentas: ListarVentas;
  obtenerVenta: ObtenerVenta;
}): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const resultado = await dependencias.listarVentas.ejecutar({
      page: req.query.page,
      limit: req.query.limit,
      asistente_id: req.query.asistente_id,
      producto_id: req.query.producto_id,
    });

    res.status(200).json(resultado);
  });

  router.get("/:id", async (req, res) => {
    const venta = await dependencias.obtenerVenta.ejecutar(req.params.id);

    res.status(200).json({
      data: venta,
    });
  });

  const manejarError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ErrorValidacionVenta) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    if (error instanceof ErrorVentaNoEncontrada) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  };

  router.use(manejarError);

  return router;
}