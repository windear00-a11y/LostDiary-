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

    // 2. Should Respond? (In a normal chat, we almost always respond)
    const shouldRespond = true; 

    // 3. Should Trigger Chapter?
    const shouldTriggerChapter = isImportantMessage({ content: message.content, type: message.type });

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
