import { getSupabase } from "@/lib/supabase";

export const authService = {
  async getUser() {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        if (error.message === 'Auth session missing!') {
          return null;
        }
        throw error;
      }
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  async signInWithGoogle() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    try {
      // In AI Studio iFrame, a popup is often more reliable than a direct redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // We will handle the redirect ourselves in a popup
        },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Open the Google login in a popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url,
          'google-login',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
        );

        if (!popup) {
          throw new Error("Popup blocked! Please allow popups for this site.");
        }

        // Listen for the message from the callback page
        return new Promise((resolve, reject) => {
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data?.type === 'AUTH_COMPLETE') {
              window.removeEventListener('message', handleMessage);
              resolve(event.data);
            } else if (event.data?.type === 'AUTH_ERROR') {
              window.removeEventListener('message', handleMessage);
              reject(new Error(event.data.error || 'Login failed'));
            }
          };

          window.addEventListener('message', handleMessage);

          // Fallback: check if popup is closed
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              window.removeEventListener('message', handleMessage);
              // We don't necessarily reject here because the user might have finished
              // and the callback page might have sent the message already.
              // But we can resolve to trigger a refresh check.
              resolve({ type: 'POPUP_CLOSED' });
            }
          }, 1000);
        });
      }
      
      return data;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

};
