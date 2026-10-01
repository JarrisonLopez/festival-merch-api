import "dotenv/config";
import express from "express";
import cors from "cors";

import { prisma } from "./infrastructure/db/prisma.js";

import { ListarProductos } from "./application/productos/listar-productos.js";
import { ObtenerProducto } from "./application/productos/obtener-producto.js";
import { ProductoMerchPrismaRepositorio } from "./infrastructure/productos/producto-merch.prisma-repository.js";
import { crearRutasProductos } from "./interface/productos/productos-merch.routes.js";

import { ListarVentas } from "./application/ventas/listar-ventas.js";
import { ObtenerVenta } from "./application/ventas/obtener-venta.js";
import { VentaMerchPrismaRepositorio } from "./infrastructure/ventas/venta-merch.prisma-repository.js";
import { crearRutasVentas } from "./interface/ventas/ventas-merch.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Repositorio de Productos
const repositorioProductos = new ProductoMerchPrismaRepositorio(prisma);

const repositorioVentas = new VentaMerchPrismaRepositorio(prisma);

// Rutas de Productos
app.use(
  "/api/productos-merch",
  crearRutasProductos({
    listarProductos: new ListarProductos(repositorioProductos),
    obtenerProducto: new ObtenerProducto(repositorioProductos),
  }),
);

app.use(
  "/api/ventas-merch",
  crearRutasVentas({
    listarVentas: new ListarVentas(repositorioVentas),
    obtenerVenta: new ObtenerVenta(repositorioVentas),
  }),
);

// Ruta de comprobación del servidor
app.get("/", (_req, res) => {
  res.json({ message: "API Festival Picnic 2026 funcionando" });
});

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});