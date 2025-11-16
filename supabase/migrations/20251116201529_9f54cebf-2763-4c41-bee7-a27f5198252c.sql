-- Migration de sécurité finale
-- Suppression de toutes les anciennes politiques avant d'en créer de nouvelles

-- 1. Supprimer toutes les politiques existantes sur profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public profile data is viewable by everyone" ON public.profiles;

-- 2. Créer une seule nouvelle politique pour profiles
CREATE POLICY "Everyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

-- Note: Les données sensibles (téléphone, etc.) doivent être filtrées au niveau de l'application

-- 3. Supprimer toutes les politiques existantes sur listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Public can view active listings without phone" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view their own listings with moderation status" ON public.listings;

-- 4. Créer de nouvelles politiques pour listings
CREATE POLICY "Anyone can view active approved listings"
ON public.listings FOR SELECT
USING (
  status = 'active' 
  AND (moderation_status IS NULL OR moderation_status = 'approved')
);

CREATE POLICY "Owners can view their own listings"
ON public.listings FOR SELECT
USING (auth.uid() = user_id);

-- 5. Supprimer l'ancienne politique UPDATE sur conversations si elle existe
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- 6. Créer une nouvelle politique UPDATE pour conversations
CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);