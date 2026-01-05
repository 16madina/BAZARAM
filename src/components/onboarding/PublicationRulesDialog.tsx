import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ShieldCheck, Ban, FileWarning } from "lucide-react";

interface PublicationRulesDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const prohibitedItems = [
  {
    category: "Contenus illégaux",
    icon: Ban,
    items: [
      "Drogues et substances illicites",
      "Armes à feu et munitions",
      "Contrefaçons et produits piratés",
      "Documents officiels falsifiés",
      "Produits volés",
    ],
  },
  {
    category: "Contenus inappropriés",
    icon: AlertTriangle,
    items: [
      "Contenus pornographiques ou à caractère sexuel",
      "Contenus violents ou incitant à la haine",
      "Contenus discriminatoires",
      "Contenus diffamatoires ou injurieux",
    ],
  },
  {
    category: "Services interdits",
    icon: FileWarning,
    items: [
      "Services financiers non réglementés",
      "Jeux d'argent et paris illégaux",
      "Services d'escorte ou similaires",
      "Vente de données personnelles",
    ],
  },
  {
    category: "Autres restrictions",
    icon: ShieldCheck,
    items: [
      "Animaux sauvages ou espèces protégées",
      "Médicaments sur ordonnance",
      "Produits dangereux (explosifs, substances toxiques)",
      "Organes humains ou produits du corps",
    ],
  },
];

export function PublicationRulesDialog({
  open,
  onAccept,
  onCancel,
}: PublicationRulesDialogProps) {
  const [confirmations, setConfirmations] = useState({
    readRules: false,
    noProhibitedContent: false,
    acceptResponsibility: false,
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleConfirmationChange = (key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAccept = () => {
    if (allConfirmed) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Règles de publication
          </DialogTitle>
          <DialogDescription>
            Avant de publier votre annonce, veuillez lire et accepter nos règles
            de publication.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[50vh]">
          <div className="space-y-6 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5" />
                Contenus strictement interdits
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                La publication des contenus suivants est formellement interdite
                et entraînera la suppression immédiate de l'annonce et le
                bannissement du compte.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {prohibitedItems.map((category) => (
                  <div
                    key={category.category}
                    className="bg-background rounded-lg p-3 border"
                  >
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <category.icon className="h-4 w-4 text-muted-foreground" />
                      {category.category}
                    </h4>
                    <ul className="space-y-1">
                      {category.items.map((item) => (
                        <li
                          key={item}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-destructive mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-primary flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5" />
                Bonnes pratiques
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Utilisez des photos réelles de vos articles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Décrivez honnêtement l'état et les défauts éventuels
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Indiquez un prix juste et réaliste
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Répondez rapidement aux messages des acheteurs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Respectez les autres utilisateurs
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="readRules"
              checked={confirmations.readRules}
              onCheckedChange={() => handleConfirmationChange("readRules")}
            />
            <Label
              htmlFor="readRules"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              J'ai lu et compris les règles de publication
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="noProhibitedContent"
              checked={confirmations.noProhibitedContent}
              onCheckedChange={() =>
                handleConfirmationChange("noProhibitedContent")
              }
            />
            <Label
              htmlFor="noProhibitedContent"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              Mon annonce ne contient aucun contenu interdit
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptResponsibility"
              checked={confirmations.acceptResponsibility}
              onCheckedChange={() =>
                handleConfirmationChange("acceptResponsibility")
              }
            />
            <Label
              htmlFor="acceptResponsibility"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              Je comprends que la violation de ces règles entraînera la
              suppression de mon annonce et potentiellement le bannissement de
              mon compte
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleAccept} disabled={!allConfirmed}>
            Accepter et continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
