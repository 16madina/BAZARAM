import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { sendNotification } from "../_shared/send-notification.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  schema: string;
  old_record: any | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook:', payload);

    if (payload.type !== 'INSERT' || payload.table !== 'reviews') {
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const review = payload.record;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer les infos du reviewer
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', review.reviewer_id)
      .single();

    // Récupérer le titre de l'annonce
    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', review.listing_id)
      .single();

    const reviewerName = reviewerProfile?.full_name || 'Un utilisateur';
    const listingTitle = listing?.title || 'votre annonce';
    const stars = '⭐'.repeat(review.rating);

    // Envoyer la notification push
    await sendNotification({
      userId: review.reviewee_id,
      title: '⭐ Nouvel avis reçu',
      body: `${reviewerName} a laissé un avis ${stars} sur "${listingTitle}"`,
      notificationType: 'review',
      metadata: {
        review_id: review.id,
        listing_id: review.listing_id,
        reviewer_id: review.reviewer_id,
        rating: review.rating,
        route: `/listing/${review.listing_id}`,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
