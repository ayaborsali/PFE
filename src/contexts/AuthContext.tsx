import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Utilisateurs de démonstration
const demoUsers = {
  'manager@rh.com': {
    password: 'rh123',
    profile: {
      id: 'demo-manager-001',
      email: 'manager@rh.com',
      full_name: 'John Manager',
      role: 'manager',
      department: 'Marketing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  'rh@entreprise.com': {
    password: 'rh123',
    profile: {
      id: 'demo-rh-001',
      email: 'rh@entreprise.com',
      full_name: 'Sarah RH',
      role: 'rh',
      department: 'Ressources Humaines',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  'directeur@entreprise.com': {
    password: 'directeur123',
    profile: {
      id: 'demo-directeur-001',
      email: 'directeur@entreprise.com',
      full_name: 'Pierre Directeur',
      role: 'directeur',
      department: 'Direction',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  'daf@entreprise.com': {
    password: 'daf123',
    profile: {
      id: 'demo-daf-001',
      email: 'daf@entreprise.com',
      full_name: 'Marie DAF',
      role: 'daf',
      department: 'Finances',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  'dga@entreprise.com': {
    password: 'dga123',
    profile: {
      id: 'demo-dga-001',
      email: 'dga@entreprise.com',
      full_name: 'Paul DGA',
      role: 'dga',
      department: 'Direction Générale',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  'dg@entreprise.com': {
    password: 'dg123',
    profile: {
      id: 'demo-dg-001',
      email: 'dg@entreprise.com',
      full_name: 'Jean DG',
      role: 'dg',
      department: 'Direction Générale',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDemoAuth = () => {
      const storedAuth = localStorage.getItem('demo_auth');
      if (storedAuth) {
        try {
          const { user: storedUser, profile: storedProfile } = JSON.parse(storedAuth);
          setUser(storedUser);
          setProfile(storedProfile);
          setLoading(false);
          return true;
        } catch (error) {
          console.error('Error parsing demo auth:', error);
          localStorage.removeItem('demo_auth');
        }
      }
      return false;
    };

    // Vérifier d'abord le mode démo
    const hasDemoAuth = checkDemoAuth();
    
    // Si pas de session démo, vérifier Supabase
    if (!hasDemoAuth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        (async () => {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        })();
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Vérifier mode démo
    const demoUser = demoUsers[email];
    if (demoUser && demoUser.password === password) {
      // Créer un objet user compatible avec Supabase
      const mockUser: User = {
        id: demoUser.profile.id,
        email: demoUser.profile.email,
        user_metadata: { role: demoUser.profile.role },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString(),
        is_anonymous: false,
        phone: '',
        identities: []
      } as User;

      setUser(mockUser);
      setProfile(demoUser.profile);
      setLoading(false);
      
      // Stocker en localStorage pour persister
      localStorage.setItem('demo_auth', JSON.stringify({
        user: mockUser,
        profile: demoUser.profile
      }));
      
      return;
    }

    // Si pas d'utilisateur démo, utiliser Supabase
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    // Nettoyer le mode démo
    localStorage.removeItem('demo_auth');
    
    // Déconnexion Supabase si connecté
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}