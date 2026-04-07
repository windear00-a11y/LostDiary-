import { createClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const supabase = createClient();

export const authService = {
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      logger.error("Error getting user:", error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      logger.error("Error signing out:", error);
      throw error;
    }
  },

  async signUp(email: string, pass: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error signing up:", error);
      throw error;
    }
  },

  async signIn(email: string, pass: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error signing in:", error);
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
    } catch (error) {
      logger.error("Error resetting password:", error);
      throw error;
    }
  },

  async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (error) {
      logger.error("Error updating password:", error);
      throw error;
    }
  }
};
