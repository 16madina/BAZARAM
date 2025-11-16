-- Add badge fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS star_seller boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fast_responder boolean DEFAULT false;

-- Create function to update seller badges automatically
CREATE OR REPLACE FUNCTION public.update_seller_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update verified_seller badge
  -- Criteria: email verified + 5+ completed transactions + rating >= 4.0
  NEW.verified_seller := (
    NEW.email_verified = true AND
    NEW.total_sales >= 5 AND
    NEW.rating_average >= 4.0
  );
  
  -- Update star_seller badge
  -- Criteria: 20+ transactions + rating >= 4.5 + response rate >= 80%
  NEW.star_seller := (
    NEW.total_sales >= 20 AND
    NEW.rating_average >= 4.5 AND
    NEW.response_rate >= 80
  );
  
  -- Update fast_responder badge
  -- Criteria: avg response time <= 30 minutes + response rate >= 90%
  NEW.fast_responder := (
    NEW.avg_response_time_minutes IS NOT NULL AND
    NEW.avg_response_time_minutes <= 30 AND
    NEW.response_rate >= 90
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update badges on profile changes
DROP TRIGGER IF EXISTS trigger_update_seller_badges ON public.profiles;
CREATE TRIGGER trigger_update_seller_badges
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_badges();

-- Update existing profiles to recalculate badges
UPDATE public.profiles
SET updated_at = now()
WHERE id IS NOT NULL;