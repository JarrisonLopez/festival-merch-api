import type { VentaMerch } from "./venta-merch.js";

export interface CriterioListadoVentas {
  page: number;
  limit: number;
  asistente_id?: number;
  producto_id?: number;
}

export interface PaginaVentas {
  total: number;
  ventas: VentaMerch[];
}

export interface ProductoParaVenta {
  id: number;
  precio: number;
  stock: number;
  state: string;
}

export interface CrearVentaDatos {
  asistente_id: number;
  producto_id: number;
  cantidad: number;
  total: number;
}

export interface ActualizarVentaDatos {
  cantidad: number;
  total: number;
}

export interface VentaMerchRepositorio {
  listarVisibles(criterio: CriterioListadoVentas): Promise<PaginaVentas>;

  obtenerVisiblePorId(id: number): Promise<VentaMerch | null>;

  existeAsistente(id: number): Promise<boolean>;

  obtenerProductoPorId(id: number): Promise<ProductoParaVenta | null>;

  obtenerCantidadActiva(
    asistenteId: number,
    productoId: number,
    excluirVentaId?: number,
  ): Promise<number>;

  crearVentaConDescuentoStock(
    datos: CrearVentaDatos,
  ): Promise<VentaMerch>;

  actualizarVentaConStock(
    venta: VentaMerch,
    datos: ActualizarVentaDatos,
  ): Promise<VentaMerch>;

  eliminarVentaYRestaurarStock(
    venta: VentaMerch,
  ): Promise<VentaMerch>;
}