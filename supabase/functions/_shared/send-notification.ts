import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  notificationType: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(params: SendNotificationParams) {
  const { userId, title, body, notificationType, metadata = {} } = params;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // Récupérer le push token de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    // Si l'utilisateur a un token push, envoyer la notification
    if (profile?.push_token) {
      // Appeler l'edge function send-push-notification
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          body,
          data: {
            type: notificationType,
            ...metadata,
          },
        },
      });

      if (pushError) {
        console.error('Error sending push notification:', pushError);
      } else {
        console.log('Push notification sent successfully to user:', userId);
      }
    } else {
      console.log('User has no push token, skipping push notification');
    }
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
}
