-- Clean up existing tables
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS marketplaces CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Categories table
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Marketplaces table
CREATE TABLE marketplaces (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Products table
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    custo NUMERIC(10, 2) NOT NULL CHECK (custo >= 0),
    quantidade_estoque INT NOT NULL CHECK (quantidade_estoque >= 0),
    categoria_id INT NOT NULL,
    CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- Orders table
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    produto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    marketplace_id INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    valor_venda NUMERIC(10, 2) NOT NULL CHECK (valor_venda >= 0),
    comissao_tipo VARCHAR(20) NOT NULL,
    comissao_valor NUMERIC(10, 2) NOT NULL CHECK (comissao_valor >= 0),
    frete NUMERIC(10, 2) NOT NULL CHECK (frete >= 0),
    taxa_fixa NUMERIC(10, 2) NOT NULL CHECK (taxa_fixa >= 0),
    lucro_bruto NUMERIC(10, 2) NOT NULL,
    lucro_liquido NUMERIC(10, 2) NOT NULL,
    margem_bruta NUMERIC(10, 2) NOT NULL,
    margem_liquida NUMERIC(10, 2) NOT NULL,
    data_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_marketplace FOREIGN KEY (marketplace_id) REFERENCES marketplaces(id) ON DELETE RESTRICT
);

-- Users table for authentication
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN'
);
