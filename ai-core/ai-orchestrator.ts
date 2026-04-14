import { profileService } from "@/lib/services/profile-service";
import { PatternReport, analyzeEntries } from "./pattern-detector";
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
    message: { content: string; type: string; role: string },
    patterns: PatternReport
  ): Promise<OrchestrationDecisions> {
    if (message.role !== 'user' || !message.content) {
      return { shouldExtractEvent: false, shouldRespond: false, shouldTriggerChapter: false };
    }

    // In a normal chat, we always want to respond to user messages
    const shouldRespond = true;

    // We can still extract events in the background if it's important
    const shouldExtractEvent = isImportantMessage({ content: message.content, type: message.type });
    const shouldTriggerChapter = shouldExtractEvent;

    return {
      shouldExtractEvent,
      shouldRespond,
      shouldTriggerChapter
    };
  }

  async processInteraction(input: PipelineInput): Promise<PipelineOutput> {
    console.log("[Orchestrator] Analyzing interaction for user:", input.userId);
    
    const patterns = analyzeEntries(input.contextMessages);
    const decisions = await this.makeDecisions(input.userId, input.message, patterns);

    console.log("[Orchestrator] Decisions:", decisions);

    return this.pipeline.runPipeline(input, decisions, patterns);
  }
}
