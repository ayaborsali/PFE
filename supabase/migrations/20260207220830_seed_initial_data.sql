/*
  # Seed Initial Data

  ## Overview
  This migration adds initial data for testing the Kilani Groupe HR system.

  ## Data Added
  - Sample sites (Tunis, Sfax)
  - Sample departments (RH, IT, Finance, Commercial)
  - Sample user profiles with different roles

  ## Notes
  - This is for demonstration purposes
  - Passwords should be created through Supabase Auth signup
*/

-- Insert sample sites
INSERT INTO sites (id, name, address) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Siège Social - Tunis', 'Avenue Habib Bourguiba, Tunis'),
  ('22222222-2222-2222-2222-222222222222', 'Agence Sfax', 'Route de Tunis, Sfax')
ON CONFLICT (id) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (id, name, director_id) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Ressources Humaines', NULL),
  ('44444444-4444-4444-4444-444444444444', 'Technologies de l''Information', NULL),
  ('55555555-5555-5555-5555-555555555555', 'Finance et Comptabilité', NULL),
  ('66666666-6666-6666-6666-666666666666', 'Commercial et Ventes', NULL)
ON CONFLICT (id) DO NOTHING;