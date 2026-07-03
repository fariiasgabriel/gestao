import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Set up simple local database persistence in db.json
const DB_FILE = path.join(process.cwd(), "db.json");

interface Category {
  id: number;
  nome: string;
}

interface Marketplace {
  id: number;
  nome: string;
}

interface Product {
  id: number;
  nome: string;
  custo: number;
  quantidadeEstoque: number;
  categoriaId: number;
}

interface OrderItem {
  produtoId: number;
  quantidade: number;
  valorVenda: number;
  categoriaId: number;
  produtoNome?: string;
  produtoCusto?: number;
}

interface Order {
  id: number;
  produtoId: number;
  categoriaId: number;
  marketplaceId: number;
  quantidade: number;
  valorVenda: number;
  comissaoTipo: "PERCENTUAL" | "VALOR";
  comissaoValor: number; // For percentual, this will be calculated or stored
  comissaoInformada: number; // Value input by user (e.g. 10 for 10% or R$10)
  frete: number;
  taxaFixa: number;
  lucroBruto: number;
  lucroLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  dataPedido: string;
  items?: OrderItem[];
}

interface Supplier {
  id: number;
  nome: string;
  contato?: string;
  telefone?: string;
  cnpj?: string;
}

interface Expense {
  id: number;
  tipo: "PRODUTO" | "GERAL";
  descricao: string;
  produtoId?: number;
  fornecedorId?: number;
  quantidade?: number;
  custoUnitario?: number;
  valor: number;
  data: string;
}

interface Database {
  categories: Category[];
  marketplaces: Marketplace[];
  products: Product[];
  orders: Order[];
  expenses?: Expense[];
  suppliers?: Supplier[];
}

const DEFAULT_DB: Database = {
  categories: [
    { id: 1, nome: "Eletrônicos" },
    { id: 2, nome: "Eletrodomésticos" },
    { id: 3, nome: "Moda & Calçados" },
    { id: 4, nome: "Casa & Decoração" },
    { id: 5, nome: "Esportes & Lazer" }
  ],
  marketplaces: [
    { id: 1, nome: "Mercado Livre" },
    { id: 2, nome: "Shopee" },
    { id: 3, nome: "Amazon" },
    { id: 4, nome: "Magalu" },
    { id: 5, nome: "Shein" }
  ],
  products: [
    { id: 1, nome: "Smartphone Android 128GB", custo: 800.00, quantidadeEstoque: 25, categoriaId: 1 },
    { id: 2, nome: "Fone de Ouvido Bluetooth", custo: 45.00, quantidadeEstoque: 120, categoriaId: 1 },
    { id: 3, nome: "Cafeteira Expresso Italiana", custo: 220.00, quantidadeEstoque: 15, categoriaId: 2 },
    { id: 4, nome: "Camiseta Algodão Pima Premium", custo: 35.00, quantidadeEstoque: 200, categoriaId: 3 },
    { id: 5, nome: "Cadeira Gamer Ergonômica", custo: 350.00, quantidadeEstoque: 8, categoriaId: 4 },
    { id: 6, nome: "Smartwatch Sport GPS", custo: 150.00, quantidadeEstoque: 45, categoriaId: 1 },
    { id: 7, nome: "Teclado Mecânico RGB Hot-swap", custo: 110.00, quantidadeEstoque: 32, categoriaId: 1 },
    { id: 8, nome: "Jogo de Panelas de Cerâmica (5pçs)", custo: 180.00, quantidadeEstoque: 14, categoriaId: 4 },
    { id: 9, nome: "Mochila Impermeável Urban", custo: 48.00, quantidadeEstoque: 60, categoriaId: 3 },
    { id: 10, nome: "Garrafa Térmica Inox 1L", custo: 30.00, quantidadeEstoque: 95, categoriaId: 5 }
  ],
  orders: [],
  expenses: [],
  suppliers: [
    { id: 1, nome: "Distribuidora Eletrônica Sul", contato: "Carlos Silva", telefone: "(11) 98765-4321", cnpj: "12.345.678/0001-90" },
    { id: 2, nome: "Importadora Global Ltda", contato: "Mariana Souza", telefone: "(21) 97654-3210", cnpj: "98.765.432/0001-09" },
    { id: 3, nome: "Tecnologia e Varejo Brasil", contato: "Roberto Alencar", telefone: "(31) 96543-2109", cnpj: "45.678.901/0001-23" }
  ]
};

const seedExpenses = (): Expense[] => {
  const expenses: Expense[] = [];
  const baseTime = new Date();
  
  // Seed some general expenses spanning the last 3 months
  const generalSeeds = [
    { desc: "Aluguel do Galpão de Distribuição", valor: 1500, daysAgo: 65 },
    { desc: "Campanha Meta Ads - Coleção Inverno", valor: 650, daysAgo: 58 },
    { desc: "Kit de Caixas de Papelão e Embalagens", valor: 180, daysAgo: 45 },
    { desc: "Licença ERP Bling / Tiny Hub", valor: 140, daysAgo: 35 },
    { desc: "Aluguel do Galpão de Distribuição", valor: 1500, daysAgo: 32 },
    { desc: "Campanhas Google Shopping", valor: 800, daysAgo: 28 },
    { desc: "Investimento em Sacolas Kraft Premium", valor: 320, daysAgo: 18 },
    { desc: "Aluguel do Galpão de Distribuição", valor: 1500, daysAgo: 2 },
    { desc: "Serviço de Coleta de Encomendas Meli", valor: 250, daysAgo: 1 }
  ];

  // Seed some product stock inflows spanning the last 2 months
  const productSeeds = [
    { prodId: 2, qty: 60, custoUnit: 42, daysAgo: 60 },  // Fone Bluetooth
    { prodId: 4, qty: 150, custoUnit: 32, daysAgo: 40 }, // Camiseta Algodão
    { prodId: 7, qty: 30, custoUnit: 105, daysAgo: 25 }, // Teclado Mecânico
    { prodId: 10, qty: 80, custoUnit: 28, daysAgo: 12 }  // Garrafa Térmica
  ];

  let id = 1;

  generalSeeds.forEach(item => {
    const d = new Date(baseTime);
    d.setDate(d.getDate() - item.daysAgo);
    expenses.push({
      id: id++,
      tipo: "GERAL",
      descricao: item.desc,
      valor: item.valor,
      data: d.toISOString()
    });
  });

  productSeeds.forEach(item => {
    const d = new Date(baseTime);
    d.setDate(d.getDate() - item.daysAgo);
    const prod = DEFAULT_DB.products.find(p => p.id === item.prodId);
    const prodName = prod ? prod.nome : "Produto Importado";
    expenses.push({
      id: id++,
      tipo: "PRODUTO",
      descricao: `Entrada de Estoque: ${prodName}`,
      produtoId: item.prodId,
      quantidade: item.qty,
      custoUnitario: item.custoUnit,
      valor: Number((item.qty * item.custoUnit).toFixed(2)),
      data: d.toISOString()
    });
  });

  return expenses;
};

// Seed historical orders to make dashboard gorgeous right away
const seedOrders = () => {
  const orders: Order[] = [];
  const baseTime = new Date();
  
  // Helper to calculate financials
  const calculateFinancials = (
    custo: number,
    quantidade: number,
    valorVenda: number,
    frete: number,
    taxaFixa: number,
    comissaoTipo: "PERCENTUAL" | "VALOR",
    comissaoInformada: number
  ) => {
    let comissaoValor = 0;
    if (comissaoTipo === "PERCENTUAL") {
      comissaoValor = Number(((comissaoInformada / 100) * valorVenda).toFixed(2));
    } else {
      comissaoValor = comissaoInformada;
    }

    const lucroBruto = Number((valorVenda - frete - taxaFixa - comissaoValor).toFixed(2));
    const lucroLiquido = Number((lucroBruto - (custo * quantidade)).toFixed(2));
    const margemBruta = valorVenda > 0 ? Number(((lucroBruto / valorVenda) * 100).toFixed(2)) : 0;
    const margemLiquida = valorVenda > 0 ? Number(((lucroLiquido / valorVenda) * 100).toFixed(2)) : 0;

    return { comissaoValor, lucroBruto, lucroLiquido, margemBruta, margemLiquida };
  };

  // 12 mock orders across different dates (last 3 months)
  const orderSeedsData = [
    { prodId: 1, catId: 1, mktId: 1, qty: 1, venda: 1200, frete: 40, taxa: 5, cTipo: "PERCENTUAL" as const, cVal: 16, daysAgo: 50 },
    { prodId: 2, catId: 1, mktId: 2, qty: 3, venda: 270, frete: 15, taxa: 3, cTipo: "VALOR" as const, cVal: 30, daysAgo: 45 },
    { prodId: 3, catId: 2, mktId: 3, qty: 1, venda: 450, frete: 35, taxa: 10, cTipo: "PERCENTUAL" as const, cVal: 15, daysAgo: 38 },
    { prodId: 4, catId: 3, mktId: 2, qty: 5, venda: 375, frete: 20, taxa: 5, cTipo: "PERCENTUAL" as const, cVal: 18, daysAgo: 30 },
    { prodId: 5, catId: 4, mktId: 1, qty: 1, venda: 699, frete: 50, taxa: 15, cTipo: "PERCENTUAL" as const, cVal: 16, daysAgo: 25 },
    { prodId: 6, catId: 1, mktId: 4, qty: 2, venda: 580, frete: 25, taxa: 5, cTipo: "VALOR" as const, cVal: 60, daysAgo: 18 },
    { prodId: 7, catId: 1, mktId: 1, qty: 1, venda: 250, frete: 15, taxa: 5, cTipo: "PERCENTUAL" as const, cVal: 16, daysAgo: 14 },
    { prodId: 8, catId: 4, mktId: 3, qty: 2, venda: 600, frete: 40, taxa: 10, cTipo: "PERCENTUAL" as const, cVal: 15, daysAgo: 10 },
    { prodId: 9, catId: 3, mktId: 5, qty: 4, venda: 320, frete: 18, taxa: 4, cTipo: "PERCENTUAL" as const, cVal: 20, daysAgo: 7 },
    { prodId: 10, catId: 5, mktId: 2, qty: 3, venda: 210, frete: 12, taxa: 3, cTipo: "VALOR" as const, cVal: 21, daysAgo: 3 },
    { prodId: 1, catId: 1, mktId: 3, qty: 1, venda: 1250, frete: 0, taxa: 12, cTipo: "PERCENTUAL" as const, cVal: 15, daysAgo: 1 },
    { prodId: 3, catId: 2, mktId: 1, qty: 1, venda: 440, frete: 28, taxa: 5, cTipo: "PERCENTUAL" as const, cVal: 16, daysAgo: 0 }
  ];

  orderSeedsData.forEach((item, index) => {
    const prod = DEFAULT_DB.products.find(p => p.id === item.prodId);
    if (prod) {
      const fin = calculateFinancials(
        prod.custo,
        item.qty,
        item.venda,
        item.frete,
        item.taxa,
        item.cTipo,
        item.cVal
      );

      const d = new Date(baseTime);
      d.setDate(d.getDate() - item.daysAgo);

      orders.push({
        id: index + 1,
        produtoId: item.prodId,
        categoriaId: item.catId,
        marketplaceId: item.mktId,
        quantidade: item.qty,
        valorVenda: item.venda,
        comissaoTipo: item.cTipo,
        comissaoValor: fin.comissaoValor,
        comissaoInformada: item.cVal,
        frete: item.frete,
        taxaFixa: item.taxa,
        lucroBruto: fin.lucroBruto,
        lucroLiquido: fin.lucroLiquido,
        margemBruta: fin.margemBruta,
        margemLiquida: fin.margemLiquida,
        dataPedido: d.toISOString()
      });

      // Adjust stock in the mock list
      prod.quantidadeEstoque = Math.max(0, prod.quantidadeEstoque - item.qty);
    }
  });

  return orders;
};

// Initial DB configuration
if (!fs.existsSync(DB_FILE)) {
  const initialDb = { ...DEFAULT_DB };
  initialDb.orders = seedOrders();
  initialDb.expenses = seedExpenses();
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf8");
}

const getDatabase = (): Database => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    const db = JSON.parse(data);
    let changed = false;
    if (!db.expenses) {
      db.expenses = seedExpenses();
      changed = true;
    }
    if (!db.suppliers) {
      db.suppliers = DEFAULT_DB.suppliers || [];
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    }
    return db;
  } catch (err) {
    return DEFAULT_DB;
  }
};

const saveDatabase = (db: Database) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
};

const ensureOrderItems = (o: Order, db: Database): Order & { items: OrderItem[] } => {
  if (!o.items || o.items.length === 0) {
    const prod = db.products.find(p => p.id === o.produtoId);
    o.items = [
      {
        produtoId: o.produtoId,
        quantidade: o.quantidade,
        valorVenda: o.valorVenda,
        categoriaId: o.categoriaId || (prod ? prod.categoriaId : 0),
        produtoNome: prod ? prod.nome : "Produto Removido",
        produtoCusto: prod ? prod.custo : 0
      }
    ];
  }
  return o as Order & { items: OrderItem[] };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security Token Middleware (Simulating JWT Authentication)
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Acesso negado. Token não fornecido." });
      return;
    }

    if (token === "mock-jwt-token-admin") {
      next();
    } else {
      res.status(403).json({ message: "Token inválido ou expirado." });
    }
  };

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "Gabriel" && password === "201981") {
      res.json({
        token: "mock-jwt-token-admin",
        username: "Gabriel",
        role: "ADMIN"
      });
    } else {
      res.status(401).json({ message: "Usuário ou senha inválidos." });
    }
  });

  // Categories CRUD
  app.get("/api/categories", (req, res) => {
    const db = getDatabase();
    const search = (req.query.search as string || "").toLowerCase();
    let result = db.categories;

    if (search) {
      result = result.filter(c => c.nome.toLowerCase().includes(search));
    }

    res.json(result);
  });

  app.post("/api/categories", authenticateToken, (req, res) => {
    const { nome } = req.body;
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "O nome da categoria é obrigatório." });
      return;
    }

    const db = getDatabase();
    const newId = db.categories.length > 0 ? Math.max(...db.categories.map(c => c.id)) + 1 : 1;
    const newCategory: Category = { id: newId, nome: nome.trim() };
    
    db.categories.push(newCategory);
    saveDatabase(db);
    res.status(201).json(newCategory);
  });

  app.put("/api/categories/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { nome } = req.body;
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "O nome da categoria é obrigatório." });
      return;
    }

    const db = getDatabase();
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    db.categories[index].nome = nome.trim();
    saveDatabase(db);
    res.json(db.categories[index]);
  });

  app.delete("/api/categories/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDatabase();

    // Soft delete / disassociate category from products
    db.products = db.products.map(p => {
      if (p.categoriaId === id) {
        return { ...p, categoriaId: 0 };
      }
      return p;
    });

    const filtered = db.categories.filter(c => c.id !== id);
    if (filtered.length === db.categories.length) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    db.categories = filtered;
    saveDatabase(db);
    res.json({ message: "Categoria excluída com sucesso." });
  });

  // Marketplaces CRUD
  app.get("/api/marketplaces", (req, res) => {
    const db = getDatabase();
    const search = (req.query.search as string || "").toLowerCase();
    let result = db.marketplaces;

    if (search) {
      result = result.filter(m => m.nome.toLowerCase().includes(search));
    }

    res.json(result);
  });

  app.post("/api/marketplaces", authenticateToken, (req, res) => {
    const { nome } = req.body;
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "O nome do marketplace é obrigatório." });
      return;
    }

    const db = getDatabase();
    const newId = db.marketplaces.length > 0 ? Math.max(...db.marketplaces.map(m => m.id)) + 1 : 1;
    const newMkt: Marketplace = { id: newId, nome: nome.trim() };

    db.marketplaces.push(newMkt);
    saveDatabase(db);
    res.status(201).json(newMkt);
  });

  app.put("/api/marketplaces/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { nome } = req.body;
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "O nome do marketplace é obrigatório." });
      return;
    }

    const db = getDatabase();
    const index = db.marketplaces.findIndex(m => m.id === id);
    if (index === -1) {
      res.status(404).json({ message: "Marketplace não encontrado." });
      return;
    }

    db.marketplaces[index].nome = nome.trim();
    saveDatabase(db);
    res.json(db.marketplaces[index]);
  });

  app.delete("/api/marketplaces/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDatabase();

    const filtered = db.marketplaces.filter(m => m.id !== id);
    if (filtered.length === db.marketplaces.length) {
      res.status(404).json({ message: "Marketplace não encontrado." });
      return;
    }

    db.marketplaces = filtered;
    saveDatabase(db);
    res.json({ message: "Marketplace excluído com sucesso." });
  });

  // Suppliers CRUD
  app.get("/api/suppliers", (req, res) => {
    const db = getDatabase();
    const search = (req.query.search as string || "").toLowerCase();
    let result = db.suppliers || [];

    if (search) {
      result = result.filter(s => 
        s.nome.toLowerCase().includes(search) || 
        (s.contato && s.contato.toLowerCase().includes(search))
      );
    }

    res.json(result);
  });

  app.post("/api/suppliers", authenticateToken, (req, res) => {
    const { nome, contato, telefone, cnpj } = req.body;
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "O nome do fornecedor é obrigatório." });
      return;
    }

    const db = getDatabase();
    if (!db.suppliers) db.suppliers = [];
    const newId = db.suppliers.length > 0 ? Math.max(...db.suppliers.map(s => s.id)) + 1 : 1;
    const newSupplier: Supplier = { 
      id: newId, 
      nome: nome.trim(), 
      contato: contato ? contato.trim() : undefined,
      telefone: telefone ? telefone.trim() : undefined,
      cnpj: cnpj ? cnpj.trim() : undefined
    };

    db.suppliers.push(newSupplier);
    saveDatabase(db);
    res.status(201).json(newSupplier);
  });

  app.put("/api/suppliers/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, contato, telefone, cnpj } = req.body;
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "O nome do fornecedor é obrigatório." });
      return;
    }

    const db = getDatabase();
    if (!db.suppliers) db.suppliers = [];
    const index = db.suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      res.status(404).json({ message: "Fornecedor não encontrado." });
      return;
    }

    db.suppliers[index] = {
      id,
      nome: nome.trim(),
      contato: contato ? contato.trim() : undefined,
      telefone: telefone ? telefone.trim() : undefined,
      cnpj: cnpj ? cnpj.trim() : undefined
    };
    saveDatabase(db);
    res.json(db.suppliers[index]);
  });

  app.delete("/api/suppliers/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDatabase();
    if (!db.suppliers) db.suppliers = [];

    const filtered = db.suppliers.filter(s => s.id !== id);
    if (filtered.length === db.suppliers.length) {
      res.status(404).json({ message: "Fornecedor não encontrado." });
      return;
    }

    db.suppliers = filtered;
    saveDatabase(db);
    res.json({ message: "Fornecedor excluído com sucesso." });
  });

  // Products CRUD
  app.get("/api/products", (req, res) => {
    const db = getDatabase();
    const search = (req.query.search as string || "").toLowerCase();
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    
    let result = db.products.map(p => {
      const category = db.categories.find(c => c.id === p.categoriaId);
      return {
        ...p,
        categoriaNome: category ? category.nome : "Desconhecida"
      };
    });

    if (search) {
      result = result.filter(p => p.nome.toLowerCase().includes(search));
    }
    if (categoryId) {
      result = result.filter(p => p.categoriaId === categoryId);
    }

    res.json(result);
  });

  app.post("/api/products", authenticateToken, (req, res) => {
    const { nome, custo, quantidadeEstoque, categoriaId } = req.body;
    
    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "Nome do produto é obrigatório." });
      return;
    }
    if (custo === undefined || custo < 0) {
      res.status(400).json({ message: "Custo do produto é obrigatório e não pode ser negativo." });
      return;
    }
    if (quantidadeEstoque === undefined || quantidadeEstoque < 0) {
      res.status(400).json({ message: "Quantidade em estoque é obrigatória e não pode ser negativa." });
      return;
    }
    if (!categoriaId) {
      res.status(400).json({ message: "Categoria é obrigatória." });
      return;
    }

    const db = getDatabase();
    const catExists = db.categories.some(c => c.id === parseInt(categoriaId));
    if (!catExists) {
      res.status(400).json({ message: "Categoria selecionada não é válida." });
      return;
    }

    const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
    const newProd: Product = {
      id: newId,
      nome: nome.trim(),
      custo: Number(custo),
      quantidadeEstoque: parseInt(quantidadeEstoque),
      categoriaId: parseInt(categoriaId)
    };

    db.products.push(newProd);
    saveDatabase(db);
    res.status(201).json(newProd);
  });

  app.put("/api/products/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, custo, quantidadeEstoque, categoriaId } = req.body;

    if (!nome || nome.trim() === "") {
      res.status(400).json({ message: "Nome do produto é obrigatório." });
      return;
    }
    if (custo === undefined || custo < 0) {
      res.status(400).json({ message: "Custo do produto é obrigatório e não pode ser negativo." });
      return;
    }
    if (quantidadeEstoque === undefined || quantidadeEstoque < 0) {
      res.status(400).json({ message: "Quantidade em estoque é obrigatória e não pode ser negativa." });
      return;
    }
    if (!categoriaId) {
      res.status(400).json({ message: "Categoria é obrigatória." });
      return;
    }

    const db = getDatabase();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) {
      res.status(404).json({ message: "Produto não encontrado." });
      return;
    }

    const catExists = db.categories.some(c => c.id === parseInt(categoriaId));
    if (!catExists) {
      res.status(400).json({ message: "Categoria selecionada não é válida." });
      return;
    }

    db.products[index] = {
      id,
      nome: nome.trim(),
      custo: Number(custo),
      quantidadeEstoque: parseInt(quantidadeEstoque),
      categoriaId: parseInt(categoriaId)
    };

    saveDatabase(db);
    res.json(db.products[index]);
  });

  app.delete("/api/products/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDatabase();

    const filtered = db.products.filter(p => p.id !== id);
    if (filtered.length === db.products.length) {
      res.status(404).json({ message: "Produto não encontrado." });
      return;
    }

    db.products = filtered;
    saveDatabase(db);
    res.json({ message: "Produto excluído com sucesso." });
  });

  // Expenses / Inflows CRUD
  app.get("/api/expenses", (req, res) => {
    const db = getDatabase();
    // Sort expenses by date descending
    const sortedExpenses = [...(db.expenses || [])].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    // Populate product name and supplier name if relevant
    const populated = sortedExpenses.map(exp => {
      const result: any = { ...exp };
      if (exp.produtoId) {
        const prod = db.products.find(p => p.id === exp.produtoId);
        result.produtoNome = prod ? prod.nome : "Produto Removido";
      }
      if (exp.fornecedorId) {
        const supp = (db.suppliers || []).find(s => s.id === exp.fornecedorId);
        result.fornecedorNome = supp ? supp.nome : "Fornecedor Removido";
      }
      return result;
    });

    res.json(populated);
  });

  app.post("/api/expenses", authenticateToken, (req, res) => {
    const { tipo, descricao, produtoId, fornecedorId, quantidade, custoUnitario, valor, data, newProduct } = req.body;

    if (!tipo || (tipo !== "PRODUTO" && tipo !== "GERAL")) {
      res.status(400).json({ message: "Tipo de lançamento inválido." });
      return;
    }

    if (tipo === "GERAL" && (!descricao || descricao.trim() === "")) {
      res.status(400).json({ message: "Descrição é obrigatória para despesas gerais." });
      return;
    }

    const db = getDatabase();
    let updatedDescricao = descricao ? descricao.trim() : "";
    let resolvedProdutoId: number | undefined;
    let resolvedQuantidade: number | undefined;
    let resolvedCustoUnitario: number | undefined;
    let resolvedFornecedorId: number | undefined = fornecedorId ? parseInt(fornecedorId) : undefined;

    if (tipo === "PRODUTO") {
      const qty = parseInt(quantidade);
      const unitCost = parseFloat(custoUnitario);

      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ message: "Quantidade deve ser maior que zero." });
        return;
      }
      if (isNaN(unitCost) || unitCost < 0) {
        res.status(400).json({ message: "Custo unitário deve ser maior ou igual a zero." });
        return;
      }

      let pId = parseInt(produtoId);

      // Dynamic new product creation on-the-fly
      if (produtoId === "new" || (newProduct && newProduct.nome)) {
        if (!newProduct || !newProduct.nome || newProduct.nome.trim() === "") {
          res.status(400).json({ message: "O nome do novo produto é obrigatório." });
          return;
        }
        const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
        const createdProduct = {
          id: newId,
          nome: newProduct.nome.trim(),
          custo: unitCost,
          quantidadeEstoque: 0, // Will be incremented below
          categoriaId: parseInt(newProduct.categoriaId) || 0
        };
        db.products.push(createdProduct);
        pId = newId;
      }

      if (isNaN(pId)) {
        res.status(400).json({ message: "Selecione um produto válido ou cadastre um novo." });
        return;
      }

      const prodIndex = db.products.findIndex(p => p.id === pId);
      if (prodIndex === -1) {
        res.status(404).json({ message: "Produto selecionado não existe." });
        return;
      }

      // Update product stock and cost
      db.products[prodIndex].quantidadeEstoque += qty;
      db.products[prodIndex].custo = unitCost;

      resolvedProdutoId = pId;
      resolvedQuantidade = qty;
      resolvedCustoUnitario = unitCost;
      updatedDescricao = `Entrada de Estoque: ${db.products[prodIndex].nome}`;
    } else {
      const numericValor = parseFloat(valor);
      if (isNaN(numericValor) || numericValor < 0) {
        res.status(400).json({ message: "Valor deve ser maior ou igual a zero." });
        return;
      }
    }

    const newId = (db.expenses && db.expenses.length > 0) ? Math.max(...db.expenses.map(e => e.id)) + 1 : 1;
    const newExpense: Expense = {
      id: newId,
      tipo,
      descricao: updatedDescricao,
      produtoId: resolvedProdutoId,
      fornecedorId: resolvedFornecedorId,
      quantidade: resolvedQuantidade,
      custoUnitario: resolvedCustoUnitario,
      valor: tipo === "PRODUTO" ? Number((resolvedQuantidade! * resolvedCustoUnitario!).toFixed(2)) : Number(parseFloat(valor).toFixed(2)),
      data: data ? new Date(data).toISOString() : new Date().toISOString()
    };

    if (!db.expenses) db.expenses = [];
    db.expenses.push(newExpense);
    saveDatabase(db);

    res.status(201).json(newExpense);
  });

  app.delete("/api/expenses/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDatabase();

    if (!db.expenses) {
      res.status(404).json({ message: "Lançamento não encontrado." });
      return;
    }

    const expIndex = db.expenses.findIndex(e => e.id === id);
    if (expIndex === -1) {
      res.status(404).json({ message: "Lançamento não encontrado." });
      return;
    }

    const expense = db.expenses[expIndex];

    // If it was a product inflow, reverse the stock update
    if (expense.tipo === "PRODUTO" && expense.produtoId && expense.quantidade) {
      const prodIndex = db.products.findIndex(p => p.id === expense.produtoId);
      if (prodIndex !== -1) {
        db.products[prodIndex].quantidadeEstoque = Math.max(0, db.products[prodIndex].quantidadeEstoque - expense.quantidade);
      }
    }

    db.expenses.splice(expIndex, 1);
    saveDatabase(db);
    res.json({ message: "Lançamento excluído com sucesso." });
  });

  // Orders CRUD
  app.get("/api/orders", (req, res) => {
    const db = getDatabase();
    const marketplaceId = req.query.marketplaceId ? parseInt(req.query.marketplaceId as string) : null;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    const produtoId = req.query.produtoId ? parseInt(req.query.produtoId as string) : null;
    const startDate = req.query.startDate as string || null;
    const endDate = req.query.endDate as string || null;

    let result = db.orders.map(o => {
      const order = ensureOrderItems(o, db);
      
      const populatedItems = order.items.map((item: any) => {
        const prod = db.products.find(p => p.id === item.produtoId);
        const cat = db.categories.find(c => c.id === item.categoriaId);
        return {
          ...item,
          produtoNome: prod ? prod.nome : (item.produtoNome || "Produto Removido"),
          produtoCusto: prod ? prod.custo : (item.produtoCusto || 0),
          categoriaNome: cat ? cat.nome : "Desconhecida"
        };
      });

      const mkt = db.marketplaces.find(m => m.id === order.marketplaceId);

      let topProdutoNome = "";
      if (populatedItems.length === 1) {
        topProdutoNome = populatedItems[0].produtoNome;
      } else if (populatedItems.length > 1) {
        topProdutoNome = `${populatedItems[0].produtoNome} (+ ${populatedItems.length - 1} item(ns))`;
      } else {
        topProdutoNome = "Sem Itens";
      }

      return {
        ...order,
        items: populatedItems,
        produtoId: populatedItems[0]?.produtoId || order.produtoId,
        produtoNome: topProdutoNome,
        produtoCusto: populatedItems[0]?.produtoCusto || 0,
        categoriaId: populatedItems[0]?.categoriaId || order.categoriaId,
        categoriaNome: populatedItems[0]?.categoriaNome || "Desconhecida",
        marketplaceNome: mkt ? mkt.nome : "Desconhecido"
      };
    });

    // Filters
    if (marketplaceId) {
      result = result.filter(o => o.marketplaceId === marketplaceId);
    }
    if (categoryId) {
      result = result.filter(o => o.categoriaId === categoryId || o.items?.some((item: any) => item.categoriaId === categoryId));
    }
    if (produtoId) {
      result = result.filter(o => o.produtoId === produtoId || o.items?.some((item: any) => item.produtoId === produtoId));
    }
    if (startDate) {
      result = result.filter(o => new Date(o.dataPedido) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.dataPedido) <= end);
    }

    // Sort descending by default
    result.sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime());

    res.json(result);
  });

  app.post("/api/orders", authenticateToken, (req, res) => {
    const {
      items, // array of { produtoId, quantidade, valorVenda }
      produtoId, // fallback
      marketplaceId,
      quantidade, // fallback
      valorVenda, // fallback
      comissaoTipo,
      comissaoInformada,
      frete,
      taxaFixa
    } = req.body;

    const db = getDatabase();

    // Check if marketplace exists
    const mktExists = db.marketplaces.some(m => m.id === parseInt(marketplaceId));
    if (!mktExists) {
      return res.status(404).json({ message: "Marketplace não encontrado." });
    }

    if (frete === undefined || frete < 0) return res.status(400).json({ message: "O frete não pode ser negativo." });
    if (taxaFixa === undefined || taxaFixa < 0) return res.status(400).json({ message: "A taxa fixa não pode ser negativa." });
    if (comissaoInformada === undefined || comissaoInformada < 0) return res.status(400).json({ message: "A comissão não pode ser negativa." });

    let orderItems: any[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items;
    } else {
      // Fallback for single item format
      if (!produtoId) return res.status(400).json({ message: "O produto é obrigatório." });
      if (!quantidade || quantidade <= 0) return res.status(400).json({ message: "A quantidade deve ser maior que zero." });
      if (valorVenda === undefined || valorVenda < 0) return res.status(400).json({ message: "O valor da venda não pode ser negativo." });
      orderItems = [{ produtoId, quantidade, valorVenda }];
    }

    // Temp save products state in case we need to rollback stock changes on failure
    const originalProducts = JSON.parse(JSON.stringify(db.products));
    
    let totalCustoSKU = 0;
    let totalValorVenda = 0;
    const validatedItems: any[] = [];

    for (const item of orderItems) {
      const pId = parseInt(item.produtoId);
      const qty = parseInt(item.quantidade);
      const sVal = parseFloat(item.valorVenda);

      if (isNaN(pId)) return res.status(400).json({ message: "ID de produto inválido." });
      if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: "A quantidade de cada item deve ser maior que zero." });
      if (isNaN(sVal) || sVal < 0) return res.status(400).json({ message: "O valor de venda não pode ser negativo." });

      const productIndex = db.products.findIndex(p => p.id === pId);
      if (productIndex === -1) {
        db.products = originalProducts;
        return res.status(404).json({ message: `Produto com ID ${pId} não encontrado.` });
      }

      const product = db.products[productIndex];
      if (product.quantidadeEstoque < qty) {
        db.products = originalProducts;
        return res.status(400).json({
          message: `Estoque insuficiente para o produto "${product.nome}". Estoque atual: ${product.quantidadeEstoque}. Solicitado: ${qty}.`
        });
      }

      // Deduct Stock
      product.quantidadeEstoque -= qty;

      totalCustoSKU += product.custo * qty;
      totalValorVenda += sVal;

      validatedItems.push({
        produtoId: pId,
        quantidade: qty,
        valorVenda: sVal,
        categoriaId: product.categoriaId
      });
    }

    // Calculations
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

    // Save Order
    const newId = db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1;
    const newOrder: any = {
      id: newId,
      items: validatedItems,
      marketplaceId: parseInt(marketplaceId),
      comissaoTipo,
      comissaoValor,
      comissaoInformada: Number(comissaoInformada),
      frete: Number(frete),
      taxaFixa: Number(taxaFixa),
      valorVenda: totalValorVenda,
      lucroBruto,
      lucroLiquido,
      margemBruta,
      margemLiquida,
      dataPedido: new Date().toISOString()
    };

    db.orders.push(newOrder);
    saveDatabase(db);

    return res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const {
      items, // array of { produtoId, quantidade, valorVenda }
      marketplaceId,
      comissaoTipo,
      comissaoInformada,
      frete,
      taxaFixa
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "O pedido deve conter pelo menos um item." });
    }
    if (!marketplaceId) return res.status(400).json({ message: "O marketplace é obrigatório." });
    if (frete === undefined || frete < 0) return res.status(400).json({ message: "O frete não pode ser negativo." });
    if (taxaFixa === undefined || taxaFixa < 0) return res.status(400).json({ message: "A taxa fixa não pode ser negativa." });
    if (comissaoInformada === undefined || comissaoInformada < 0) return res.status(400).json({ message: "A comissão não pode ser negativa." });

    const db = getDatabase();
    
    // Find existing order
    const orderIndex = db.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }
    const oldOrder = ensureOrderItems(db.orders[orderIndex], db);

    // Temp restore stock for check
    const originalProducts = JSON.parse(JSON.stringify(db.products));
    
    // Return old stock
    oldOrder.items.forEach((item: any) => {
      const pIdx = db.products.findIndex(p => p.id === item.produtoId);
      if (pIdx !== -1) {
        db.products[pIdx].quantidadeEstoque += item.quantidade;
      }
    });

    // Check new items stock & validity
    let totalCustoSKU = 0;
    let totalValorVenda = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const prodId = parseInt(item.produtoId);
      const qty = parseInt(item.quantidade);
      const saleVal = parseFloat(item.valorVenda);

      if (isNaN(prodId)) return res.status(400).json({ message: "ID do produto inválido." });
      if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: "A quantidade de cada item deve ser maior que zero." });
      if (isNaN(saleVal) || saleVal < 0) return res.status(400).json({ message: "O valor de venda não pode ser negativo." });

      const pIdx = db.products.findIndex(p => p.id === prodId);
      if (pIdx === -1) {
        // Rollback and fail
        db.products = originalProducts;
        return res.status(404).json({ message: `Produto com ID ${prodId} não encontrado.` });
      }

      const product = db.products[pIdx];
      if (product.quantidadeEstoque < qty) {
        // Rollback and fail
        db.products = originalProducts;
        return res.status(400).json({
          message: `Estoque insuficiente para o produto "${product.nome}". Estoque disponível (com estorno): ${product.quantidadeEstoque}. Solicitado: ${qty}.`
        });
      }

      // Deduct stock
      product.quantidadeEstoque -= qty;

      totalCustoSKU += product.custo * qty;
      totalValorVenda += saleVal;

      validatedItems.push({
        produtoId: prodId,
        quantidade: qty,
        valorVenda: saleVal,
        categoriaId: product.categoriaId
      });
    }

    // Calculations
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

    // Update order
    db.orders[orderIndex] = {
      ...oldOrder,
      items: validatedItems,
      marketplaceId: parseInt(marketplaceId),
      comissaoTipo,
      comissaoValor,
      comissaoInformada: Number(comissaoInformada),
      frete: Number(frete),
      taxaFixa: Number(taxaFixa),
      valorVenda: totalValorVenda,
      lucroBruto,
      lucroLiquido,
      margemBruta,
      margemLiquida,
      dataPedido: oldOrder.dataPedido
    };

    saveDatabase(db);
    res.json(db.orders[orderIndex]);
  });

  app.delete("/api/orders/:id", authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDatabase();

    const orderIndex = db.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      res.status(404).json({ message: "Pedido não encontrado." });
      return;
    }

    const order = ensureOrderItems(db.orders[orderIndex], db);

    // Give back stock for all items
    order.items.forEach((item: any) => {
      const productIndex = db.products.findIndex(p => p.id === item.produtoId);
      if (productIndex !== -1) {
        db.products[productIndex].quantidadeEstoque += item.quantidade;
      }
    });

    db.orders.splice(orderIndex, 1);
    saveDatabase(db);
    res.json({ message: "Pedido estornado e excluído com sucesso. Estoque devolvido." });
  });

  // Dashboard Aggregates
  app.get("/api/dashboard", (req, res) => {
    const db = getDatabase();

    // Key indicators
    const totalPedidos = db.orders.length;
    const totalVendido = Number(db.orders.reduce((sum, o) => sum + o.valorVenda, 0).toFixed(2));
    const lucroBrutoTotal = Number(db.orders.reduce((sum, o) => sum + o.lucroBruto, 0).toFixed(2));
    const lucroLiquidoTotal = Number(db.orders.reduce((sum, o) => sum + o.lucroLiquido, 0).toFixed(2));
    const totalQtdVendida = db.orders.reduce((sum, o) => {
      const order = ensureOrderItems(o, db);
      return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantidade, 0);
    }, 0);

    const ticketMedio = totalPedidos > 0 ? Number((totalVendido / totalPedidos).toFixed(2)) : 0;
    const margemBrutaMedia = totalVendido > 0 ? Number(((lucroBrutoTotal / totalVendido) * 100).toFixed(2)) : 0;
    const margemLiquidaMedia = totalVendido > 0 ? Number(((lucroLiquidoTotal / totalVendido) * 100).toFixed(2)) : 0;

    const produtosCadastrados = db.products.length;
    const totalEstoque = db.products.reduce((sum, p) => sum + p.quantidadeEstoque, 0);
    const categoriasCount = db.categories.length;
    const marketplacesCount = db.marketplaces.length;

    // Stock indicators
    const semEstoque = db.products.filter(p => p.quantidadeEstoque === 0).length;
    const estoqueBaixo = db.products.filter(p => p.quantidadeEstoque > 0 && p.quantidadeEstoque <= 5).length;

    // Top 10 products sold (by qty)
    const productSalesMap: Record<number, { nome: string; qty: number; totalValue: number }> = {};
    db.orders.forEach(o => {
      const order = ensureOrderItems(o, db);
      order.items.forEach((item: any) => {
        const prod = db.products.find(p => p.id === item.produtoId);
        const name = prod ? prod.nome : (item.produtoNome || "Removido");
        if (!productSalesMap[item.produtoId]) {
          productSalesMap[item.produtoId] = { nome: name, qty: 0, totalValue: 0 };
        }
        productSalesMap[item.produtoId].qty += item.quantidade;
        productSalesMap[item.produtoId].totalValue += item.valorVenda;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Margins by category (proportional metric attribution)
    const catMarginsMap: Record<number, { nome: string; venda: number; bruto: number; liquido: number }> = {};
    db.orders.forEach(o => {
      const order = ensureOrderItems(o, db);
      const totalOrderVenda = order.valorVenda;
      
      order.items.forEach((item: any) => {
        const cat = db.categories.find(c => c.id === item.categoriaId);
        const name = cat ? cat.nome : "Outros";
        if (!catMarginsMap[item.categoriaId]) {
          catMarginsMap[item.categoriaId] = { nome: name, venda: 0, bruto: 0, liquido: 0 };
        }
        
        const factor = totalOrderVenda > 0 ? (item.valorVenda / totalOrderVenda) : (1 / order.items.length);
        
        catMarginsMap[item.categoriaId].venda += item.valorVenda;
        catMarginsMap[item.categoriaId].bruto += order.lucroBruto * factor;
        catMarginsMap[item.categoriaId].liquido += order.lucroLiquido * factor;
      });
    });

    const marginsByCategory = Object.values(catMarginsMap).map(item => {
      const margemBruta = item.venda > 0 ? Number(((item.bruto / item.venda) * 100).toFixed(2)) : 0;
      const margemLiquida = item.venda > 0 ? Number(((item.liquido / item.venda) * 100).toFixed(2)) : 0;
      return {
        categoria: item.nome,
        margemBruta,
        margemLiquida,
        venda: Number(item.venda.toFixed(2))
      };
    });

    // Marketplace stats
    const mktStatsMap: Record<number, { nome: string; venda: number; bruto: number; liquido: number; pedidos: number }> = {};
    db.orders.forEach(o => {
      const mkt = db.marketplaces.find(m => m.id === o.marketplaceId);
      const name = mkt ? mkt.nome : "Outros";
      if (!mktStatsMap[o.marketplaceId]) {
        mktStatsMap[o.marketplaceId] = { nome: name, venda: 0, bruto: 0, liquido: 0, pedidos: 0 };
      }
      mktStatsMap[o.marketplaceId].venda += o.valorVenda;
      mktStatsMap[o.marketplaceId].bruto += o.lucroBruto;
      mktStatsMap[o.marketplaceId].liquido += o.lucroLiquido;
      mktStatsMap[o.marketplaceId].pedidos += 1;
    });

    const mktStats = Object.values(mktStatsMap).map(item => {
      const margemBruta = item.venda > 0 ? Number(((item.bruto / item.venda) * 100).toFixed(2)) : 0;
      const margemLiquida = item.venda > 0 ? Number(((item.liquido / item.venda) * 100).toFixed(2)) : 0;
      return {
        marketplace: item.nome,
        valorVendido: Number(item.venda.toFixed(2)),
        lucroBruto: Number(item.bruto.toFixed(2)),
        lucroLiquido: Number(item.liquido.toFixed(2)),
        pedidos: item.pedidos,
        margemBruta,
        margemLiquida
      };
    });

    // Time series (Sales, Profit & Costs by Month)
    const monthlyDataMap: Record<string, { 
      monthName: string; 
      totalVendido: number; 
      lucroBruto: number; 
      lucroLiquido: number; 
      pedidos: number;
      custosEntrada: number;
      custosGerais: number;
      totalCustos: number;
    }> = {};
    const monthsLocale = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const current = new Date();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyDataMap[key] = {
        monthName: `${monthsLocale[d.getMonth()]} ${d.getFullYear()}`,
        totalVendido: 0,
        lucroBruto: 0,
        lucroLiquido: 0,
        pedidos: 0,
        custosEntrada: 0,
        custosGerais: 0,
        totalCustos: 0
      };
    }

    db.orders.forEach(o => {
      const d = new Date(o.dataPedido);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = {
          monthName: `${monthsLocale[d.getMonth()]} ${d.getFullYear()}`,
          totalVendido: 0,
          lucroBruto: 0,
          lucroLiquido: 0,
          pedidos: 0,
          custosEntrada: 0,
          custosGerais: 0,
          totalCustos: 0
        };
      }
      
      monthlyDataMap[key].totalVendido += o.valorVenda;
      monthlyDataMap[key].lucroBruto += o.lucroBruto;
      monthlyDataMap[key].lucroLiquido += o.lucroLiquido;
      monthlyDataMap[key].pedidos += 1;
    });

    if (db.expenses) {
      db.expenses.forEach(e => {
        const d = new Date(e.data);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        
        if (!monthlyDataMap[key]) {
          monthlyDataMap[key] = {
            monthName: `${monthsLocale[d.getMonth()]} ${d.getFullYear()}`,
            totalVendido: 0,
            lucroBruto: 0,
            lucroLiquido: 0,
            pedidos: 0,
            custosEntrada: 0,
            custosGerais: 0,
            totalCustos: 0
          };
        }
        
        if (e.tipo === "PRODUTO") {
          monthlyDataMap[key].custosEntrada += e.valor;
        } else {
          monthlyDataMap[key].custosGerais += e.valor;
        }
        monthlyDataMap[key].totalCustos += e.valor;
      });
    }

    const monthlyEvolution = Object.keys(monthlyDataMap)
      .sort()
      .map(key => ({
        mes: monthlyDataMap[key].monthName,
        vendas: Number(monthlyDataMap[key].totalVendido.toFixed(2)),
        lucroBruto: Number(monthlyDataMap[key].lucroBruto.toFixed(2)),
        lucroLiquido: Number(monthlyDataMap[key].lucroLiquido.toFixed(2)),
        pedidos: monthlyDataMap[key].pedidos,
        custosEntrada: Number(monthlyDataMap[key].custosEntrada.toFixed(2)),
        custosGerais: Number(monthlyDataMap[key].custosGerais.toFixed(2)),
        totalCustos: Number(monthlyDataMap[key].totalCustos.toFixed(2))
      }));

    res.json({
      indicators: {
        totalVendido,
        totalPedidos,
        lucroBrutoTotal,
        lucroLiquidoTotal,
        margemBrutaMedia,
        margemLiquidaMedia,
        ticketMedio,
        totalQtdVendida,
        produtosCadastrados,
        totalEstoque,
        categoriasCount,
        marketplacesCount,
        semEstoque,
        estoqueBaixo
      },
      topProducts,
      marginsByCategory,
      mktStats,
      monthlyEvolution
    });
  });

  // --- VITE DEV MIDDLEWARE OR PRODUCTION STATIC ROUTING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
