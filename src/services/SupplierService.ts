// src/services/SupplierService.ts
import { pool } from "../../server"; // re-use exported pool
import { Supplier } from "../models/Supplier";

export const getAllSuppliers = async (): Promise<Supplier[]> => {
  const { rows } = await pool.query(
    `SELECT id, nome, contato, telefone, cnpj FROM fornecedores ORDER BY nome`
  );
  return rows;
};

export const getSupplierById = async (id: number): Promise<Supplier | null> => {
  const { rows } = await pool.query(
    `SELECT id, nome, contato, telefone, cnpj FROM fornecedores WHERE id=$1`,
    [id]
  );
  return rows[0] ?? null;
};

export const createSupplier = async (data: {
  nome: string;
  contato?: string | null;
  telefone?: string | null;
  cnpj?: string | null;
}): Promise<Supplier> => {
  const { rows } = await pool.query(
    `INSERT INTO fornecedores (nome, contato, telefone, cnpj) VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.nome.trim(), data.contato || null, data.telefone || null, data.cnpj || null]
  );
  return rows[0];
};

export const updateSupplier = async (
  id: number,
  data: {
    nome: string;
    contato?: string | null;
    telefone?: string | null;
    cnpj?: string | null;
  }
): Promise<Supplier | null> => {
  const { rows } = await pool.query(
    `UPDATE fornecedores SET nome=$1, contato=$2, telefone=$3, cnpj=$4 WHERE id=$5 RETURNING *`,
    [data.nome.trim(), data.contato || null, data.telefone || null, data.cnpj || null, id]
  );
  return rows[0] ?? null;
};

export const deleteSupplier = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query(`DELETE FROM fornecedores WHERE id=$1`, [id]);
  return rowCount > 0;
};
