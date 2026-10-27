INSERT INTO customers (id, name, phone, email) VALUES
  (1, 'Camila Rojas',    '+56911111111', 'camila@example.com'),
  (2, 'Diego Muñoz',     '+56922222222', 'diego@example.com'),
  (3, 'Valentina Soto',  '+56933333333', 'vale@example.com'),
  (4, 'Matías Fuentes',  '+56944444444', 'matias@example.com'),
  (5, 'Fernanda Pérez',  '+56955555555', 'fer@example.com');
SELECT setval('customers_id_seq', 5);

INSERT INTO products (sku, name, category, price_clp, description) VALUES
  ('TAL-500',  'Taladro Bosch 500W',            'Herramientas eléctricas', 39990, 'Taladro percutor de 500W para madera, metal y concreto liviano.'),
  ('TAL-750',  'Taladro Bosch 750W',            'Herramientas eléctricas', 54990, 'Taladro percutor de 750W, ideal para concreto y uso frecuente.'),
  ('ATO-12',   'Atornillador inalámbrico 12V',  'Herramientas eléctricas', 44990, 'Atornillador con batería de litio, 2 velocidades.'),
  ('BRO-8',    'Broca Bosch 8mm metal',         'Accesorios',               2990, 'Broca HSS de 8mm para metal y madera.'),
  ('BRO-C8',   'Broca 8mm concreto',            'Accesorios',               3490, 'Broca con punta de widia para concreto y ladrillo.'),
  ('TAR-8',    'Tarugos 8mm (bolsa 25)',        'Fijaciones',               1990, 'Tarugos plásticos para muros de concreto y ladrillo.'),
  ('TOR-4',    'Tornillos 4x40mm (caja 100)',   'Fijaciones',               3990, 'Tornillos zincados cabeza plana.'),
  ('MAR-16',   'Martillo carpintero 16oz',      'Herramientas manuales',    8990, 'Martillo con mango de fibra de vidrio.'),
  ('DES-SET',  'Set destornilladores 6 piezas', 'Herramientas manuales',    7990, 'Puntas planas y Phillips, mango ergonómico.'),
  ('HUI-5',    'Huincha de medir 5m',           'Medición',                 4990, 'Huincha metálica con freno.'),
  ('NIV-60',   'Nivel de burbuja 60cm',         'Medición',                 6990, 'Nivel de aluminio con 3 burbujas.'),
  ('PIN-BL4',  'Pintura látex blanca 4L',       'Pinturas',                17990, 'Látex lavable para interiores, rinde 40 m² por mano.'),
  ('ROD-23',   'Rodillo 23cm',                  'Pinturas',                 4490, 'Rodillo de chiporro para látex.'),
  ('SIL-TR',   'Silicona transparente',         'Adhesivos',                3290, 'Sellador para baños y cocinas.'),
  ('ESC-6',    'Escalera tijera 6 peldaños',    'Escaleras',               49990, 'Escalera de aluminio, soporta 120 kg.');

INSERT INTO stock (sku, available) VALUES
  ('TAL-500', 8), ('TAL-750', 3), ('ATO-12', 5), ('BRO-8', 40), ('BRO-C8', 25),
  ('TAR-8', 60),  ('TOR-4', 30),  ('MAR-16', 12), ('DES-SET', 9), ('HUI-5', 15),
  ('NIV-60', 0),
  ('PIN-BL4', 20), ('ROD-23', 18), ('SIL-TR', 22), ('ESC-6', 2);

INSERT INTO orders (id, customer_id, status, eta, created_at) VALUES
  (1040, 1, 'delivered', CURRENT_DATE - 10, now() - interval '14 days'),
  (1042, 1, 'shipped',   CURRENT_DATE + 1,  now() - interval '2 days'),
  (1044, 1, 'pending',   NULL,              now() - interval '3 hours'),
  (1043, 2, 'paid',      CURRENT_DATE + 3,  now() - interval '1 day'),
  (1045, 2, 'cancelled', NULL,              now() - interval '6 days'),
  (1046, 3, 'pending',   NULL,              now() - interval '1 hour'),
  (1047, 4, 'delivered', CURRENT_DATE - 3,  now() - interval '8 days'),
  (1048, 5, 'paid',      CURRENT_DATE + 2,  now() - interval '20 hours');
SELECT setval('orders_id_seq', 1050);

INSERT INTO order_items (order_id, sku, qty, unit_price_clp) VALUES
  (1040, 'PIN-BL4', 2, 17990), (1040, 'ROD-23', 1, 4490),
  (1042, 'TAL-500', 1, 39990), (1042, 'TAR-8', 2, 1990),
  (1044, 'MAR-16', 1, 8990),
  (1043, 'ESC-6', 1, 49990),
  (1045, 'HUI-5', 1, 4990),
  (1046, 'ATO-12', 1, 44990), (1046, 'TOR-4', 1, 3990),
  (1047, 'SIL-TR', 3, 3290),
  (1048, 'TAL-750', 1, 54990), (1048, 'BRO-C8', 2, 3490);

UPDATE orders o
SET total_clp = t.total
FROM (SELECT order_id, SUM(qty * unit_price_clp) AS total FROM order_items GROUP BY order_id) t
WHERE o.id = t.order_id;