-- Migration: Add fbclid tracking column to leads table
ALTER TABLE public.leads 
ADD COLUMN fbclid text;
