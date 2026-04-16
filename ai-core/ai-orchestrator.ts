import { coreService } from "@/lib/services/core-service";
import { PipelineController, PipelineInput, PipelineOutput } from "./pipeline-controller";
import { isImportantMessage } from "@/lib/utils/importance";

export interface OrchestrationDecisions {
  shouldExtractEvent: boolean;
  shouldRespond: boolean;
  shouldTriggerChapter: boolean;
}

export class AIOrchestrator {
  private pipeline: PipelineController;

  constructor(apiKey: string) {
    this.pipeline = new PipelineController(apiKey);
  }

  private async makeDecisions(
    userId: string,
    message: { content: string; type: string; role: string }
  ): Promise<OrchestrationDecisions> {
    if (message.role !== 'user' || !message.content) {
      return { shouldExtractEvent: false, shouldRespond: false, shouldTriggerChapter: false };
    }

    // 1. Should Extract Event?
    const shouldExtractEvent = isImportantMessage({ content: message.content, type: message.type });

    // 2. Should Respond?
    const profile = await coreService.getProfile(userId);
    
    let score = 0;
    if (message.content.length > 80) score += 0.3;
    if (message.type !== "text") score += 0.2;
    if (message.content.includes("?")) score += 0.2;
    
    const threshold = 0.5 - (profile.responsiveness_level * 0.1) - (profile.emotional_sensitivity * 0.1) + ((1 - profile.engagement_level) * 0.2);
    
    const shouldRespond = score > threshold;

    // 3. Should Trigger Chapter?
    const shouldTriggerChapter = shouldExtractEvent;

    return {
      shouldExtractEvent,
      shouldRespond,
      shouldTriggerChapter
    };
  }

  async processInteraction(input: PipelineInput): Promise<PipelineOutput> {
    console.log("[Orchestrator] Analyzing interaction for user:", input.userId);
    
    const decisions = await this.makeDecisions(input.userId, input.message);

    console.log("[Orchestrator] Decisions:", decisions);

    return this.pipeline.runPipeline(input, decisions);
  }
}
