
export const NudgeService = {
  markNudgeShown: (type: 'chat' | 'journal') => {
    localStorage.setItem(`nudge_shown_${type}`, new Date().getTime().toString());
  },
  
  shouldShowNudge: (type: 'chat' | 'journal', inactivityThresholdHours: number): boolean => {
    const lastShown = localStorage.getItem(`nudge_shown_${type}`);
    if (!lastShown) return true;
    
    // Only nudge again if threshold passed (though the original logic only allowed once per mount, let's make it smarter)
    const lastShownTime = parseInt(lastShown);
    const now = new Date().getTime();
    const hoursPassed = (now - lastShownTime) / (1000 * 60 * 60);
    return hoursPassed > 12; // Example threshold: don't annoy user more than once every 12 hours
  }
};
