-- Migration: Add UTM tracking columns to leads table
ALTER TABLE public.leads 
ADD COLUMN utm_source text,
ADD COLUMN utm_medium text,
ADD COLUMN utm_campaign text,
ADD COLUMN utm_content text;
