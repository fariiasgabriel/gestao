// src/controllers/SupplierController.ts
import { Router } from "express";
import { authenticateToken } from "../../server";
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/SupplierService";

const router = Router();

// GET all suppliers (public)
router.get("/api/suppliers", async (req, res) => {
  try {
    const suppliers = await getAllSuppliers();
    res.json(suppliers);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET supplier by id (public)
router.get("/api/suppliers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const supplier = await getSupplierById(id);
    if (!supplier) return res.status(404).json({ message: "Fornecedor não encontrado." });
    res.json(supplier);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE supplier (protected)
router.post("/api/suppliers", authenticateToken, async (req, res) => {
  try {
    const { nome, contato, telefone, cnpj } = req.body;
    if (!nome || nome.trim() === "")
      return res.status(400).json({ message: "O nome do fornecedor é obrigatório." });
    const supplier = await createSupplier({ nome, contato, telefone, cnpj });
    res.status(201).json(supplier);
  } catch (err: any) {
    if (err.code === "23505")
      return res.status(400).json({ message: "Já existe um fornecedor com esse nome." });
    res.status(500).json({ message: err.message });
  }
});

// UPDATE supplier (protected)
router.put("/api/suppliers/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, contato, telefone, cnpj } = req.body;
    if (!nome || nome.trim() === "")
      return res.status(400).json({ message: "O nome do fornecedor é obrigatório." });
    const supplier = await updateSupplier(id, { nome, contato, telefone, cnpj });
    if (!supplier) return res.status(404).json({ message: "Fornecedor não encontrado." });
    res.json(supplier);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE supplier (protected)
router.delete("/api/suppliers/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ok = await deleteSupplier(id);
    if (!ok) return res.status(404).json({ message: "Fornecedor não encontrado." });
    res.json({ message: "Fornecedor excluído com sucesso." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
