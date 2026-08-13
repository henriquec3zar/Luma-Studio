-- Dados iniciais demonstrativos. Não use dados reais neste arquivo público.

INSERT INTO professionals (id, name, role, initials, avatar) VALUES
  ('p1', 'Profissional 01', 'Colorista',     'P1', 'avatar-bia'),
  ('p2', 'Profissional 02', 'Hair stylist',  'P2', 'avatar-carol'),
  ('p3', 'Profissional 03', 'Nail designer', 'P3', 'avatar-nati'),
  ('p4', 'Profissional 04', 'Beauty artist', 'P4', 'avatar-julia');

INSERT INTO services (id, name, category, duration, price, promo_price, commission, description, materials) VALUES
  ('s1', 'Coloração',              'Cabelos',       120, 460, 0, 10, 'Coloração completa com produtos premium',           'Tinta, shampoo, condicionador'),
  ('s2', 'Corte + escova',         'Cabelos',        60, 180, 0, 12, 'Corte personalizado e escova modelada',             'Shampoo, condicionador, protetor térmico'),
  ('s3', 'Manicure',               'Unhas',          60,  95, 0, 15, 'Manicure completa com cutilagem e esmalte',         'Esmalte, base, top coat'),
  ('s4', 'Design de sobrancelhas', 'Sobrancelhas',   30,  75, 0, 18, 'Design e modelagem de sobrancelhas',                'Pinça, cera, lápis'),
  ('s5', 'Hidratação profunda',    'Cabelos',        60, 260, 0, 10, 'Hidratação profunda com máscara nutritiva',         'Máscara, shampoo, condicionador'),
  ('s6', 'Progressiva',            'Cabelos',       180, 330, 0,  8, 'Progressiva e selagem térmica',                     'Progressiva, shampoo, secador, prancha'),
  ('s7', 'Escova modelada',        'Cabelos',        45, 150, 0, 12, 'Escova modelada com finalização',                   'Shampoo, condicionador, protetor térmico');

INSERT INTO clients (id, name, initials, avatar, cpf, birth, gender, phone, whatsapp, cep, street, number, neighborhood, city, state, notes, preferences, allergies, products, lgpd, total_spent, visits, last_visit) VALUES
  ('c1',  'Cliente 01', 'C1', 'avatar-ana',    '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', 'Cliente demonstrativa',       'Prefere atendimento pela manhã',  '', 'Produto demo', 1, 2840, 8,  '2026-07-31'),
  ('c2',  'Cliente 02', 'C2', 'avatar-julia',  '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1, 1980, 6,  '2026-07-31'),
  ('c3',  'Cliente 03', 'C3', 'avatar-marina', '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            'Prefere horários à tarde',        '', 'Produto demo', 1, 1240, 5,  '2026-07-31'),
  ('c4',  'Cliente 04', 'C4', 'avatar-carol',  '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', 'Observação demonstrativa',    'Prefere acabamento natural',      '', 'Produto demo', 1, 3450, 10, '2026-07-31'),
  ('c5',  'Cliente 05', 'C5', 'avatar-nati',   '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1, 1620, 7,  '2026-07-31'),
  ('c6',  'Cliente 06', 'C6', 'avatar-bia',    '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1,  980, 4,  '2026-07-31'),
  ('c7',  'Cliente 07', 'C7', 'avatar-ana',    '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            'Prefere atendimento aos sábados', '', 'Produto demo', 1, 2150, 9,  '2026-07-31'),
  ('c8',  'Cliente 08', 'C8', 'avatar-marina', '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1, 1340, 5,  '2026-07-31'),
  ('c9',  'Cliente 09', 'C9', 'avatar-carol',  '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', 'Observação demonstrativa',    '',                                '', 'Produto demo', 1, 2680, 8,  '2026-07-31'),
  ('c10', 'Cliente 10', 'C10','avatar-julia',  '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1,  760, 3,  '2026-07-31'),
  ('c11', 'Cliente 11', 'C11','avatar-nati',   '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1,  450, 2,  '2026-07-31'),
  ('c12', 'Cliente 12', 'C12','avatar-bia',    '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', 'Confirmar teste de mecha',   '',                                '', 'Produto demo', 1, 1980, 6,  '2026-07-31'),
  ('c13', 'Cliente 13', 'C13','avatar-ana',    '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', 'Cancelamento demonstrativo', '',                                '', 'Produto demo', 0,  560, 2,  '2026-07-28'),
  ('c14', 'Cliente 14', 'C14','avatar-marina', '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1,  320, 1,  '2026-07-31'),
  ('c15', 'Cliente 15', 'C15','avatar-julia',  '000.000.000-00', '1990-01-01', 'feminino', '(00) 00000-0000', '(00) 00000-0000', '00000-000', 'Rua Exemplo', '0', 'Bairro Demo', 'Cidade Demo', 'SP', '',                            '',                                '', 'Produto demo', 1,  460, 1,  '2026-07-27');

INSERT INTO appointments (id, client_id, client_name, service_id, service_name, professional_id, date, time, duration, status, title, notes) VALUES
  ('a1',  'c4',  'Cliente 04', 's1', 'Coloração',              'p1', '2026-07-31', '08:00', 120, 'finished',  NULL,        'Observação demonstrativa.'),
  ('a2',  'c5',  'Cliente 05', 's2', 'Corte + escova',         'p2', '2026-07-31', '08:30',  60, 'finished',  NULL,        ''),
  ('a3',  'c6',  'Cliente 06', 's3', 'Manicure',               'p3', '2026-07-31', '09:00',  60, 'finished',  NULL,        ''),
  ('a4',  'c7',  'Cliente 07', 's4', 'Design de sobrancelhas', 'p4', '2026-07-31', '09:30',  30, 'finished',  NULL,        ''),
  ('a5',  'c1',  'Cliente 01', 's1', 'Coloração',              'p1', '2026-07-31', '10:30', 120, 'confirmed', NULL,        'Cliente prefere acabamento natural.'),
  ('a6',  'c2',  'Cliente 02', 's2', 'Corte + escova',         'p2', '2026-07-31', '10:00',  60, 'progress',  NULL,        'Corte em camadas.'),
  ('a7',  'c3',  'Cliente 03', 's3', 'Manicure',               'p3', '2026-07-31', '11:00',  60, 'scheduled', NULL,        ''),
  ('a8',  NULL,  'Cliente avulsa', 's4', 'Design de sobrancelhas', 'p4', '2026-07-31', '11:30',  30, 'cancelled', NULL,   ''),
  ('a9',  'c8',  'Cliente 08', 's5', 'Hidratação profunda',    'p2', '2026-07-31', '12:00',  60, 'confirmed', NULL,        ''),
  ('a10', 'c9',  'Cliente 09', 's1', 'Coloração',              'p1', '2026-07-31', '13:30', 120, 'scheduled', NULL,        'Observação demonstrativa.'),
  ('a11', 'c10', 'Cliente 10', 's3', 'Manicure',               'p3', '2026-07-31', '14:00',  60, 'scheduled', NULL,        ''),
  ('a12', 'c11', 'Cliente 11', 's7', 'Escova modelada',        'p4', '2026-07-31', '15:00',  45, 'confirmed', NULL,        ''),
  ('a13', 'c12', 'Cliente 12', 's6', 'Progressiva',            'p2', '2026-07-31', '16:30', 180, 'scheduled', NULL,        'Confirmar teste de mecha.'),
  ('a14', 'c13', 'Cliente 13', 's3', 'Manicure',               'p3', '2026-07-31', '16:00',  60, 'cancelled', NULL,        'Cancelamento demonstrativo.'),
  ('a15', 'c14', 'Cliente 14', 's2', 'Corte + escova',         'p4', '2026-07-31', '17:00',  60, 'no-show',   NULL,        ''),
  ('b1',  NULL,  NULL,         NULL, NULL,                     'p1', '2026-07-31', '12:30',  60, 'blocked',   'Almoço',    NULL),
  ('b2',  NULL,  NULL,         NULL, NULL,                     'p2', '2026-07-31', '14:15',  30, 'blocked',   'Intervalo', NULL),
  ('w1',  'c15', 'Cliente 15', 's1', 'Coloração',              'p1', '2026-07-27', '09:00', 120, 'finished',  NULL,        ''),
  ('w2',  'c13', 'Cliente 13', 's3', 'Manicure',               'p3', '2026-07-28', '10:00',  60, 'finished',  NULL,        ''),
  ('w3',  'c7',  'Cliente 07', 's2', 'Corte + escova',         'p2', '2026-07-29', '14:00',  60, 'confirmed', NULL,        ''),
  ('w4',  'c5',  'Cliente 05', 's7', 'Escova modelada',        'p4', '2026-07-30', '11:00',  45, 'confirmed', NULL,        ''),
  ('w5',  'c4',  'Cliente 04', 's5', 'Hidratação profunda',    'p2', '2026-08-01', '10:00',  60, 'scheduled', NULL,        ''),
  ('w6',  'c3',  'Cliente 03', 's3', 'Manicure',               'p3', '2026-08-03', '13:30',  60, 'scheduled', NULL,        ''),
  ('m1',  'c6',  'Cliente 06', 's3', 'Manicure',               'p3', '2026-07-08', '15:00',  60, 'finished',  NULL,        ''),
  ('m2',  'c1',  'Cliente 01', 's1', 'Coloração',              'p1', '2026-07-14', '09:00', 120, 'finished',  NULL,        ''),
  ('m3',  'c12', 'Cliente 12', 's6', 'Progressiva',            'p2', '2026-07-21', '13:00', 180, 'finished',  NULL,        '');
