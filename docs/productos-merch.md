# Productos Merch — aporte de Santiago

Implementa `GET /api/productos-merch` y `GET /api/productos-merch/:id`.
El listado admite `page`, `limit` y `artista_id`. Usa página 1 y límite 10
por defecto, con un máximo de 50. Devuelve `pagination` y `data`;
la consulta individual devuelve `{ data: producto }`.

## Organización

- `src/domain/productos`: modelo, contrato de consultas y errores propios.
- `src/application/productos`: casos de uso y validación de parámetros.
- `src/infrastructure/productos`: consultas de solo lectura con Prisma.
- `src/interface/productos`: router Express y traducción de errores a HTTP.

Los casos de uso dependen de la interfaz del repositorio. El router solo
recibe parámetros, delega y responde. Express 5 envía los rechazos de los
controladores async al manejador de errores del router.

## Integración con el arranque común

Jarrison debe montar el router en `src/app.ts` usando el cliente Prisma
compartido. Este aporte no crea otro servidor ni otra conexión a la base.
El siguiente fragmento asume que `app` y `prisma` ya existen:

```ts
import { ListarProductos } from './application/productos/listar-productos.js'
import { ObtenerProducto } from './application/productos/obtener-producto.js'
import { ProductoMerchPrismaRepositorio } from './infrastructure/productos/producto-merch.prisma-repository.js'
import { crearRutasProductos } from './interface/productos/productos-merch.routes.js'

const repositorioProductos = new ProductoMerchPrismaRepositorio(prisma)
app.use('/api/productos-merch', crearRutasProductos({
  listarProductos: new ListarProductos(repositorioProductos),
  obtenerProducto: new ObtenerProducto(repositorioProductos),
}))
```

Montar antes del manejador final de rutas inexistentes. Los errores de productos
se traducen dentro del router: validación 400, no encontrado 404 y error interno
500 sin detalles de conexión ni stack trace.

## Regla aplicada

Un producto con `state = 'REMOVED'` no debe aparecer en consultas. El repositorio
`src/infrastructure/productos/producto-merch.prisma-repository.ts` excluye ese
estado tanto al contar y listar como al buscar por ID. Así, el total paginado
cuenta solo productos visibles que cumplen el filtro, y un producto eliminado
responde 404. Un producto con stock cero sí se puede consultar.

## Verificación

Desde la raíz del repositorio, con dependencias instaladas:

```powershell
node --import tsx --test pruebas/productos/consultas-productos.test.mjs pruebas/productos/rutas-productos.test.mjs
```

Las pruebas de casos de uso y repositorio usan dobles; las pruebas HTTP levantan
Express en un puerto local temporal con un repositorio en memoria. Verifican
paginación, filtros, stock cero, artista nullable, validación 400, ausencia 404
y respuesta 500. No acceden ni escriben en la base compartida.

La verificación con la base real y la API completa queda para después de montar
estas rutas en el arranque común. Las pruebas públicas de Merch también incluyen
ventas y requieren el trabajo de los demás integrantes.
