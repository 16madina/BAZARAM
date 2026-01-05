import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Search, RefreshCw, MessageSquareOff, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface BannedWord {
  id: string;
  word: string;
  severity: string;
  created_at: string;
  created_by: string | null;
}

export const BannedWordsManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [newWord, setNewWord] = useState("");
  const [newSeverity, setNewSeverity] = useState("high");
  const [editingWord, setEditingWord] = useState<BannedWord | null>(null);
  const [editedWord, setEditedWord] = useState("");
  const [editedSeverity, setEditedSeverity] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch banned words
  const { data: bannedWords, isLoading, refetch } = useQuery({
    queryKey: ["banned-words"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_words")
        .select("*")
        .order("severity", { ascending: false })
        .order("word", { ascending: true });
      if (error) throw error;
      return data as BannedWord[];
    },
  });

  // Add word mutation
  const addWordMutation = useMutation({
    mutationFn: async ({ word, severity }: { word: string; severity: string }) => {
      const { error } = await supabase
        .from("banned_words")
        .insert({ word: word.toLowerCase().trim(), severity });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast.success("Mot interdit ajouté");
      setNewWord("");
      setNewSeverity("high");
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Ce mot existe déjà");
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    },
  });

  // Update word mutation
  const updateWordMutation = useMutation({
    mutationFn: async ({ id, word, severity }: { id: string; word: string; severity: string }) => {
      const { error } = await supabase
        .from("banned_words")
        .update({ word: word.toLowerCase().trim(), severity })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast.success("Mot modifié");
      setEditingWord(null);
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  // Delete word mutation
  const deleteWordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banned_words")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast.success("Mot supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  // Filter words
  const filteredWords = bannedWords?.filter(word => {
    const matchesSearch = searchTerm === "" || word.word.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || word.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  }) || [];

  // Stats
  const stats = {
    total: bannedWords?.length || 0,
    high: bannedWords?.filter(w => w.severity === "high").length || 0,
    medium: bannedWords?.filter(w => w.severity === "medium").length || 0,
    low: bannedWords?.filter(w => w.severity === "low").length || 0,
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-3 w-3" />;
      case "medium":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getSeverityVariant = (severity: string): "destructive" | "default" | "secondary" => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleEdit = (word: BannedWord) => {
    setEditingWord(word);
    setEditedWord(word.word);
    setEditedSeverity(word.severity);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{stats.high}</p>
              <p className="text-xs text-muted-foreground">Haute</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50">
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.medium}</p>
              <p className="text-xs text-muted-foreground">Moyenne</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/50">
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.low}</p>
              <p className="text-xs text-muted-foreground">Basse</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un mot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un mot interdit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mot ou expression</label>
                    <Input
                      placeholder="Ex: arnaque, contrefaçon..."
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sévérité</label>
                    <Select value={newSeverity} onValueChange={setNewSeverity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Haute - Bloque la publication
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            Moyenne - Avertissement
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            Basse - Surveillance
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => addWordMutation.mutate({ word: newWord, severity: newSeverity })}
                    disabled={!newWord.trim() || addWordMutation.isPending}
                  >
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Words List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareOff className="h-5 w-5" />
            Mots interdits ({filteredWords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun mot trouvé
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredWords.map((word) => (
                <div
                  key={word.id}
                  className="group flex items-center gap-1 bg-muted rounded-lg px-3 py-2 hover:bg-muted/80 transition-colors"
                >
                  <Badge variant={getSeverityVariant(word.severity)} className="flex items-center gap-1">
                    {getSeverityIcon(word.severity)}
                    {word.word}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(word)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce mot ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le mot "{word.word}" sera supprimé de la liste des mots interdits.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteWordMutation.mutate(word.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le mot interdit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mot ou expression</label>
              <Input
                value={editedWord}
                onChange={(e) => setEditedWord(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sévérité</label>
              <Select value={editedSeverity} onValueChange={setEditedSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Haute
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Moyenne
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      Basse
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => {
                if (editingWord) {
                  updateWordMutation.mutate({ 
                    id: editingWord.id, 
                    word: editedWord, 
                    severity: editedSeverity 
                  });
                }
              }}
              disabled={!editedWord.trim() || updateWordMutation.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
