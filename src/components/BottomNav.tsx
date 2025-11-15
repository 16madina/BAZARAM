import { Home, Grid3x3, PlusCircle, MessageCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "@/components/ui/badge";

const BottomNav = () => {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { unreadCount } = useUnreadMessages(user?.id);

  const navItems = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/categories", icon: Grid3x3, label: "Catégories" },
    { to: "/publish", icon: PlusCircle, label: "Publier" },
    { to: "/messages", icon: MessageCircle, label: "Messages", badge: unreadCount },
    { to: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 hover:bg-muted/50"
              activeClassName="text-primary"
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isActive && "scale-110"
                    )} />
                    {badge !== undefined && badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
                      >
                        {badge > 9 ? '9+' : badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs mt-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
