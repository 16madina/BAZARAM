import { useState, useEffect } from "react";

// Liste des images de hero disponibles
const HERO_IMAGES = [
  "/hero-marketplace-new.jpg", // Image actuelle
  // On pourra ajouter plus d'images plus tard
];

/**
 * Hook pour gérer la rotation des images de fond du hero
 * Change l'image à chaque nouvelle visite de la page
 */
export const useHeroCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    // Récupérer l'index de la dernière image vue
    const lastImageIndex = parseInt(localStorage.getItem('hero_image_index') || '0', 10);
    
    // Calculer le prochain index (rotation circulaire)
    const nextIndex = (lastImageIndex + 1) % HERO_IMAGES.length;
    
    // Sauvegarder le nouvel index
    localStorage.setItem('hero_image_index', nextIndex.toString());
    
    // Mettre à jour l'état
    setCurrentImageIndex(nextIndex);
  }, []); // Exécuté une seule fois au montage
  
  return {
    currentImage: HERO_IMAGES[currentImageIndex],
    imageIndex: currentImageIndex,
  };
};
