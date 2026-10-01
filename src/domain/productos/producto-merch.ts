export interface ProductoMerch {
  id: number
  nombre: string
  artista_id: number | null
  precio: number
  stock: number
  state: string
}
