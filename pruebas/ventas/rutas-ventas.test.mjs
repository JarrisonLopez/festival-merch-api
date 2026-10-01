import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";

import { ListarVentas } from "../../src/application/ventas/listar-ventas.ts";
import { ObtenerVenta } from "../../src/application/ventas/obtener-venta.ts";
import { crearRutasVentas } from "../../src/interface/ventas/ventas-merch.routes.ts";

const ventas = [
  {
    id: 1,
    asistente_id: 5,
    producto_id: 1,
    cantidad: 4,
    total: 340000,
    state: "ACTIVE",
  },
  {
    id: 2,
    asistente_id: 6,
    producto_id: 2,
    cantidad: 2,
    total: 120000,
    state: "ACTIVE",
  },
  {
    id: 3,
    asistente_id: 6,
    producto_id: 3,
    cantidad: 1,
    total: 45000,
    state: "ACTIVE",
  },
  {
    id: 4,
    asistente_id: 7,
    producto_id: 2,
    cantidad: 1,
    total: 60000,
    state: "REMOVED",
  },
];

const repositorio = {
  async listarVisibles({ page, limit, asistente_id, producto_id }) {
    const visibles = ventas.filter(
      (venta) =>
        venta.state !== "REMOVED" &&
        (asistente_id === undefined ||
          venta.asistente_id === asistente_id) &&
        (producto_id === undefined ||
          venta.producto_id === producto_id),
    );

    return {
      total: visibles.length,
      ventas: visibles.slice(
        (page - 1) * limit,
        page * limit,
      ),
    };
  },

  async obtenerVisiblePorId(id) {
    return (
      ventas.find(
        (venta) =>
          venta.id === id &&
          venta.state !== "REMOVED",
      ) ?? null
    );
  },
};

async function iniciar(t, repo = repositorio) {
  const app = express();

  app.use(
    "/api/ventas-merch",
    crearRutasVentas({
      listarVentas: new ListarVentas(repo),
      obtenerVenta: new ObtenerVenta(repo),
    }),
  );

  const servidor = app.listen(0, "127.0.0.1");

  t.after(
    () =>
      new Promise((resolve, reject) => {
        servidor.close((error) =>
          error ? reject(error) : resolve(),
        );
        servidor.closeAllConnections();
      }),
  );

  await once(servidor, "listening");

  return async (ruta = "") => {
    const respuesta = await fetch(
      `http://127.0.0.1:${servidor.address().port}/api/ventas-merch${ruta}`,
    );

    assert.match(
      respuesta.headers.get("content-type"),
      /application\/json/,
    );

    return {
      status: respuesta.status,
      body: await respuesta.json(),
    };
  };
}

test("GET listado responde con paginación y excluye REMOVED", async (t) => {
  const get = await iniciar(t);

  const respuesta = await get();

  assert.equal(respuesta.status, 200);

  assert.deepEqual(respuesta.body.pagination, {
    total: 3,
    currentPage: 1,
    limit: 10,
    totalPages: 1,
  });

  assert.deepEqual(
    respuesta.body.data.map((venta) => venta.id),
    [1, 2, 3],
  );
});

test("GET listado admite paginación y filtros", async (t) => {
  const get = await iniciar(t);

  const respuesta = await get(
    "?asistente_id=6&producto_id=2&page=1&limit=1",
  );

  assert.equal(respuesta.status, 200);

  assert.deepEqual(respuesta.body, {
    pagination: {
      total: 1,
      currentPage: 1,
      limit: 1,
      totalPages: 1,
    },
    data: [ventas[1]],
  });
});

test("GET sin coincidencias devuelve lista vacía", async (t) => {
  const get = await iniciar(t);

  const respuesta = await get("?asistente_id=999999");

  assert.equal(respuesta.status, 200);

  assert.deepEqual(respuesta.body, {
    pagination: {
      total: 0,
      currentPage: 1,
      limit: 10,
      totalPages: 0,
    },
    data: [],
  });
});

test("GET por ID devuelve una venta activa", async (t) => {
  const get = await iniciar(t);

  const respuesta = await get("/1");

  assert.equal(respuesta.status, 200);
  assert.deepEqual(respuesta.body, {
    data: ventas[0],
  });
});

test("parámetros inválidos responden 400", async (t) => {
  const get = await iniciar(t);

  for (const ruta of [
    "?page=0",
    "?page=-1",
    "?page=1.5",
    "?limit=0",
    "?limit=51",
    "?limit=abc",
    "?asistente_id=abc",
    "?producto_id=abc",
    "?page=1&page=2",
    "/abc",
    "/0",
    "/-1",
    "/1.5",
  ]) {
    const respuesta = await get(ruta);

    assert.equal(respuesta.status, 400, ruta);
    assert.deepEqual(
      Object.keys(respuesta.body),
      ["error"],
    );
    assert.equal(
      typeof respuesta.body.error,
      "string",
    );
  }
});

test("venta inexistente o eliminada responde 404", async (t) => {
  const get = await iniciar(t);

  for (const ruta of ["/999999", "/4"]) {
    const respuesta = await get(ruta);

    assert.equal(respuesta.status, 404);

    assert.deepEqual(respuesta.body, {
      error: "Venta no encontrada",
    });
  }
});

test("errores inesperados responden 500 sin detalles internos", async (t) => {
  const fallar = async () => {
    throw new Error("detalle privado de conexión");
  };

  const get = await iniciar(t, {
    listarVisibles: fallar,
    obtenerVisiblePorId: fallar,
  });

  for (const ruta of ["", "/1"]) {
    const respuesta = await get(ruta);

    assert.equal(respuesta.status, 500);

    assert.deepEqual(respuesta.body, {
      error: "Error interno del servidor",
    });
  }
});