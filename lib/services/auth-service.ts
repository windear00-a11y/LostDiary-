import { createClient } from "@/lib/supabase";

const supabase = createClient();

export const authService = {
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
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
      console.error("Error signing up:", error);
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
      console.error("Error signing in:", error);
      throw error;
    }
  },

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

  async signInWithOtp(emailOrPhone: string) {
    try {
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(emailOrPhone);
      const { data, error } = await supabase.auth.signInWithOtp(
        isPhone 
          ? { phone: emailOrPhone } 
          : { email: emailOrPhone, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } }
      );
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  },

  async verifyOtp(emailOrPhone: string, token: string) {
    try {
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(emailOrPhone);
      const { data, error } = await supabase.auth.verifyOtp({
        [isPhone ? 'phone' : 'email']: emailOrPhone,
        token,
        type: isPhone ? 'sms' : 'email',
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error verifying OTP:", error);
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
      console.error("Error resetting password:", error);
      throw error;
    }
  },

  async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }
};
