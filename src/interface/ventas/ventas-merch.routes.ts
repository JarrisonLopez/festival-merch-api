import {
  Router,
  type ErrorRequestHandler,
} from "express";

import type { ListarVentas } from "../../application/ventas/listar-ventas.js";
import type { ObtenerVenta } from "../../application/ventas/obtener-venta.js";
import type { CrearVenta } from "../../application/ventas/crear-venta.js";
import type { ActualizarVenta } from "../../application/ventas/actualizar-venta.js";
import type { EliminarVenta } from "../../application/ventas/eliminar-venta.js";

import {
  ErrorConflictoVenta,
  ErrorValidacionVenta,
  ErrorVentaNoEncontrada,
} from "../../domain/ventas/errores-ventas.js";

export function crearRutasVentas(dependencias: {
  listarVentas: ListarVentas;
  obtenerVenta: ObtenerVenta;
  crearVenta: CrearVenta;
  actualizarVenta: ActualizarVenta;
  eliminarVenta: EliminarVenta;
}): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const resultado =
      await dependencias.listarVentas.ejecutar({
        page: req.query.page,
        limit: req.query.limit,
        asistente_id: req.query.asistente_id,
        producto_id: req.query.producto_id,
      });

    res.status(200).json(resultado);
  });

  router.get("/:id", async (req, res) => {
    const venta =
      await dependencias.obtenerVenta.ejecutar(
        req.params.id,
      );

    res.status(200).json({
      data: venta,
    });
  });

  router.post("/", async (req, res) => {
    const venta =
      await dependencias.crearVenta.ejecutar(
        req.body ?? {},
      );

    res.status(201).json({
      data: venta,
    });
  });

  router.patch("/:id", async (req, res) => {
    const cuerpo =
      req.body &&
      typeof req.body === "object" &&
      !Array.isArray(req.body)
        ? req.body
        : {};

    const venta =
      await dependencias.actualizarVenta.ejecutar(
        req.params.id,
        cuerpo,
      );

    res.status(200).json({
      data: venta,
    });
  });

  router.delete("/:id", async (req, res) => {
    const venta =
      await dependencias.eliminarVenta.ejecutar(
        req.params.id,
      );

    res.status(200).json({
      data: venta,
    });
  });

  const manejarError: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
  ) => {
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

    if (error instanceof ErrorConflictoVenta) {
      res.status(409).json({
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