import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = "https://imtalpwzwfqxbgsuljql.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdGFscHd6d2ZxeGJnc3VsanFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDc5MjEsImV4cCI6MjA2NDMyMzkyMX0.zpiJflyya3RQhVrgrxjJRt1nqtv58z5IeZRSskxRyM4";

// Crear cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración para React Native
    storage: undefined, // Lo configuraremos después con AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Interfaces TypeScript para la base de datos
export interface ProcesoRemoto {
  id: string;
  titulo: string;
  descripcion: string;
  imagenes: ImagenProcesoRemoto[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ImagenProcesoRemoto {
  nombre: string;
  data: string; // Base64 para remotas, nombre para locales
  isLocal?: boolean; // true para require(), false para base64
  size?: number;
}

// Tipos para la respuesta de Supabase
export type SupabaseResponse<T> = {
  data: T | null;
  error: any;
};

console.log("✅ Cliente Supabase configurado correctamente");
