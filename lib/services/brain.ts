import { getImportanceScore } from "./response-engine";
import { profileService } from "./profile-service";

export const brain = {
  async shouldRespond(userId: string, message: { content: string, emotion?: string }, patterns?: any): Promise<boolean> {
    const profile = await profileService.getProfile(userId);
    const score = getImportanceScore(message);
    
    // threshold = 0.5 - (responsivenessLevel * 0.1) - (emotionalSensitivity * 0.1) + ((1 - engagementLevel) * 0.2)
    const threshold = 0.5 - (profile.responsivenessLevel * 0.1) - (profile.emotionalSensitivity * 0.1) + ((1 - profile.engagementLevel) * 0.2);
    const isRepeated = patterns && patterns.isPatternDetected;
    
    return score > threshold || !!isRepeated;
  }
};
