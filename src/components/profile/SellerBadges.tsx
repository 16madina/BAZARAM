import { Badge } from "@/components/ui/badge";
import { Shield, Star, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SellerBadgesProps {
  profile: {
    email_verified?: boolean;
    verified_seller?: boolean;
    star_seller?: boolean;
    fast_responder?: boolean;
    total_sales?: number;
    rating_average?: number;
    response_rate?: number;
    avg_response_time_minutes?: number;
  };
  size?: "sm" | "md" | "lg";
}

export const SellerBadges = ({ profile, size = "md" }: SellerBadgesProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const badgeSize = size === "sm" ? "text-xs px-2 py-0.5" : size === "md" ? "text-sm px-3 py-1" : "text-base px-4 py-1.5";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        {/* Vendeur vérifié */}
        {profile.verified_seller && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="default" 
                className={`flex items-center gap-1 bg-blue-600 hover:bg-blue-700 ${badgeSize}`}
              >
                <Shield className={iconSize} />
                Vendeur vérifié
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Vendeur vérifié</p>
                <p>✓ Email vérifié</p>
                <p>✓ {profile.total_sales}+ transactions complétées</p>
                <p>✓ Note moyenne: {profile.rating_average?.toFixed(1)}/5</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Vendeur étoile */}
        {profile.star_seller && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="default" 
                className={`flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 ${badgeSize}`}
              >
                <Star className={iconSize} />
                Vendeur étoile
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Vendeur étoile ⭐</p>
                <p>✓ {profile.total_sales}+ transactions</p>
                <p>✓ Note excellente: {profile.rating_average?.toFixed(1)}/5</p>
                <p>✓ Taux de réponse: {profile.response_rate?.toFixed(0)}%</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Réponse rapide */}
        {profile.fast_responder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="default" 
                className={`flex items-center gap-1 bg-green-600 hover:bg-green-700 ${badgeSize}`}
              >
                <Zap className={iconSize} />
                Réponse rapide
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Réponse rapide ⚡</p>
                <p>✓ Répond en moins de 30 minutes</p>
                <p>✓ Taux de réponse: {profile.response_rate?.toFixed(0)}%</p>
                <p>Temps moyen: {profile.avg_response_time_minutes} min</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Nouveau vendeur */}
        {!profile.verified_seller && profile.total_sales === 0 && (
          <Badge variant="secondary" className={`flex items-center gap-1 ${badgeSize}`}>
            Nouveau vendeur
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};
