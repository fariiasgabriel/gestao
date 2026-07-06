import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";

// =============================================================
// DATABASE CONNECTION — Supabase (PostgreSQL)
// =============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =============================================================
// MOCK AUTH — Login fixo com token simples
// =============================================================
const MOCK_USERNAME = process.env.MOCK_USERNAME || "Gabriel";
const MOCK_PASSWORD = process.env.MOCK_PASSWORD || "201981";
const MOCK_TOKEN = "mock-jwt-token-admin";

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    return;
  }
  if (token === MOCK_TOKEN) {
    next();
  } else {
    res.status(403).json({ message: "Token inválido ou expirado." });
  }
};

// =============================================================
// FINANCE HELPERS
// =============================================================
function calcFinancials(
  totalValorVenda: number,
  totalCustoSKU: number,
  frete: number,
  taxaFixa: number,
  comissaoTipo: string,
  comissaoInformada: number
) {
  let comissaoValor = 0;
  if (comissaoTipo === "PERCENTUAL") {
    comissaoValor = Number(((comissaoInformada / 100) * totalValorVenda).toFixed(2));
  } else {
    comissaoValor = Number(comissaoInformada);
  }
  const lucroBruto = Number((totalValorVenda - frete - taxaFixa - comissaoValor).toFixed(2));
  const lucroLiquido = Number((lucroBruto - totalCustoSKU).toFixed(2));
  const margemBruta = totalValorVenda > 0 ? Number(((lucroBruto / totalValorVenda) * 100).toFixed(2)) : 0;
  const margemLiquida = totalValorVenda > 0 ? Number(((lucroLiquido / totalValorVenda) * 100).toFixed(2)) : 0;
  return { comissaoValor, lucroBruto, lucroLiquido, margemBruta, margemLiquida };
}

// =============================================================
// SERVER
// =============================================================
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(express.json());

  // --- INIT TABLES ---
  // Cria as tabelas no Supabase se ainda não existirem
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS marketplaces (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      custo NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (custo >= 0),
      quantidade_estoque INT NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
      categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      marketplace_id INT NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
      comissao_tipo VARCHAR(20) NOT NULL,
      comissao_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
      comissao_informada NUMERIC(10,2) NOT NULL DEFAULT 0,
      frete NUMERIC(10,2) NOT NULL DEFAULT 0,
      taxa_fixa NUMERIC(10,2) NOT NULL DEFAULT 0,
      valor_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
      lucro_bruto NUMERIC(10,2) NOT NULL DEFAULT 0,
      lucro_liquido NUMERIC(10,2) NOT NULL DEFAULT 0,
      margem_bruta NUMERIC(10,2) NOT NULL DEFAULT 0,
      margem_liquida NUMERIC(10,2) NOT NULL DEFAULT 0,
      data_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id SERIAL PRIMARY KEY,
      pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
      categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
      quantidade INT NOT NULL CHECK (quantidade > 0),
      valor_venda NUMERIC(10,2) NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS despesas (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PRODUTO','GERAL')),
      descricao VARCHAR(255) NOT NULL,
      produto_id INT REFERENCES produtos(id) ON DELETE SET NULL,
      fornecedor_id INT REFERENCES fornecedores(id) ON DELETE SET NULL,
      quantidade INT,
      custo_unitario NUMERIC(10,2),
      valor NUMERIC(10,2) NOT NULL DEFAULT 0,
      data TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS fornecedores (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      contato VARCHAR(100),
      telefone VARCHAR(30),
      cnpj VARCHAR(30)
    );
  `).catch(async () => {
    // Se a despesas falhou por conta de fornecedores não existir ainda, criar na ordem certa
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        contato VARCHAR(100),
        telefone VARCHAR(30),
        cnpj VARCHAR(30)
      );
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS marketplaces (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        custo NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (custo >= 0),
        quantidade_estoque INT NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
        categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        marketplace_id INT NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
        comissao_tipo VARCHAR(20) NOT NULL,
        comissao_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
        comissao_informada NUMERIC(10,2) NOT NULL DEFAULT 0,
        frete NUMERIC(10,2) NOT NULL DEFAULT 0,
        taxa_fixa NUMERIC(10,2) NOT NULL DEFAULT 0,
        valor_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
        lucro_bruto NUMERIC(10,2) NOT NULL DEFAULT 0,
        lucro_liquido NUMERIC(10,2) NOT NULL DEFAULT 0,
        margem_bruta NUMERIC(10,2) NOT NULL DEFAULT 0,
        margem_liquida NUMERIC(10,2) NOT NULL DEFAULT 0,
        data_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS pedido_itens (
        id SERIAL PRIMARY KEY,
        pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
        categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
        quantidade INT NOT NULL CHECK (quantidade > 0),
        valor_venda NUMERIC(10,2) NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS despesas (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PRODUTO','GERAL')),
        descricao VARCHAR(255) NOT NULL,
        produto_id INT REFERENCES produtos(id) ON DELETE SET NULL,
        fornecedor_id INT REFERENCES fornecedores(id) ON DELETE SET NULL,
        quantidade INT,
        custo_unitario NUMERIC(10,2),
        valor NUMERIC(10,2) NOT NULL DEFAULT 0,
        data TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  });

  console.log(">>> Tabelas verificadas/criadas no Supabase com sucesso.");

  // ================================================================
  // AUTH
  // ================================================================
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (username === MOCK_USERNAME && password === MOCK_PASSWORD) {
      res.json({ token: MOCK_TOKEN, username: MOCK_USERNAME, role: "ADMIN" });
    } else {
      res.status(401).json({ message: "Usuário ou senha inválidos." });
    }
  });

  // ================================================================
  // CATEGORIES CRUD
  // ================================================================
  app.get("/api/categories", async (req, res) => {
    try {
      const search = (req.query.search as string || "").toLowerCase();
      const { rows } = await pool.query(
        `SELECT id, nome FROM categorias WHERE LOWER(nome) LIKE $1 ORDER BY nome`,
        [`%${search}%`]
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/categories", authenticateToken, async (req, res) => {
    try {
      const { nome } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome da categoria é obrigatório." });
      const { rows } = await pool.query(
        `INSERT INTO categorias (nome) VALUES ($1) RETURNING id, nome`,
        [nome.trim()]
      );
      res.status(201).json(rows[0]);
    } catch (err: any) {
      if (err.code === "23505") return res.status(400).json({ message: "Já existe uma categoria com esse nome." });
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nome } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome da categoria é obrigatório." });
      const { rows } = await pool.query(
        `UPDATE categorias SET nome=$1 WHERE id=$2 RETURNING id, nome`,
        [nome.trim(), id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "Categoria não encontrada." });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rowCount } = await pool.query(`DELETE FROM categorias WHERE id=$1`, [id]);
      if (rowCount === 0) return res.status(404).json({ message: "Categoria não encontrada." });
      res.json({ message: "Categoria excluída com sucesso." });
    } catch (err: any) {
      if (err.code === "23503") return res.status(400).json({ message: "Categoria possui produtos vinculados e não pode ser excluída." });
      res.status(500).json({ message: err.message });
    }
  });

  // ================================================================
  // MARKETPLACES CRUD
  // ================================================================
  app.get("/api/marketplaces", async (req, res) => {
    try {
      const search = (req.query.search as string || "").toLowerCase();
      const { rows } = await pool.query(
        `SELECT id, nome FROM marketplaces WHERE LOWER(nome) LIKE $1 ORDER BY nome`,
        [`%${search}%`]
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/marketplaces", authenticateToken, async (req, res) => {
    try {
      const { nome } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome do marketplace é obrigatório." });
      const { rows } = await pool.query(
        `INSERT INTO marketplaces (nome) VALUES ($1) RETURNING id, nome`,
        [nome.trim()]
      );
      res.status(201).json(rows[0]);
    } catch (err: any) {
      if (err.code === "23505") return res.status(400).json({ message: "Já existe um marketplace com esse nome." });
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/marketplaces/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nome } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome do marketplace é obrigatório." });
      const { rows } = await pool.query(
        `UPDATE marketplaces SET nome=$1 WHERE id=$2 RETURNING id, nome`,
        [nome.trim(), id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "Marketplace não encontrado." });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/marketplaces/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rowCount } = await pool.query(`DELETE FROM marketplaces WHERE id=$1`, [id]);
      if (rowCount === 0) return res.status(404).json({ message: "Marketplace não encontrado." });
      res.json({ message: "Marketplace excluído com sucesso." });
    } catch (err: any) {
      if (err.code === "23503") return res.status(400).json({ message: "Marketplace possui pedidos vinculados e não pode ser excluído." });
      res.status(500).json({ message: err.message });
    }
  });

  // ================================================================
  // SUPPLIERS CRUD
  // ================================================================
  app.get("/api/suppliers", async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT id, nome, contato, telefone, cnpj FROM fornecedores ORDER BY nome`);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/suppliers", authenticateToken, async (req, res) => {
    try {
      const { nome, contato, telefone, cnpj } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome do fornecedor é obrigatório." });
      const { rows } = await pool.query(
        `INSERT INTO fornecedores (nome, contato, telefone, cnpj) VALUES ($1,$2,$3,$4) RETURNING *`,
        [nome.trim(), contato || null, telefone || null, cnpj || null]
      );
      res.status(201).json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nome, contato, telefone, cnpj } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome do fornecedor é obrigatório." });
      const { rows } = await pool.query(
        `UPDATE fornecedores SET nome=$1, contato=$2, telefone=$3, cnpj=$4 WHERE id=$5 RETURNING *`,
        [nome.trim(), contato || null, telefone || null, cnpj || null, id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "Fornecedor não encontrado." });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rowCount } = await pool.query(`DELETE FROM fornecedores WHERE id=$1`, [id]);
      if (rowCount === 0) return res.status(404).json({ message: "Fornecedor não encontrado." });
      res.json({ message: "Fornecedor excluído com sucesso." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ================================================================
  // PRODUCTS CRUD
  // ================================================================
  app.get("/api/products", async (req, res) => {
    try {
      const search = (req.query.search as string || "").toLowerCase();
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;

      let query = `
        SELECT p.id, p.nome, p.custo, p.quantidade_estoque AS "quantidadeEstoque",
               p.categoria_id AS "categoriaId", c.nome AS "categoriaNome"
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        query += ` AND LOWER(p.nome) LIKE $${params.length}`;
      }
      if (categoryId) {
        params.push(categoryId);
        query += ` AND p.categoria_id = $${params.length}`;
      }
      query += ` ORDER BY p.nome`;

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const { nome, custo, quantidadeEstoque, categoriaId } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome do produto é obrigatório." });
      if (custo === undefined || custo < 0) return res.status(400).json({ message: "O custo não pode ser negativo." });
      if (!categoriaId) return res.status(400).json({ message: "A categoria é obrigatória." });
      const { rows } = await pool.query(
        `INSERT INTO produtos (nome, custo, quantidade_estoque, categoria_id) VALUES ($1,$2,$3,$4)
         RETURNING id, nome, custo, quantidade_estoque AS "quantidadeEstoque", categoria_id AS "categoriaId"`,
        [nome.trim(), Number(custo), Number(quantidadeEstoque || 0), Number(categoriaId)]
      );
      res.status(201).json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nome, custo, quantidadeEstoque, categoriaId } = req.body;
      if (!nome || nome.trim() === "") return res.status(400).json({ message: "O nome do produto é obrigatório." });
      if (custo === undefined || custo < 0) return res.status(400).json({ message: "O custo não pode ser negativo." });
      if (!categoriaId) return res.status(400).json({ message: "A categoria é obrigatória." });
      const { rows } = await pool.query(
        `UPDATE produtos SET nome=$1, custo=$2, quantidade_estoque=$3, categoria_id=$4
         WHERE id=$5
         RETURNING id, nome, custo, quantidade_estoque AS "quantidadeEstoque", categoria_id AS "categoriaId"`,
        [nome.trim(), Number(custo), Number(quantidadeEstoque || 0), Number(categoriaId), id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "Produto não encontrado." });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rowCount } = await pool.query(`DELETE FROM produtos WHERE id=$1`, [id]);
      if (rowCount === 0) return res.status(404).json({ message: "Produto não encontrado." });
      res.json({ message: "Produto excluído com sucesso." });
    } catch (err: any) {
      if (err.code === "23503") return res.status(400).json({ message: "Produto possui pedidos ou despesas vinculados e não pode ser excluído." });
      res.status(500).json({ message: err.message });
    }
  });

  // ================================================================
  // EXPENSES CRUD
  // ================================================================
  app.get("/api/expenses", async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT d.id, d.tipo, d.descricao, d.produto_id AS "produtoId",
               p.nome AS "produtoNome", d.fornecedor_id AS "fornecedorId",
               f.nome AS "fornecedorNome", d.quantidade, d.custo_unitario AS "custoUnitario",
               d.valor, d.data
        FROM despesas d
        LEFT JOIN produtos p ON p.id = d.produto_id
        LEFT JOIN fornecedores f ON f.id = d.fornecedor_id
        ORDER BY d.data DESC
      `);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/expenses", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { tipo, descricao, produtoId, fornecedorId, quantidade, custoUnitario, valor, data, newProduct } = req.body;

      if (!tipo || (tipo !== "PRODUTO" && tipo !== "GERAL")) {
        return res.status(400).json({ message: "Tipo de lançamento inválido." });
      }

      let resolvedProdutoId: number | null = null;
      let resolvedDescricao = descricao ? descricao.trim() : "";
      let resolvedValor: number = 0;
      let resolvedQuantidade: number | null = null;
      let resolvedCustoUnitario: number | null = null;
      const resolvedFornecedorId: number | null = fornecedorId ? parseInt(fornecedorId) : null;

      if (tipo === "PRODUTO") {
        const qty = parseInt(quantidade);
        const unitCost = parseFloat(custoUnitario);
        if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: "Quantidade deve ser maior que zero." });
        if (isNaN(unitCost) || unitCost < 0) return res.status(400).json({ message: "Custo unitário inválido." });

        let pId: number;

        // Criar novo produto on-the-fly
        if (produtoId === "new" && newProduct && newProduct.nome) {
          const catId = parseInt(newProduct.categoriaId);
          if (!newProduct.nome.trim() || isNaN(catId)) {
            return res.status(400).json({ message: "Nome e categoria do novo produto são obrigatórios." });
          }
          const { rows: newProdRows } = await client.query(
            `INSERT INTO produtos (nome, custo, quantidade_estoque, categoria_id) VALUES ($1,$2,0,$3) RETURNING id, nome`,
            [newProduct.nome.trim(), unitCost, catId]
          );
          pId = newProdRows[0].id;
        } else {
          pId = parseInt(produtoId);
          if (isNaN(pId)) return res.status(400).json({ message: "Produto inválido." });
        }

        // Atualiza estoque e custo do produto
        const { rows: prodRows } = await client.query(
          `UPDATE produtos SET quantidade_estoque = quantidade_estoque + $1, custo = $2 WHERE id = $3 RETURNING nome`,
          [qty, unitCost, pId]
        );
        if (prodRows.length === 0) return res.status(404).json({ message: "Produto não encontrado." });

        resolvedProdutoId = pId;
        resolvedDescricao = `Entrada de Estoque: ${prodRows[0].nome}`;
        resolvedQuantidade = qty;
        resolvedCustoUnitario = unitCost;
        resolvedValor = Number((qty * unitCost).toFixed(2));
      } else {
        const numValor = parseFloat(valor);
        if (isNaN(numValor) || numValor < 0) return res.status(400).json({ message: "Valor inválido." });
        if (!resolvedDescricao) return res.status(400).json({ message: "Descrição é obrigatória." });
        resolvedValor = numValor;
      }

      const resolvedData = data ? new Date(data).toISOString() : new Date().toISOString();

      const { rows } = await client.query(
        `INSERT INTO despesas (tipo, descricao, produto_id, fornecedor_id, quantidade, custo_unitario, valor, data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [tipo, resolvedDescricao, resolvedProdutoId, resolvedFornecedorId, resolvedQuantidade, resolvedCustoUnitario, resolvedValor, resolvedData]
      );

      await client.query("COMMIT");
      res.status(201).json(rows[0]);
    } catch (err: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ message: err.message });
    } finally {
      client.release();
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const id = parseInt(req.params.id);

      const { rows: expRows } = await client.query(`SELECT * FROM despesas WHERE id=$1`, [id]);
      if (expRows.length === 0) return res.status(404).json({ message: "Lançamento não encontrado." });

      const expense = expRows[0];

      // Estornar estoque se for entrada de produto
      if (expense.tipo === "PRODUTO" && expense.produto_id && expense.quantidade) {
        await client.query(
          `UPDATE produtos SET quantidade_estoque = GREATEST(0, quantidade_estoque - $1) WHERE id = $2`,
          [expense.quantidade, expense.produto_id]
        );
      }

      await client.query(`DELETE FROM despesas WHERE id=$1`, [id]);
      await client.query("COMMIT");
      res.json({ message: "Lançamento excluído com sucesso." });
    } catch (err: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ message: err.message });
    } finally {
      client.release();
    }
  });

  // ================================================================
  // ORDERS CRUD
  // ================================================================
  app.get("/api/orders", async (req, res) => {
    try {
      const marketplaceId = req.query.marketplaceId ? parseInt(req.query.marketplaceId as string) : null;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
      const produtoId = req.query.produtoId ? parseInt(req.query.produtoId as string) : null;
      const startDate = req.query.startDate as string || null;
      const endDate = req.query.endDate as string || null;

      let query = `
        SELECT p.id, p.marketplace_id AS "marketplaceId", m.nome AS "marketplaceNome",
               p.comissao_tipo AS "comissaoTipo", p.comissao_valor AS "comissaoValor",
               p.comissao_informada AS "comissaoInformada", p.frete, p.taxa_fixa AS "taxaFixa",
               p.valor_venda AS "valorVenda", p.lucro_bruto AS "lucroBruto",
               p.lucro_liquido AS "lucroLiquido", p.margem_bruta AS "margemBruta",
               p.margem_liquida AS "margemLiquida", p.data_pedido AS "dataPedido",
               json_agg(json_build_object(
                 'produtoId', pi.produto_id,
                 'produtoNome', pr.nome,
                 'produtoCusto', pr.custo,
                 'categoriaId', pi.categoria_id,
                 'categoriaNome', c.nome,
                 'quantidade', pi.quantidade,
                 'valorVenda', pi.valor_venda
               )) AS items
        FROM pedidos p
        LEFT JOIN marketplaces m ON m.id = p.marketplace_id
        LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
        LEFT JOIN produtos pr ON pr.id = pi.produto_id
        LEFT JOIN categorias c ON c.id = pi.categoria_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (marketplaceId) { params.push(marketplaceId); query += ` AND p.marketplace_id = $${params.length}`; }
      if (categoryId) { params.push(categoryId); query += ` AND pi.categoria_id = $${params.length}`; }
      if (produtoId) { params.push(produtoId); query += ` AND pi.produto_id = $${params.length}`; }
      if (startDate) { params.push(startDate); query += ` AND p.data_pedido >= $${params.length}`; }
      if (endDate) { params.push(endDate); query += ` AND p.data_pedido <= $${params.length}`; }

      query += ` GROUP BY p.id, m.nome ORDER BY p.data_pedido DESC`;

      const { rows } = await pool.query(query, params);

      // Formata para o frontend: produtoNome do primeiro item
      const result = rows.map(row => {
        const items = row.items || [];
        const firstItem = items[0] || {};
        return {
          ...row,
          produtoId: firstItem.produtoId,
          produtoNome: items.length === 1
            ? firstItem.produtoNome
            : items.length > 1
              ? `${firstItem.produtoNome} (+ ${items.length - 1} item(ns))`
              : "Sem Itens",
          produtoCusto: firstItem.produtoCusto || 0,
          categoriaId: firstItem.categoriaId,
          categoriaNome: firstItem.categoriaNome || "Desconhecida",
        };
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const {
        items, produtoId, marketplaceId, quantidade, valorVenda,
        comissaoTipo, comissaoInformada, frete, taxaFixa
      } = req.body;

      if (!marketplaceId) return res.status(400).json({ message: "O marketplace é obrigatório." });

      const mktCheck = await client.query(`SELECT id FROM marketplaces WHERE id=$1`, [parseInt(marketplaceId)]);
      if (mktCheck.rows.length === 0) return res.status(404).json({ message: "Marketplace não encontrado." });

      if (frete < 0) return res.status(400).json({ message: "O frete não pode ser negativo." });
      if (taxaFixa < 0) return res.status(400).json({ message: "A taxa fixa não pode ser negativa." });
      if (comissaoInformada < 0) return res.status(400).json({ message: "A comissão não pode ser negativa." });

      let orderItems: any[] = [];
      if (items && Array.isArray(items) && items.length > 0) {
        orderItems = items;
      } else {
        if (!produtoId) return res.status(400).json({ message: "O produto é obrigatório." });
        if (!quantidade || quantidade <= 0) return res.status(400).json({ message: "Quantidade deve ser maior que zero." });
        orderItems = [{ produtoId, quantidade, valorVenda }];
      }

      let totalCustoSKU = 0;
      let totalValorVenda = 0;
      const validatedItems: any[] = [];

      for (const item of orderItems) {
        const pId = parseInt(item.produtoId);
        const qty = parseInt(item.quantidade);
        const sVal = parseFloat(item.valorVenda);
        if (isNaN(pId) || isNaN(qty) || qty <= 0 || isNaN(sVal) || sVal < 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Dados de item inválidos." });
        }

        const { rows: prodRows } = await client.query(
          `SELECT id, nome, custo, quantidade_estoque, categoria_id FROM produtos WHERE id=$1 FOR UPDATE`,
          [pId]
        );
        if (prodRows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ message: `Produto com ID ${pId} não encontrado.` });
        }
        const prod = prodRows[0];
        if (prod.quantidade_estoque < qty) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: `Estoque insuficiente para "${prod.nome}". Disponível: ${prod.quantidade_estoque}. Solicitado: ${qty}.` });
        }

        await client.query(`UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id = $2`, [qty, pId]);

        totalCustoSKU += prod.custo * qty;
        totalValorVenda += sVal;
        validatedItems.push({ produtoId: pId, quantidade: qty, valorVenda: sVal, categoriaId: prod.categoria_id });
      }

      const fin = calcFinancials(totalValorVenda, totalCustoSKU, Number(frete), Number(taxaFixa), comissaoTipo, Number(comissaoInformada));

      const { rows: orderRows } = await client.query(
        `INSERT INTO pedidos (marketplace_id, comissao_tipo, comissao_valor, comissao_informada, frete, taxa_fixa,
          valor_venda, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [parseInt(marketplaceId), comissaoTipo, fin.comissaoValor, Number(comissaoInformada),
          Number(frete), Number(taxaFixa), totalValorVenda, fin.lucroBruto,
          fin.lucroLiquido, fin.margemBruta, fin.margemLiquida]
      );
      const orderId = orderRows[0].id;

      for (const item of validatedItems) {
        await client.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, categoria_id, quantidade, valor_venda) VALUES ($1,$2,$3,$4,$5)`,
          [orderId, item.produtoId, item.categoriaId, item.quantidade, item.valorVenda]
        );
      }

      await client.query("COMMIT");
      res.status(201).json({ id: orderId, message: "Pedido registrado com sucesso." });
    } catch (err: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ message: err.message });
    } finally {
      client.release();
    }
  });

  app.put("/api/orders/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const orderId = parseInt(req.params.id);
      const { items, marketplaceId, comissaoTipo, comissaoInformada, frete, taxaFixa } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "O pedido deve conter pelo menos um item." });

      const { rows: oldItemRows } = await client.query(`SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id=$1`, [orderId]);
      if (oldItemRows.length === 0) return res.status(404).json({ message: "Pedido não encontrado." });

      // Estorna estoque antigo
      for (const oi of oldItemRows) {
        await client.query(`UPDATE produtos SET quantidade_estoque = quantidade_estoque + $1 WHERE id = $2`, [oi.quantidade, oi.produto_id]);
      }

      let totalCustoSKU = 0;
      let totalValorVenda = 0;
      const validatedItems: any[] = [];

      for (const item of items) {
        const pId = parseInt(item.produtoId);
        const qty = parseInt(item.quantidade);
        const sVal = parseFloat(item.valorVenda);
        if (isNaN(pId) || isNaN(qty) || qty <= 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Dados de item inválidos." });
        }

        const { rows: prodRows } = await client.query(
          `SELECT id, nome, custo, quantidade_estoque, categoria_id FROM produtos WHERE id=$1 FOR UPDATE`, [pId]
        );
        if (prodRows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ message: `Produto ${pId} não encontrado.` }); }
        const prod = prodRows[0];
        if (prod.quantidade_estoque < qty) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: `Estoque insuficiente para "${prod.nome}". Disponível: ${prod.quantidade_estoque}. Solicitado: ${qty}.` });
        }

        await client.query(`UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id = $2`, [qty, pId]);
        totalCustoSKU += prod.custo * qty;
        totalValorVenda += sVal;
        validatedItems.push({ produtoId: pId, quantidade: qty, valorVenda: sVal, categoriaId: prod.categoria_id });
      }

      const fin = calcFinancials(totalValorVenda, totalCustoSKU, Number(frete), Number(taxaFixa), comissaoTipo, Number(comissaoInformada));

      await client.query(
        `UPDATE pedidos SET marketplace_id=$1, comissao_tipo=$2, comissao_valor=$3, comissao_informada=$4,
          frete=$5, taxa_fixa=$6, valor_venda=$7, lucro_bruto=$8, lucro_liquido=$9, margem_bruta=$10, margem_liquida=$11
         WHERE id=$12`,
        [parseInt(marketplaceId), comissaoTipo, fin.comissaoValor, Number(comissaoInformada),
          Number(frete), Number(taxaFixa), totalValorVenda, fin.lucroBruto,
          fin.lucroLiquido, fin.margemBruta, fin.margemLiquida, orderId]
      );

      await client.query(`DELETE FROM pedido_itens WHERE pedido_id=$1`, [orderId]);
      for (const item of validatedItems) {
        await client.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, categoria_id, quantidade, valor_venda) VALUES ($1,$2,$3,$4,$5)`,
          [orderId, item.produtoId, item.categoriaId, item.quantidade, item.valorVenda]
        );
      }

      await client.query("COMMIT");
      res.json({ id: orderId, message: "Pedido atualizado com sucesso." });
    } catch (err: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ message: err.message });
    } finally {
      client.release();
    }
  });

  app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const orderId = parseInt(req.params.id);

      const { rows: itemRows } = await client.query(`SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id=$1`, [orderId]);
      if (itemRows.length === 0) return res.status(404).json({ message: "Pedido não encontrado." });

      // Estorna estoque
      for (const item of itemRows) {
        await client.query(`UPDATE produtos SET quantidade_estoque = quantidade_estoque + $1 WHERE id = $2`, [item.quantidade, item.produto_id]);
      }

      await client.query(`DELETE FROM pedidos WHERE id=$1`, [orderId]);
      await client.query("COMMIT");
      res.json({ message: "Pedido estornado e excluído com sucesso. Estoque restaurado." });
    } catch (err: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ message: err.message });
    } finally {
      client.release();
    }
  });

  // ================================================================
  // DASHBOARD
  // ================================================================
  app.get("/api/dashboard", async (req, res) => {
    try {
      const { rows: orderStats } = await pool.query(`
        SELECT
          COUNT(*) AS "totalPedidos",
          COALESCE(SUM(valor_venda),0) AS "totalVendido",
          COALESCE(SUM(lucro_bruto),0) AS "lucroBrutoTotal",
          COALESCE(SUM(lucro_liquido),0) AS "lucroLiquidoTotal",
          COALESCE(AVG(NULLIF(margem_bruta,0)),0) AS "margemBrutaMedia",
          COALESCE(AVG(NULLIF(margem_liquida,0)),0) AS "margemLiquidaMedia"
        FROM pedidos
      `);

      const { rows: itemStats } = await pool.query(`
        SELECT COALESCE(SUM(pi.quantidade),0) AS "totalQtdVendida"
        FROM pedido_itens pi
      `);

      const { rows: prodStats } = await pool.query(`
        SELECT COUNT(*) AS "produtosCadastrados",
               COALESCE(SUM(quantidade_estoque),0) AS "totalEstoque",
               COUNT(*) FILTER (WHERE quantidade_estoque = 0) AS "semEstoque",
               COUNT(*) FILTER (WHERE quantidade_estoque > 0 AND quantidade_estoque <= 5) AS "estoqueBaixo"
        FROM produtos
      `);

      const { rows: catStats } = await pool.query(`SELECT COUNT(*) AS "categoriasCount" FROM categorias`);
      const { rows: mktCount } = await pool.query(`SELECT COUNT(*) AS "marketplacesCount" FROM marketplaces`);

      const s = orderStats[0];
      const totalVendido = Number(s.totalVendido);
      const totalPedidos = Number(s.totalPedidos);

      // Top products
      const { rows: topProducts } = await pool.query(`
        SELECT pr.nome AS "produtoNome",
               SUM(pi.quantidade) AS "totalVendido",
               SUM(pi.quantidade * pi.valor_venda) AS "receitaTotal"
        FROM pedido_itens pi
        JOIN produtos pr ON pr.id = pi.produto_id
        GROUP BY pr.id, pr.nome
        ORDER BY "totalVendido" DESC
        LIMIT 5
      `);

      // Margins by category
      const { rows: marginsByCategory } = await pool.query(`
        SELECT c.nome AS "categoria",
               COALESCE(AVG(p.margem_bruta),0) AS "margemBruta",
               COALESCE(AVG(p.margem_liquida),0) AS "margemLiquida"
        FROM pedidos p
        JOIN pedido_itens pi ON pi.pedido_id = p.id
        JOIN categorias c ON c.id = pi.categoria_id
        GROUP BY c.id, c.nome
        ORDER BY "margemLiquida" DESC
      `);

      // Stats by marketplace
      const { rows: mktStats } = await pool.query(`
        SELECT m.nome AS "marketplace",
               COUNT(p.id) AS "totalPedidos",
               COALESCE(SUM(p.valor_venda),0) AS "totalVendido",
               COALESCE(SUM(p.lucro_liquido),0) AS "lucroLiquido"
        FROM pedidos p
        JOIN marketplaces m ON m.id = p.marketplace_id
        GROUP BY m.id, m.nome
        ORDER BY "totalVendido" DESC
      `);

      // Monthly evolution (last 6 months)
      const { rows: monthlyEvolution } = await pool.query(`
        SELECT TO_CHAR(data_pedido, 'YYYY-MM') AS "mes",
               TO_CHAR(data_pedido, 'Mon/YY') AS "label",
               COALESCE(SUM(valor_venda),0) AS "vendas",
               COALESCE(SUM(lucro_liquido),0) AS "lucro",
               COUNT(*) AS "pedidos"
        FROM pedidos
        WHERE data_pedido >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(data_pedido, 'YYYY-MM'), TO_CHAR(data_pedido, 'Mon/YY')
        ORDER BY "mes"
      `);

      res.json({
        indicators: {
          totalVendido,
          totalPedidos,
          lucroBrutoTotal: Number(s.lucroBrutoTotal),
          lucroLiquidoTotal: Number(s.lucroLiquidoTotal),
          margemBrutaMedia: Number(Number(s.margemBrutaMedia).toFixed(2)),
          margemLiquidaMedia: Number(Number(s.margemLiquidaMedia).toFixed(2)),
          ticketMedio: totalPedidos > 0 ? Number((totalVendido / totalPedidos).toFixed(2)) : 0,
          totalQtdVendida: Number(itemStats[0].totalQtdVendida),
          produtosCadastrados: Number(prodStats[0].produtosCadastrados),
          totalEstoque: Number(prodStats[0].totalEstoque),
          categoriasCount: Number(catStats[0].categoriasCount),
          marketplacesCount: Number(mktCount[0].marketplacesCount),
          semEstoque: Number(prodStats[0].semEstoque),
          estoqueBaixo: Number(prodStats[0].estoqueBaixo),
        },
        topProducts,
        marginsByCategory,
        mktStats,
        monthlyEvolution
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ================================================================
  // FRONTEND STATIC / VITE DEV
  // ================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, resStatic) => {
      resStatic.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Servidor rodando na porta ${PORT}`);
    console.log(`>>> Conectado ao Supabase PostgreSQL`);
  });
}

startServer();
