export interface Category {
  id: number;
  nome: string;
}

export interface Marketplace {
  id: number;
  nome: string;
}

export interface Product {
  id: number;
  nome: string;
  custo: number;
  quantidadeEstoque: number;
  categoriaId: number;
  categoriaNome?: string;
}

export interface OrderItem {
  produtoId: number;
  quantidade: number;
  valorVenda: number;
  categoriaId: number;
  produtoNome?: string;
  produtoCusto?: number;
}

export interface Order {
  id: number;
  produtoId: number;
  produtoNome?: string;
  produtoCusto?: number;
  categoriaId: number;
  categoriaNome?: string;
  marketplaceId: number;
  marketplaceNome?: string;
  quantidade: number;
  valorVenda: number;
  comissaoTipo: "PERCENTUAL" | "VALOR";
  comissaoValor: number;
  comissaoInformada: number;
  frete: number;
  taxaFixa: number;
  lucroBruto: number;
  lucroLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  dataPedido: string;
  items?: OrderItem[];
}

export interface DashboardIndicators {
  totalVendido: number;
  totalPedidos: number;
  lucroBrutoTotal: number;
  lucroLiquidoTotal: number;
  margemBrutaMedia: number;
  margemLiquidaMedia: number;
  ticketMedio: number;
  totalQtdVendida: number;
  produtosCadastrados: number;
  totalEstoque: number;
  totalEstoqueValor: number;
  categoriasCount: number;
  marketplacesCount: number;
  estoqueBaixo: number;
  semEstoque: number;
  custosOperacionaisMes: number;
  custosEstoqueMes: number;
  totalDespesasMes: number;
}

export interface TopProduct {
  nome: string;
  qty: number;
  totalValue: number;
}

export interface CategoryMargin {
  categoria: string;
  margemBruta: number;
  margemLiquida: number;
  venda: number;
}

export interface MarketplaceStat {
  marketplace: string;
  valorVendido: number;
  lucroBruto: number;
  lucroLiquido: number;
  pedidos: number;
  margemBruta: number;
  margemLiquida: number;
}

export interface MonthlyEvolution {
  mes: string;
  vendas: number;
  lucroBruto: number;
  lucroLiquido: number;
  pedidos: number;
  custosEntrada?: number;
  custosGerais?: number;
  totalCustos?: number;
}

export interface Supplier {
  id: number;
  nome: string;
  contato?: string;
  telefone?: string;
  cnpj?: string;
}

export interface Expense {
  id: number;
  tipo: "PRODUTO" | "GERAL";
  descricao: string;
  produtoId?: number;
  produtoNome?: string;
  fornecedorId?: number;
  fornecedorNome?: string;
  quantidade?: number;
  custoUnitario?: number;
  valor: number;
  data: string;
}

export interface DashboardData {
  indicators: DashboardIndicators;
  topProducts: TopProduct[];
  marginsByCategory: CategoryMargin[];
  mktStats: MarketplaceStat[];
  monthlyEvolution: MonthlyEvolution[];
}
