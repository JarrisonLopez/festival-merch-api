import assert from "node:assert/strict";
import { test } from "node:test";

import { ListarVentas } from "../../src/application/ventas/listar-ventas.ts";
import { ObtenerVenta } from "../../src/application/ventas/obtener-venta.ts";
import { VentaMerchPrismaRepositorio } from "../../src/infrastructure/ventas/venta-merch.prisma-repository.ts";

import {
  ErrorValidacionVenta,
  ErrorVentaNoEncontrada,
} from "../../src/domain/ventas/errores-ventas.ts";

const venta = {
  id: 1,
  asistente_id: 5,
  producto_id: 1,
  cantidad: 4,
  total: 340000,
  state: "ACTIVE",
};

test("listado usa paginación por defecto", async () => {
  const caso = new ListarVentas({
    async listarVisibles(criterio) {
      assert.deepEqual(criterio, {
        page: 1,
        limit: 10,
      });

      return {
        total: 1,
        ventas: [venta],
      };
    },
  });

  assert.deepEqual(await caso.ejecutar(), {
    pagination: {
      total: 1,
      currentPage: 1,
      limit: 10,
      totalPages: 1,
    },
    data: [venta],
  });
});

test("convierte filtros y calcula la paginación", async () => {
  const caso = new ListarVentas({
    async listarVisibles(criterio) {
      assert.deepEqual(criterio, {
        page: 2,
        limit: 2,
        asistente_id: 5,
        producto_id: 1,
      });

      return {
        total: 5,
        ventas: [venta],
      };
    },
  });

  const resultado = await caso.ejecutar({
    page: "2",
    limit: "2",
    asistente_id: "5",
    producto_id: "1",
  });

  assert.deepEqual(resultado.pagination, {
    total: 5,
    currentPage: 2,
    limit: 2,
    totalPages: 3,
  });
});

test("rechaza parámetros inválidos antes de consultar el repositorio", async () => {
  let llamadas = 0;

  const caso = new ListarVentas({
    async listarVisibles() {
      llamadas++;
      return { total: 0, ventas: [] };
    },
  });

  for (const consulta of [
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { limit: "0" },
    { limit: "51" },
    { limit: "abc" },
    { asistente_id: "abc" },
    { producto_id: "abc" },
  ]) {
    await assert.rejects(
      caso.ejecutar(consulta),
      ErrorValidacionVenta,
    );
  }

  assert.equal(llamadas, 0);
});

test("consulta por ID valida y devuelve una venta existente", async () => {
  let llamadas = 0;

  const caso = new ObtenerVenta({
    async obtenerVisiblePorId(id) {
      llamadas++;
      assert.equal(id, 1);
      return venta;
    },
  });

  for (const id of ["0", "-1", "abc", "1.5", ""]) {
    await assert.rejects(
      caso.ejecutar(id),
      ErrorValidacionVenta,
    );
  }

  assert.equal(llamadas, 0);
  assert.deepEqual(await caso.ejecutar("1"), venta);
  assert.equal(llamadas, 1);
});

test("venta inexistente o eliminada genera error de no encontrado", async () => {
  for (const resultado of [
    null,
    { ...venta, state: "REMOVED" },
  ]) {
    const caso = new ObtenerVenta({
      async obtenerVisiblePorId() {
        return resultado;
      },
    });

    await assert.rejects(
      caso.ejecutar("1"),
      ErrorVentaNoEncontrada,
    );
  }
});

test("repositorio aplica filtros, orden y borrado lógico", async () => {
  let conteo;
  let listado;

  const repositorio = new VentaMerchPrismaRepositorio({
    ventas_merch: {
      async count(args) {
        conteo = args;
        return 5;
      },

      async findMany(args) {
        listado = args;
        return [venta];
      },
    },
  });

  const resultado = await repositorio.listarVisibles({
    page: 2,
    limit: 2,
    asistente_id: 5,
    producto_id: 1,
  });

  assert.deepEqual(resultado, {
    total: 5,
    ventas: [venta],
  });

  assert.deepEqual(conteo.where, {
    state: { not: "REMOVED" },
    asistente_id: 5,
    producto_id: 1,
  });

  assert.deepEqual(listado.where, conteo.where);
  assert.deepEqual(listado.orderBy, { id: "asc" });
  assert.equal(listado.skip, 2);
  assert.equal(listado.take, 2);
});

test("consulta individual excluye ventas eliminadas", async () => {
  const repositorio = new VentaMerchPrismaRepositorio({
    ventas_merch: {
      async findFirst(args) {
        assert.deepEqual(args.where, {
          id: 1,
          state: { not: "REMOVED" },
        });

        return null;
      },
    },
  });

  assert.equal(
    await repositorio.obtenerVisiblePorId(1),
    null,
  );
});