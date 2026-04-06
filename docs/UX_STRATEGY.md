# WinDear Soul: UX Strategy & Architecture

## 1. Step-by-Step UX Flow

### First-Time User Flow (Frictionless Onboarding)
1. **Landing:** User lands on the app. No login wall. The chat interface is immediately visible and focused.
2. **Empty State:** The assistant greets them and provides a clear example: *"I feel stuck and unmotivated lately..."*
3. **First Interaction:** User types their first thought.
4. **AI Response:** The AI responds using the structured format (Emotional Understanding → Insight → Follow-up Question).
5. **Soft Signup Prompt (After 2 Messages):** After the user experiences the value (2nd interaction), a non-intrusive bottom sheet or inline message appears: *"Save your insights and track your emotional journey. Create a free account to keep your diary encrypted and private."*

### Core Loop (Retention)
1. **Trigger:** Daily check-in notification or organic visit.
2. **Action (Write):** User writes a thought or selects a quick-start chip ("Analyze my mood").
3. **Reward (AI Insight):** AI provides immediate emotional validation and a pattern observation.
4. **Investment (Reflection):** AI asks a follow-up question, prompting the user to think deeper and continue the chat.

## 2. State Transitions

| State | Trigger | Transition / UI Change |
| :--- | :--- | :--- |
| **Anonymous Chat** | First visit | Show chat UI, generate temporary session ID. |
| **Soft Signup** | 2nd message sent | Slide up bottom sheet with Google/Email login. Chat remains visible behind overlay. |
| **Authenticated** | Successful login | Merge anonymous session with user account. Show "Daily Streak" in header. |
| **Daily Check-in** | First visit of the day | Show optional mood selector (5 emojis) above chat input. |
| **Insight Summary** | End of week (Sunday) | Replace empty state with a "Weekly Insight Card" summarizing trends. |

## 3. Feature Priority

### MVP (Immediate Focus)
*   **Frictionless Chat:** Instant access without login.
*   **Structured AI Responses:** Enforced 3-part structure (Empathy, Insight, Question).
*   **Trust Layer:** "Your data is private & encrypted" messaging.
*   **Soft Signup:** Prompt after 2 messages.

### Fast Follow (Next 2-4 Weeks)
*   **Daily Habit System:** Mood selector before the first message of the day and a visual streak counter (e.g., 🔥 3 Day Streak).
*   **Weekly Summaries:** Automated Sunday summaries of emotional trends.

### Later (Future Enhancements)
*   **Pattern Detection Dashboard:** A dedicated view for long-term emotional trends.
*   **Push Notifications:** Gentle reminders for daily check-ins.

## 4. Simple System Design (No Overengineering)

*   **Frontend (Next.js + Tailwind):** 
    *   Use local storage for the anonymous session ID and the first 2 messages.
    *   React state manages the "Soft Signup" modal visibility.
*   **Backend (Supabase):**
    *   `entries` table: Stores messages. Add an `is_anonymous` boolean and `session_id`.
    *   Upon login, update `entries` where `session_id` matches the local storage ID to the new `user_id`.
*   **AI Orchestration (Gemini API):**
    *   Use strict system prompts to enforce the 3-part response structure.
    *   Keep context windows small (last 10-20 messages) to reduce latency and cost.
*   **Habit Tracking:**
    *   `profiles` table: Add `current_streak` (int) and `last_check_in` (timestamp).
    *   Update streak on the first message of the day.

## Focus: Making Users Come Back Daily
The key to retention is **immediate value** and **low friction**. By removing the login wall, we let users experience the "aha" moment (the AI's empathy and insight) before asking for commitment. The follow-up question at the end of every AI response creates an open loop, naturally pulling the user into a continued conversation.
