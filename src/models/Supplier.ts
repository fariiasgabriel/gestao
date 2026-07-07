// src/models/Supplier.ts
export interface Supplier {
  id: number;
  nome: string;
  contato?: string | null;
  telefone?: string | null;
  cnpj?: string | null;
}
