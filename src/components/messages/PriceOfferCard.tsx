import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, X, ArrowLeftRight, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PriceOfferCardProps {
  messageId: string;
  userId: string;
  conversationId: string;
  listingId: string;
}

export const PriceOfferCard = ({ messageId, userId, conversationId, listingId }: PriceOfferCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: offer } = useQuery({
    queryKey: ['price-offer', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch all offers for this listing in this conversation for history
  const { data: offerHistory } = useQuery({
    queryKey: ['price-offers-history', conversationId, listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateOffer = useMutation({
    mutationFn: async (status: 'accepted' | 'rejected') => {
      if (!offer) return;

      const { error } = await supabase
        .from('price_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-offer', messageId] });
      queryClient.invalidateQueries({ queryKey: ['price-offers-history', conversationId, listingId] });
      toast({
        title: 'Offre mise à jour',
        description: 'Le statut de l\'offre a été modifié',
      });
    },
  });

  const createCounterOffer = useMutation({
    mutationFn: async () => {
      if (!offer) return;
      const amount = parseFloat(counterOfferAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Montant invalide');
      }

      // Update current offer status to counter
      await supabase
        .from('price_offers')
        .update({ status: 'counter' })
        .eq('id', offer.id);

      // Create message for counter offer
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: offer.sender_id,
          listing_id: listingId,
          conversation_id: conversationId,
          content: `Contre-offre: ${amount.toLocaleString()} FCFA`,
          message_type: 'price_offer',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create new counter offer
      const { error: offerError } = await supabase
        .from('price_offers')
        .insert({
          conversation_id: conversationId,
          listing_id: listingId,
          sender_id: userId,
          receiver_id: offer.sender_id,
          amount: amount,
          message_id: messageData.id,
        });

      if (offerError) throw offerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['price-offer', messageId] });
      queryClient.invalidateQueries({ queryKey: ['price-offers-history', conversationId, listingId] });
      setShowCounterOffer(false);
      setCounterOfferAmount('');
      toast({
        title: 'Contre-offre envoyée',
        description: 'Votre contre-offre a été envoyée',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!offer) return null;

  const isReceiver = offer.receiver_id === userId;
  const statusLabels = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    counter: 'Contre-offre',
  };

  return (
    <Card className="bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Offre: {offer.amount.toLocaleString()} FCFA
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={offer.status === 'accepted' ? 'default' : 'secondary'}>
              {statusLabels[offer.status as keyof typeof statusLabels]}
            </Badge>
            
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <History className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Historique des offres</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {offerHistory?.map((historyOffer) => (
                    <Card key={historyOffer.id} className={historyOffer.id === offer.id ? 'border-primary' : ''}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-sm">
                              {historyOffer.amount.toLocaleString()} FCFA
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {historyOffer.sender_id === userId ? 'Vous' : 'Autre personne'}
                            </p>
                          </div>
                          <Badge variant={historyOffer.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                            {statusLabels[historyOffer.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(historyOffer.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {isReceiver && offer.status === 'pending' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateOffer.mutate('accepted')}
                disabled={updateOffer.isPending}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateOffer.mutate('rejected')}
                disabled={updateOffer.isPending}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </div>
            
            {!showCounterOffer ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCounterOffer(true)}
                className="w-full"
              >
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                Faire une contre-offre
              </Button>
            ) : (
              <div className="space-y-2 p-3 bg-background rounded-lg border">
                <Input
                  type="number"
                  placeholder="Votre contre-offre..."
                  value={counterOfferAmount}
                  onChange={(e) => setCounterOfferAmount(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => createCounterOffer.mutate()}
                    disabled={createCounterOffer.isPending || !counterOfferAmount}
                    className="flex-1"
                  >
                    Envoyer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCounterOffer(false);
                      setCounterOfferAmount('');
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {offer.status === 'counter' && (
          <p className="text-sm text-muted-foreground">
            Une contre-offre a été faite
          </p>
        )}
      </CardContent>
    </Card>
  );
};
