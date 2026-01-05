-- Add UPDATE policy for banned_words table
CREATE POLICY "Admins can update banned words" 
ON public.banned_words 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));