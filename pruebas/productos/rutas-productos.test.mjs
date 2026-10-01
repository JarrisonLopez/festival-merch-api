import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import express from 'express'
import { ListarProductos } from '../../src/application/productos/listar-productos.ts'
import { ObtenerProducto } from '../../src/application/productos/obtener-producto.ts'
import { crearRutasProductos } from '../../src/interface/productos/productos-merch.routes.ts'

const productos = [
  { id: 1, nombre: 'Camiseta', artista_id: 1, precio: 85000, stock: 40, state: 'ACTIVE' },
  { id: 2, nombre: 'Gorra', artista_id: 4, precio: 60000, stock: 25, state: 'ACTIVE' },
  { id: 3, nombre: 'Poster', artista_id: 1, precio: 20000, stock: 0, state: 'ACTIVE' },
  { id: 4, nombre: 'Bolsa', artista_id: null, precio: 15000, stock: 10, state: 'ACTIVE' },
  { id: 5, nombre: 'Retirado', artista_id: 1, precio: 10000, stock: 1, state: 'REMOVED' },
]

const repositorio = {
  async listarVisibles({ page, limit, artista_id }) {
    const visibles = productos.filter(p => p.state !== 'REMOVED'
      && (artista_id === undefined || p.artista_id === artista_id))
    return { total: visibles.length, productos: visibles.slice((page - 1) * limit, page * limit) }
  },
  async obtenerVisiblePorId(id) {
    return productos.find(p => p.id === id && p.state !== 'REMOVED') ?? null
  },
}

async function iniciar(t, repo = repositorio) {
  const app = express()
  app.use('/api/productos-merch', crearRutasProductos({
    listarProductos: new ListarProductos(repo),
    obtenerProducto: new ObtenerProducto(repo),
  }))
  const servidor = app.listen(0, '127.0.0.1')
  t.after(() => new Promise((resolve, reject) => {
    servidor.close(error => error ? reject(error) : resolve())
    servidor.closeAllConnections()
  }))
  await once(servidor, 'listening')
  return async (ruta = '') => {
    const respuesta = await fetch(`http://127.0.0.1:${servidor.address().port}/api/productos-merch${ruta}`)
    assert.match(respuesta.headers.get('content-type'), /application\/json/)
    return { status: respuesta.status, body: await respuesta.json() }
  }
}

test('GET listado y filtro responden con paginación y datos del contrato', async t => {
  const get = await iniciar(t)
  const listado = await get()
  assert.equal(listado.status, 200)
  assert.deepEqual(listado.body.pagination, { total: 4, currentPage: 1, limit: 10, totalPages: 1 })
  assert.deepEqual(listado.body.data.map(p => p.id), [1, 2, 3, 4])
  const filtrado = await get('?artista_id=1&page=2&limit=1')
  assert.equal(filtrado.status, 200)
  assert.deepEqual(filtrado.body, {
    pagination: { total: 2, currentPage: 2, limit: 1, totalPages: 2 }, data: [productos[2]],
  })
  const vacio = await get('?artista_id=999')
  assert.equal(vacio.status, 200)
  assert.deepEqual(vacio.body, {
    pagination: { total: 0, currentPage: 1, limit: 10, totalPages: 0 }, data: [],
  })
  const fueraDePagina = await get('?page=99')
  assert.equal(fueraDePagina.status, 200)
  assert.equal(fueraDePagina.body.pagination.total, 4)
  assert.deepEqual(fueraDePagina.body.data, [])
})

test('GET por ID devuelve precio, stock cero y artista nullable', async t => {
  const get = await iniciar(t)
  for (const id of [2, 3, 4]) {
    const respuesta = await get(`/${id}`)
    assert.equal(respuesta.status, 200)
    assert.deepEqual(respuesta.body, { data: productos[id - 1] })
  }
})

test('GET con parámetros inválidos responde 400 con error JSON', async t => {
  const get = await iniciar(t)
  for (const ruta of [
    '?page=0', '?page=-1', '?page=1.5', '?limit=0', '?limit=51', '?limit=abc',
    '?artista_id=abc', '?page=1&page=2', '?artista_id=1&artista_id=4',
    '/abc', '/0', '/-1', '/1.5',
  ]) {
    const respuesta = await get(ruta)
    assert.equal(respuesta.status, 400, ruta)
    assert.deepEqual(Object.keys(respuesta.body), ['error'])
    assert.equal(typeof respuesta.body.error, 'string')
  }
})

test('GET de un producto inexistente o eliminado responde 404', async t => {
  const get = await iniciar(t)
  for (const ruta of ['/999', '/5']) {
    const respuesta = await get(ruta)
    assert.equal(respuesta.status, 404)
    assert.deepEqual(respuesta.body, { error: 'Producto no encontrado' })
  }
})

test('errores inesperados responden 500 sin exponer detalles internos', async t => {
  const fallar = async () => { throw new Error('detalle privado de conexión') }
  const get = await iniciar(t, { listarVisibles: fallar, obtenerVisiblePorId: fallar })
  for (const ruta of ['', '/2']) {
    const respuesta = await get(ruta)
    assert.equal(respuesta.status, 500)
    assert.deepEqual(respuesta.body, { error: 'Error interno del servidor' })
  }
})
