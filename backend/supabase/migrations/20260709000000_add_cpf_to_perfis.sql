-- Migration: Adiciona campo CPF à tabela perfis

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
