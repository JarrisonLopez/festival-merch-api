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

export interface VentaMerchRepositorio {
  listarVisibles(criterio: CriterioListadoVentas): Promise<PaginaVentas>;
  obtenerVisiblePorId(id: number): Promise<VentaMerch | null>;
}