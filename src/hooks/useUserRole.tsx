import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "patient" | "specialist" | "local_provider" | "admin";

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  userId: string | null;
}

export const useUserRole = (): UserRoleData => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          if (data) {
            setRole(data.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        fetchUserRole();
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, userId, loading };
};
