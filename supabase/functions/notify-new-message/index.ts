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

    if (payload.type !== 'INSERT' || payload.table !== 'messages') {
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const message = payload.record;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer les infos du sender
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', message.sender_id)
      .single();

    // Récupérer le titre de l'annonce
    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', message.listing_id)
      .single();

    const senderName = senderProfile?.full_name || 'Un utilisateur';
    const listingTitle = listing?.title || 'votre annonce';

    // Envoyer la notification push
    await sendNotification({
      userId: message.receiver_id,
      title: '💬 Nouveau message',
      body: `${senderName} vous a envoyé un message concernant "${listingTitle}"`,
      notificationType: 'message',
      metadata: {
        conversation_id: message.conversation_id,
        listing_id: message.listing_id,
        sender_id: message.sender_id,
        route: `/messages?conversation=${message.conversation_id}`,
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
