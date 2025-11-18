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

    if (payload.type !== 'INSERT' || payload.table !== 'followers') {
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const follow = payload.record;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer les infos du follower
    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', follow.follower_id)
      .single();

    const followerName = followerProfile?.full_name || 'Un utilisateur';

    // Envoyer la notification push
    await sendNotification({
      userId: follow.followed_id,
      title: '👤 Nouvel abonné',
      body: `${followerName} a commencé à vous suivre`,
      notificationType: 'follower',
      metadata: {
        follower_id: follow.follower_id,
        follow_id: follow.id,
        route: `/seller/${follow.follower_id}`,
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
