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

  constructor(apiKey: string, persona?: string) {
    this.pipeline = new PipelineController(apiKey, persona);
  }

  private async makeDecisions(
    userId: string,
    message: { content: string; type: string; role: string },
    options?: { isJournal?: boolean }
  ): Promise<OrchestrationDecisions> {
    if (message.role !== 'user' || !message.content) {
      return { shouldExtractEvent: false, shouldRespond: false, shouldTriggerChapter: false };
    }

    // 1. Should Extract Event?
    const shouldExtractEvent = options?.isJournal || isImportantMessage({ content: message.content, type: message.type });

    // 2. Should Respond? (Journals don't need instant chat replies)
    const shouldRespond = options?.isJournal ? false : true; 

    // 3. Should Trigger Chapter?
    const shouldTriggerChapter = options?.isJournal || isImportantMessage({ content: message.content, type: message.type });

    return {
      shouldExtractEvent,
      shouldRespond,
      shouldTriggerChapter
    };
  }

  async processInteraction(input: PipelineInput, options?: { isJournal?: boolean }): Promise<PipelineOutput> {
    console.log("[Orchestrator] Analyzing interaction for user:", input.userId);
    
    const decisions = await this.makeDecisions(input.userId, input.message, options);

    console.log("[Orchestrator] Decisions:", decisions);

    return this.pipeline.runPipeline(input, decisions);
  }
}
