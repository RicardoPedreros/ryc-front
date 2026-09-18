--
-- PostgreSQL database dump
--

\restrict VunE49NnvAuqUn4558E49C4nxtdsmvzSlNvJdKEtdvyjFc5cvjWNJP5rryZo6xZ

-- Dumped from database version 18.6 (6569466)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: assistant_prompt_cooldowns; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.roles VALUES ('3c552f88-9954-4b35-a8ba-a7b9d45464b6', 'ADMIN', 'Administrador', 'Acceso completo al sistema.', '2026-09-18 19:43:18.972865');
INSERT INTO public.roles VALUES ('871a5ee5-e5d4-4405-841b-93fd517d5f62', 'USER', 'Usuario', 'Usuario estándar del hogar.', '2026-09-18 19:43:18.972865');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.users VALUES ('40525e03-3b8c-47a6-b78e-dffdd2d62486', '871a5ee5-e5d4-4405-841b-93fd517d5f62', 'user1', '$2a$12$UpcVdFbT.JkE0mvyQdRCAeUqsgAVMBfzZlSQxmgf1z18.VP9Cmz5G', 'Usuario 1', 'Sistema', true, NULL, '2026-09-18 19:43:19.452024');
INSERT INTO public.users VALUES ('ed91dc6f-3d50-46f0-a344-83f58ce98671', '871a5ee5-e5d4-4405-841b-93fd517d5f62', 'user2', '$2a$12$JBlO0IbKhyNPKrM9.ZgqZeoItDV2VuoykXtFyyDAphPoZXSrR2J8S', 'Usuario 2', 'Sistema', true, NULL, '2026-09-18 19:43:19.830084');
INSERT INTO public.users VALUES ('2c930168-05bf-49e7-bce4-4c0618e9f365', '3c552f88-9954-4b35-a8ba-a7b9d45464b6', 'admin', '$2a$12$Vtff5ZsaEOIYcD8k6RDsBulo5yI49t/B9Sv0D/StahLr5C8Oh.lAm', 'Administrador', 'Sistema', true, '2026-09-18 20:36:46.745424', '2026-09-18 19:43:19.074083');


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.brands VALUES ('72b6c636-ccf7-4703-a975-c01a62509e70', NULL, 'Oral-B', '/api/market/brand-logo?domain=oralb.com&source=logo-dev', NULL, '2c930168-05bf-49e7-bce4-4c0618e9f365', '2026-09-18 20:37:05.45785');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.categories VALUES ('55a6a1a0-7b76-4e31-8edf-fb58b77e781b', NULL, 'Alimentos', 'utensils', '#22C55E', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('cf7130d3-5718-417d-bdca-14b0430ba586', NULL, 'Bebidas', 'glass-water', '#3B82F6', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('4c1ba574-b42a-4352-bd0a-aae482901523', NULL, 'Limpieza del hogar', 'spray-can', '#06B6D4', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('867b9c06-64e5-48a6-a599-9627aa3d84af', NULL, 'Lavandería', 'shirt', '#0EA5E9', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('90b539b6-5756-4efd-8f2b-c29433a32351', NULL, 'Cuidado personal', 'heart-pulse', '#EC4899', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('b64a08c0-4bf0-4992-8745-6a54e3345e5e', NULL, 'Salud', 'cross', '#EF4444', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('a69b56ca-0ee8-4e85-93ba-f2816d1d1ec4', NULL, 'Bebés', 'baby', '#F59E0B', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('5cf5b6ab-9f41-4f23-a3a1-5d9e1497a10d', NULL, 'Mascotas', 'paw-print', '#A855F7', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('a1053b68-9256-4beb-9a1b-bbbcf95535fb', NULL, 'Cocina', 'chef-hat', '#F97316', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('e1f13546-f13c-4db8-b66d-729fcbac44ae', NULL, 'Productos de papel', 'file-text', '#64748B', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('3429c330-2935-4988-8d2c-5f5a14d1bb1c', NULL, 'Hogar', 'house', '#10B981', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('d83a074c-c9f0-469a-aca6-4c1ea699634b', NULL, 'Electrónica', 'plug', '#6366F1', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('f696d4b0-2d6d-4067-9cfc-04500bd1908c', NULL, 'Oficina', 'briefcase', '#8B5CF6', NULL, '2026-09-18 19:43:24.353901');
INSERT INTO public.categories VALUES ('be8583a3-61ae-4c52-8eda-e7897314dc27', NULL, 'Otros', 'package', '#6B7280', NULL, '2026-09-18 19:43:24.353901');


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.units VALUES ('5b463c18-8cf1-4369-a0b4-e133f08fc57e', NULL, 1.0000, 'Unidad', 'und', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('0ff640fd-60f4-4cfe-bd51-39fa079e8203', NULL, 1.0000, 'Gramo', 'g', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('ed9f29f0-d8d9-4463-a3fe-6a05d154d58e', NULL, 1.0000, 'Litro', 'L', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('cbd882ed-ef5c-4c01-92c4-d7bdfa827964', NULL, 1.0000, 'Paquete', 'paq', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('0160af9e-fbc6-4894-9bde-1a8021a16c9e', NULL, 1.0000, 'Caja', 'caja', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('068b6984-5869-4bfc-afb4-d28d11a7912a', NULL, 1.0000, 'Bolsa', 'bolsa', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('5120150b-8380-4082-ae8f-cc380e01128c', NULL, 1.0000, 'Botella', 'bot', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('ca4cc251-3d56-49ae-b4e3-b955347acd2d', NULL, 1.0000, 'Lata', 'lata', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('ddb17d11-068e-4c0d-a2c5-20cd261ac993', NULL, 1.0000, 'Frasco', 'frasco', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('07fe1913-51a1-4589-a99a-4f4ff4b12f4d', NULL, 1.0000, 'Tubo', 'tubo', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('0f319e6f-a64d-423d-bcab-f98e024cc789', NULL, 1.0000, 'Rollo', 'rollo', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('20ab212a-cf0a-461e-83d5-d95a7649a67a', NULL, 1.0000, 'Par', 'par', NULL, '2026-09-18 19:43:24.139732');
INSERT INTO public.units VALUES ('e20bf535-68a4-4e7c-8492-3dcc45ea224d', '0ff640fd-60f4-4cfe-bd51-39fa079e8203', 1000.0000, 'Kilogramo', 'kg', NULL, '2026-09-18 19:43:24.238177');
INSERT INTO public.units VALUES ('ce2e891d-6e43-404d-9dbf-051712d63652', 'ed9f29f0-d8d9-4463-a3fe-6a05d154d58e', 0.0010, 'Mililitro', 'ml', NULL, '2026-09-18 19:43:24.238177');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: inventory_balance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: movement_types; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.movement_types VALUES ('a7657352-16c7-43a8-ad32-c4153e83cfa3', 'INITIAL_STOCK', 'Inventario inicial', 1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('844e547a-9a1d-4d0e-9a46-c46c65558264', 'PURCHASE', 'Compra', 1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('719a8811-dc16-40c5-ae9e-c01a853d719b', 'CONSUMPTION', 'Consumo', -1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('2afbd88f-6c3a-4bff-9c01-76a75026172d', 'LOSS', 'Pérdida', -1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('48301df8-a748-4d5d-b67e-d7c1fef0cf05', 'DONATION', 'Donación', -1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('999b38ae-2772-4af6-9d1e-f3792bceec56', 'EXPIRED', 'Producto vencido', -1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('7b09a14a-abde-45c9-a181-e07094994a4a', 'ADJUSTMENT_IN', 'Ajuste de inventario (+)', 1, NULL, '2026-09-18 19:43:23.939133');
INSERT INTO public.movement_types VALUES ('9b92a626-e98d-44ca-82ea-08f4de9b0f05', 'ADJUSTMENT_OUT', 'Ajuste de inventario (-)', -1, NULL, '2026-09-18 19:43:23.939133');


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.payment_methods VALUES ('add2f6a0-95b5-4f0f-9124-76e4c3f565b4', 'CASH', 'Efectivo', NULL, '2026-09-18 19:43:24.042006');
INSERT INTO public.payment_methods VALUES ('108afc7c-9248-4f60-bc9b-0777eabafb2e', 'DEBIT_CARD', 'Tarjeta débito', NULL, '2026-09-18 19:43:24.042006');
INSERT INTO public.payment_methods VALUES ('9b4c792b-89e5-41c6-83b7-b35a211bf2b2', 'CREDIT_CARD', 'Tarjeta crédito', NULL, '2026-09-18 19:43:24.042006');
INSERT INTO public.payment_methods VALUES ('7585a084-16a4-4a2f-bc52-a0ef1a98966c', 'TRANSFER', 'Transferencia', NULL, '2026-09-18 19:43:24.042006');
INSERT INTO public.payment_methods VALUES ('49f250a5-a929-445e-a489-e9523b80823f', 'DIGITAL_WALLET', 'Billetera digital', NULL, '2026-09-18 19:43:24.042006');
INSERT INTO public.payment_methods VALUES ('bd387625-48c5-4a83-8132-e37315510424', 'OTHER', 'Otro', NULL, '2026-09-18 19:43:24.042006');


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- PostgreSQL database dump complete
--

\unrestrict VunE49NnvAuqUn4558E49C4nxtdsmvzSlNvJdKEtdvyjFc5cvjWNJP5rryZo6xZ

