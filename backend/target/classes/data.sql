-- Default system user (admin / admin123)
-- BCrypt hash of 'admin123' is '$2a$10$7Z2vYg0E7r3O0gD3M7A3ee9QZ8E9k3b3K3Y8b6W6O6o6w6o6q6w6O' (or similar standard active BCrypt string)
INSERT INTO usuarios (username, password, role) VALUES 
('admin', '$2a$10$xWIDNidg79qB7Lh6h6z2veIscsZ0h3m4a3F8v9u.gHscE7Xm0tWb.', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Initial Categories
INSERT INTO categorias (nome) VALUES 
('Eletrônicos'),
('Eletrodomésticos'),
('Moda & Calçados'),
('Casa & Decoração'),
('Esportes & Lazer')
ON CONFLICT (nome) DO NOTHING;

-- Initial Marketplaces
INSERT INTO marketplaces (nome) VALUES 
('Mercado Livre'),
('Shopee'),
('Amazon'),
('Magalu'),
('Shein')
ON CONFLICT (nome) DO NOTHING;

-- Initial Products
INSERT INTO produtos (nome, custo, quantidade_estoque, categoria_id) VALUES 
('Smartphone Android 128GB', 800.00, 24, 1),
('Fone de Ouvido Bluetooth', 45.00, 117, 1),
('Cafeteira Expresso Italiana', 220.00, 13, 2),
('Camiseta Algodão Pima Premium', 35.00, 195, 3),
('Cadeira Gamer Ergonômica', 350.00, 7, 4),
('Smartwatch Sport GPS', 150.00, 43, 1),
('Teclado Mecânico RGB Hot-swap', 110.00, 31, 1),
('Jogo de Panelas de Cerâmica (5pçs)', 180.00, 12, 4),
('Mochila Impermeável Urban', 48.00, 56, 3),
('Garrafa Térmica Inox 1L', 30.00, 92, 5);

-- Initial Orders (Seed Historical Data to match calculations)
-- Order 1: Smartphone,ML, Qty 1, Cost 800, Sale 1200, Freight 40, FixedFee 5, Comm 16% (192.00)
-- Lucro Bruto = 1200 - 40 - 5 - 192 = 963.00
-- Lucro Liquido = 963 - 800 = 163.00
-- Margem Bruta = (963/1200)*100 = 80.25%, Margem Liquida = (163/1200)*100 = 13.58%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(1, 1, 1, 1, 1200.00, 'PERCENTUAL', 192.00, 40.00, 5.00, 963.00, 163.00, 80.25, 13.58, NOW() - INTERVAL '50 DAYS');

-- Order 2: Fone de Ouvido, Shopee, Qty 3, Cost 45 (135 tot), Sale 270, Freight 15, FixedFee 3, Comm Fixed 30
-- Lucro Bruto = 270 - 15 - 3 - 30 = 222.00
-- Lucro Liquido = 222 - 135 = 87.00
-- Margem Bruta = (222/270)*100 = 82.22%, Margem Liquida = (87/270)*100 = 32.22%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(2, 1, 2, 3, 270.00, 'VALOR', 30.00, 15.00, 3.00, 222.00, 87.00, 82.22, 32.22, NOW() - INTERVAL '45 DAYS');

-- Order 3: Cafeteira, Amazon, Qty 1, Cost 220, Sale 450, Freight 35, FixedFee 10, Comm 15% (67.50)
-- Lucro Bruto = 450 - 35 - 10 - 67.50 = 337.50
-- Lucro Liquido = 337.50 - 220 = 117.50
-- Margem Bruta = 75.00%, Margem Liquida = 26.11%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(3, 2, 3, 1, 450.00, 'PERCENTUAL', 67.50, 35.00, 10.00, 337.50, 117.50, 75.00, 26.11, NOW() - INTERVAL '38 DAYS');

-- Order 4: Camiseta, Shopee, Qty 5, Cost 35 (175 tot), Sale 375, Freight 20, FixedFee 5, Comm 18% (67.50)
-- Lucro Bruto = 375 - 20 - 5 - 67.50 = 282.50
-- Lucro Liquido = 282.50 - 175 = 107.50
-- Margem Bruta = 75.33%, Margem Liquida = 28.67%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(4, 3, 2, 5, 375.00, 'PERCENTUAL', 67.50, 20.00, 5.00, 282.50, 107.50, 75.33, 28.67, NOW() - INTERVAL '30 DAYS');

-- Order 5: Cadeira Gamer, ML, Qty 1, Cost 350, Sale 699, Freight 50, FixedFee 15, Comm 16% (111.84)
-- Lucro Bruto = 699 - 50 - 15 - 111.84 = 522.16
-- Lucro Liquido = 522.16 - 350 = 172.16
-- Margem Bruta = 74.70%, Margem Liquida = 24.63%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(5, 4, 1, 1, 699.00, 'PERCENTUAL', 111.84, 50.00, 15.00, 522.16, 172.16, 74.70, 24.63, NOW() - INTERVAL '25 DAYS');

-- Order 6: Smartwatch, Magalu, Qty 2, Cost 150 (300 tot), Sale 580, Freight 25, FixedFee 5, Comm Fixed 60
-- Lucro Bruto = 580 - 25 - 5 - 60 = 490.00
-- Lucro Liquido = 490 - 300 = 190.00
-- Margem Bruta = 84.48%, Margem Liquida = 32.76%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(6, 1, 4, 2, 580.00, 'VALOR', 60.00, 25.00, 5.00, 490.00, 190.00, 84.48, 32.76, NOW() - INTERVAL '18 DAYS');

-- Order 7: Teclado, ML, Qty 1, Cost 110, Sale 250, Freight 15, FixedFee 5, Comm 16% (40.00)
-- Lucro Bruto = 250 - 15 - 5 - 40 = 190.00
-- Lucro Liquido = 190 - 110 = 80.00
-- Margem Bruta = 76.00%, Margem Liquida = 32.00%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(7, 1, 1, 1, 250.00, 'PERCENTUAL', 40.00, 15.00, 5.00, 190.00, 80.00, 76.00, 32.00, NOW() - INTERVAL '14 DAYS');

-- Order 8: Jogo de Panelas, Amazon, Qty 2, Cost 180 (360 tot), Sale 600, Freight 40, FixedFee 10, Comm 15% (90.00)
-- Lucro Bruto = 600 - 40 - 10 - 90 = 460.00
-- Lucro Liquido = 460 - 360 = 100.00
-- Margem Bruta = 76.67%, Margem Liquida = 16.67%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(8, 4, 3, 2, 600.00, 'PERCENTUAL', 90.00, 40.00, 10.00, 460.00, 100.00, 76.67, 16.67, NOW() - INTERVAL '10 DAYS');

-- Order 9: Mochila, Shein, Qty 4, Cost 48 (192 tot), Sale 320, Freight 18, FixedFee 4, Comm 20% (64.00)
-- Lucro Bruto = 320 - 18 - 4 - 64 = 234.00
-- Lucro Liquido = 234 - 192 = 42.00
-- Margem Bruta = 73.13%, Margem Liquida = 13.13%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(9, 3, 5, 4, 320.00, 'PERCENTUAL', 64.00, 18.00, 4.00, 234.00, 42.00, 73.13, 13.13, NOW() - INTERVAL '7 DAYS');

-- Order 10: Garrafa Térmica, Shopee, Qty 3, Cost 30 (90 tot), Sale 210, Freight 12, FixedFee 3, Comm Fixed 21
-- Lucro Bruto = 210 - 12 - 3 - 21 = 174.00
-- Lucro Liquido = 174 - 90 = 84.00
-- Margem Bruta = 82.86%, Margem Liquida = 40.00%
INSERT INTO pedidos (produto_id, categoria_id, marketplace_id, quantidade, valor_venda, comissao_tipo, comissao_valor, frete, taxa_fixa, lucro_bruto, lucro_liquido, margem_bruta, margem_liquida, data_pedido) VALUES 
(10, 5, 2, 3, 210.00, 'VALOR', 21.00, 12.00, 3.00, 174.00, 84.00, 82.86, 40.00, NOW() - INTERVAL '3 DAYS');
