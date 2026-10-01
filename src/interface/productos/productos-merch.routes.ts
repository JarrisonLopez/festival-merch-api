import { Router, type ErrorRequestHandler } from 'express'
import type { ListarProductos } from '../../application/productos/listar-productos.js'
import type { ObtenerProducto } from '../../application/productos/obtener-producto.js'
import {
  ErrorProductoNoEncontrado,
  ErrorValidacionProducto,
} from '../../domain/productos/errores-productos.js'

export function crearRutasProductos(dependencias: {
  listarProductos: ListarProductos
  obtenerProducto: ObtenerProducto
}): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const resultado = await dependencias.listarProductos.ejecutar({
      page: req.query.page,
      limit: req.query.limit,
      artista_id: req.query.artista_id,
    })
    res.status(200).json(resultado)
  })

  router.get('/:id', async (req, res) => {
    const producto = await dependencias.obtenerProducto.ejecutar(req.params.id)
    res.status(200).json({ data: producto })
  })

  const manejarError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ErrorValidacionProducto) {
      res.status(400).json({ error: error.message })
      return
    }
    if (error instanceof ErrorProductoNoEncontrado) {
      res.status(404).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Error interno del servidor' })
  }
  router.use(manejarError)
  return router
}
