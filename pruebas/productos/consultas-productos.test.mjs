import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ListarProductos } from '../../src/application/productos/listar-productos.ts'
import { ObtenerProducto } from '../../src/application/productos/obtener-producto.ts'
import { ProductoMerchPrismaRepositorio } from '../../src/infrastructure/productos/producto-merch.prisma-repository.ts'
import {
  ErrorProductoNoEncontrado,
  ErrorValidacionProducto,
} from '../../src/domain/productos/errores-productos.ts'

const producto = {
  id: 2, nombre: 'Gorra', artista_id: null, precio: 60000, stock: 25, state: 'ACTIVE',
}

test('listado usa valores por defecto y conserva los campos del producto', async () => {
  const caso = new ListarProductos({
    async listarVisibles(criterio) {
      assert.deepEqual(criterio, { page: 1, limit: 10 })
      return { total: 1, productos: [producto] }
    },
  })
  assert.deepEqual(await caso.ejecutar(), {
    pagination: { total: 1, currentPage: 1, limit: 10, totalPages: 1 }, data: [producto],
  })
})

test('convierte el filtro y calcula páginas usando el total filtrado', async () => {
  const caso = new ListarProductos({
    async listarVisibles(criterio) {
      assert.deepEqual(criterio, { page: 2, limit: 2, artista_id: 4 })
      return { total: 5, productos: [producto] }
    },
  })
  const resultado = await caso.ejecutar({ page: '2', limit: '2', artista_id: '4' })
  assert.deepEqual(resultado.pagination, { total: 5, currentPage: 2, limit: 2, totalPages: 3 })
})

test('un filtro sin coincidencias devuelve cero páginas y una lista vacía', async () => {
  const caso = new ListarProductos({
    async listarVisibles() { return { total: 0, productos: [] } },
  })
  const resultado = await caso.ejecutar({ artista_id: '999999', limit: '50' })
  assert.equal(resultado.pagination.totalPages, 0)
  assert.deepEqual(resultado.data, [])
})

test('rechaza parámetros inválidos antes de consultar el repositorio', async () => {
  let llamadas = 0
  const caso = new ListarProductos({
    async listarVisibles() { llamadas++; return { total: 0, productos: [] } },
  })
  for (const consulta of [
    { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: '' },
    { page: ['1', '2'] }, { page: {} }, { page: null },
    { page: '9007199254740992' }, { page: '9007199254740991', limit: '50' },
    { limit: '0' }, { limit: '51' }, { limit: 'abc' },
    { artista_id: 'abc' }, { artista_id: '1abc' }, { artista_id: ['1', '2'] },
  ]) {
    await assert.rejects(caso.ejecutar(consulta), ErrorValidacionProducto)
  }
  assert.equal(llamadas, 0)
})

test('consulta por ID devuelve el producto y valida IDs antes de consultar', async () => {
  let llamadas = 0
  const caso = new ObtenerProducto({
    async obtenerVisiblePorId(id) { llamadas++; assert.equal(id, 2); return producto },
  })
  for (const id of ['0', '-1', 'abc', '2.5', '', undefined, ['2'], '9007199254740992']) {
    await assert.rejects(caso.ejecutar(id), ErrorValidacionProducto)
  }
  assert.equal(llamadas, 0)
  assert.deepEqual(await caso.ejecutar('2'), producto)
})

test('producto inexistente o eliminado genera error de no encontrado', async () => {
  for (const resultado of [null, { ...producto, state: 'REMOVED' }]) {
    const caso = new ObtenerProducto({ async obtenerVisiblePorId() { return resultado } })
    await assert.rejects(caso.ejecutar('2'), ErrorProductoNoEncontrado)
  }
})

test('repositorio aplica filtro y borrado lógico al conteo y a la página ordenada', async () => {
  let conteo, listado
  const repositorio = new ProductoMerchPrismaRepositorio({ productos_merch: {
    async count(args) { conteo = args; return 5 },
    async findMany(args) { listado = args; return [producto] },
  } })
  assert.deepEqual(await repositorio.listarVisibles({ page: 2, limit: 2, artista_id: 4 }), {
    total: 5, productos: [producto],
  })
  assert.deepEqual(conteo.where, { state: { not: 'REMOVED' }, artista_id: 4 })
  assert.deepEqual(listado.where, conteo.where)
  assert.deepEqual(listado.orderBy, { id: 'asc' })
  assert.equal(listado.skip, 2)
  assert.equal(listado.take, 2)
  assert.deepEqual(Object.keys(listado.select).sort(), Object.keys(producto).sort())
  await repositorio.listarVisibles({ page: 1, limit: 10 })
  assert.deepEqual(listado.where, { state: { not: 'REMOVED' } })
})

test('consulta individual del repositorio excluye productos eliminados', async () => {
  const repositorio = new ProductoMerchPrismaRepositorio({ productos_merch: {
    async findFirst(args) {
      assert.deepEqual(args.where, { id: 2, state: { not: 'REMOVED' } })
      return null
    },
  } })
  assert.equal(await repositorio.obtenerVisiblePorId(2), null)
})
