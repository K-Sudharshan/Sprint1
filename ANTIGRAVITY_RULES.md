# ANTIGRAVITY RULES
### Highest-Priority Engineering Instruction Set for the 5-Hour Hackathon Build

---

# Core Operating Principle

AntiGravity must follow this strict priority hierarchy at all times:

1. **Official Problem Statement** (`PS-Sprint1.pdf`)
2. **Product Specification** (`PRODUCT_SPEC.md`)
3. **Agent Architecture** (`AGENT_ARCHITECTURE.md`)
4. **Implementation Plan** (`IMPLEMENTATION_PLAN.md`)
5. **AntiGravity Rules** (this document)
6. **User's explicit instructions during development**

If two documents appear to conflict, AntiGravity must **identify the conflict explicitly and prioritize the higher-level source** — it must never silently pick one interpretation and proceed as if no conflict existed. The official problem statement is the ultimate source of truth; nothing built during this sprint may satisfy a lower-priority document at the expense of a higher one.

---

# 1. Mission and Operating Context

This is a **5-hour hackathon build**, not a production engagement. AntiGravity must internalize the following operating context before writing any code:

- **Working functionality is more important than feature quantity.** A judge can score a working recommendation pipeline; a judge cannot score a feature list.
- **A complete vertical slice is more valuable than many incomplete features.** One full path from user input to a personalized, cited recommendation beats five half-built subsystems.
- **The architecture must remain hackathon-appropriate.** Every design decision is filtered through "can this be built and demoed reliably in the remaining time," not "how would this look in production."
- **Every implementation decision must support an official requirement.** If a change does not trace back to a minimum requirement in `PS-Sprint1.pdf`, a feature in `PRODUCT_SPEC.md`, or a component in `AGENT_ARCHITECTURE.md`, it does not belong in this build.
- **The system must be demonstrable end-to-end at all times, past the mandatory MVP checkpoint.** Once a complete pipeline exists, it must never be broken by a subsequent change without a working replacement ready before that change is considered done.

AntiGravity operates as a disciplined executor of an already-decided plan — not as an independent architect free to redesign the system mid-build.

---

# 2. Mandatory Pre-Implementation Protocol

Before writing or modifying any code, AntiGravity MUST:

1. Read all provided specification files completely — `PS-Sprint1.pdf`, `PRODUCT_SPEC.md`, `AGENT_ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, and this document.
2. Extract the official minimum requirements and keep them in mind as the acceptance bar for the entire build.
3. Inspect the existing repository structure before assuming anything about what exists.
4. Inspect `package.json` (or the equivalent manifest for the project's stack).
5. Identify the current framework and dependencies already in use.
6. Identify existing working functionality — what already runs correctly must be treated as a protected baseline.
7. Identify missing environment variables required for the current task.
8. Create a short internal implementation plan for the current task before making changes.
9. Determine the **smallest implementation** required to satisfy the current task's requirement.

AntiGravity must NOT immediately start generating large amounts of code without first completing this protocol. Skipping this step is a rule violation even if the resulting code happens to work.

---

# 3. Strict Scope Control

AntiGravity MUST NOT:

- Add features not required by the specifications or explicitly requested by the user.
- Expand scope "for completeness."
- Introduce authentication unless explicitly required.
- Add databases unless required by the current implementation.
- Add microservices.
- Add Docker.
- Add Kubernetes.
- Add unnecessary state-management libraries.
- Add unnecessary backend infrastructure.
- Add analytics platforms.
- Add payment systems.
- Add user accounts unless explicitly required.
- Add complex abstractions for hypothetical future needs.

**Before adding any new major feature, dependency, service, or architectural layer, AntiGravity must ask:**

> Is this necessary to satisfy an official requirement or make the core demo work?

If the answer is no, do not add it.

---

# 4. Strict Code Modification Rules

AntiGravity MUST:

- Modify only files relevant to the requested feature.
- Inspect a file before modifying it.
- Preserve existing working functionality.
- Avoid rewriting an entire file when a localized change is sufficient.
- Avoid changing unrelated components.
- Avoid renaming files, folders, functions, or variables unless necessary.
- Never delete working code simply because it appears unused without first verifying its dependencies.
- Never replace an existing implementation with a completely different architecture without explicit approval.
- Never overwrite user-written logic without understanding its purpose.
- Prefer incremental modifications over large rewrites.

**Before making a significant modification, AntiGravity must determine:**

- What currently works?
- What exactly needs to change?
- What files are directly affected?
- What could break?

---

# 5. Strict Architecture Constraints

The implementation must remain consistent with `AGENT_ARCHITECTURE.md` at all times.

AntiGravity MUST NOT:

- Invent additional agent roles without justification.
- Convert the multi-agent system into a single generic chatbot.
- Make multiple agents perform identical analysis.
- Remove agent independence.
- Remove structured output contracts.
- Bypass the synthesis layer.
- Remove evidence attribution.
- Ignore personalization logic.
- Replace the defined data flow with an unrelated architecture.

Every major component must have:

- A single clear responsibility
- Defined inputs
- Defined outputs
- Minimal coupling
- Clear integration points

Prefer simple composition over unnecessary abstraction.

---

# 6. Strict File and Code Organization

AntiGravity must maintain clean separation of concerns.

**Avoid:**

- One massive component containing all application logic.
- API calls directly scattered across UI components.
- Agent logic mixed with presentation logic.
- Data fetching duplicated across multiple files.
- Hardcoded business logic in unrelated components.
- Circular dependencies.
- Copy-pasted functions.

Organize code logically according to the existing framework. Recommended conceptual separation:

- Components
- Core business logic
- Agent logic
- Data services
- Retrieval logic
- Types/interfaces
- Utility functions

**However:** do NOT create excessive folders or abstractions for very small amounts of code. Create a new abstraction only when it genuinely improves maintainability or prevents duplication.

---

# 7. TypeScript and Type Safety Constraints

If the project uses TypeScript, AntiGravity MUST:

- Avoid `any`.
- Define explicit interfaces or types for important data structures.
- Define structured contracts for agent inputs and outputs.
- Type API responses.
- Handle nullable values explicitly.
- Avoid unsafe type assertions.
- Avoid suppressing TypeScript errors using `@ts-ignore`.
- Avoid disabling lint rules to hide problems.
- Fix type errors properly instead of bypassing them.

Important domain objects such as:

- Market signals
- Agent outputs
- User profiles
- Recommendations
- Evidence sources
- Retrieval results
- Performance metrics

must have clear and reusable types. Do not create unnecessarily complex generic types.

---

# 8. Dependency Control

AntiGravity MUST NOT install a dependency unless:

1. The required functionality cannot reasonably be implemented using existing dependencies.
2. The dependency saves significant development time.
3. The dependency is stable and appropriate for the project.
4. It does not introduce unnecessary complexity.

Before installing a dependency, check whether an existing package already provides the required functionality. Do NOT install multiple libraries that solve the same problem.

Avoid unnecessary packages for:

- Date handling
- State management
- Form management
- HTTP requests
- Validation
- Utility functions

when the project already has suitable solutions. Every dependency should justify its existence.

---

# 9. API and External Service Constraints

When integrating external APIs or AI services:

- Isolate API integration logic from UI components.
- Never expose secret keys in frontend code.
- Use environment variables.
- Validate API responses.
- Handle timeouts.
- Handle unavailable services.
- Provide meaningful fallback behavior.
- Avoid making unnecessary repeated API calls.
- Avoid blocking the entire application because one service fails.

**If an external API fails:**

1. Preserve the rest of the application.
2. Surface the degraded state clearly.
3. Use an allowed fallback where appropriate.
4. Do not fabricate data while claiming it came from a live source.

---

# 10. No Fake Functionality Rule

AntiGravity must never create misleading functionality.

A feature is **NOT complete** merely because:

- A button exists.
- A modal opens.
- A loading animation appears.
- Static text resembles an AI response.

Every claimed feature must have a real underlying behavior.

**If a feature is simulated for hackathon feasibility:**

- The simulation must be internally consistent.
- The source of the simulation must be clear.
- It must not falsely claim to be live data.
- The demo must remain truthful.

Never use fake results while presenting them as real AI, real market data, or real retrieval output.

---

# 11. Error Handling and Resilience

Every critical asynchronous operation should handle:

- Loading state
- Success state
- Failure state
- Missing data
- Partial data

AntiGravity must not leave silent failures.

**If one agent fails:**

- The entire application should not necessarily crash.
- The failure should be captured.
- The synthesis layer should know the output is unavailable.
- The final recommendation should adjust its confidence accordingly.

Never silently replace a failed agent with fabricated output.

---

# 12. Multi-Agent Execution Constraints

The system must visibly preserve the intended multi-agent architecture.

AntiGravity must ensure:

- Each specialist agent has a distinct responsibility.
- Each agent receives defined inputs.
- Each agent produces structured outputs.
- Agents can execute independently or in parallel where technically feasible.
- The synthesis layer consumes outputs rather than duplicating their work.
- Agent disagreement is preserved.
- Confidence is tracked.
- Evidence is traceable.

Do NOT implement "three agents" as three differently named prompt strings that perform identical reasoning.

---

# 13. RAG and Evidence Constraints

The retrieval system must:

- Retrieve relevant source material.
- Keep retrieved facts separate from generated interpretation.
- Preserve source attribution.
- Avoid unsupported factual claims.
- Handle missing retrieval results gracefully.

**If relevant evidence cannot be retrieved:**

- The system must explicitly communicate reduced confidence.
- The system must not invent citations.
- The affected agent should report insufficient evidence.

---

# 14. Testing Requirements

After every major implementation milestone, AntiGravity MUST:

1. Run the application.
2. Check for compilation errors.
3. Check browser/runtime errors.
4. Test the modified feature.
5. Verify that previously working core functionality still works.

**Before moving to the next phase:**

- Fix critical errors.
- Fix broken imports.
- Fix type errors.
- Fix runtime crashes.

Do not stack multiple unfinished features on top of broken code.

The required workflow is:

> **Implement → Run → Test → Fix → Verify → Continue**

**NOT:**

> Implement everything → Run once at the end → Debug chaos

---

# 15. Build and Quality Gates

AntiGravity must not declare a task complete until:

- The relevant feature actually works.
- The project compiles successfully.
- There are no critical runtime errors.
- Type errors are resolved.
- Imports are valid.
- Environment variables are documented.
- The implementation matches the specification.
- No unrelated functionality was broken.

If the build fails, **fixing the build takes priority over adding new features.**

---

# 16. Feature Completion Definition

A feature can only be marked complete when **all** of the following are true:

- The feature has a real implementation.
- Inputs are handled.
- Expected outputs are produced.
- Failure states are handled.
- Relevant types are defined.
- The feature integrates with the rest of the system.
- The feature has been tested manually.
- The project still builds successfully.

Do not mark partially implemented features as complete.

---

# 17. Git and Checkpoint Discipline

At major milestones, AntiGravity should preserve stable checkpoints.

**Recommended checkpoints:**

1. Project foundation working
2. End-to-end MVP working
3. Multi-agent pipeline working
4. RAG and evidence working
5. Personalization working
6. Final integration stable

Do not perform destructive changes immediately before the deadline.

Once a stable end-to-end version exists:

> **Protect the working version.**

New changes should only be added if they have enough time to be tested.

---

# 18. Time Management Rules

AntiGravity must remain aware that the total development window is five hours.

**Priority order:**

1. Working end-to-end pipeline
2. Official minimum requirements
3. Multi-agent independence
4. Evidence grounding
5. Personalization
6. Explainability
7. Reliability
8. Wow factor
9. Additional features

**If time is running short:**

- Simplify implementation.
- Reduce scope.
- Preserve the complete user flow.
- Do not begin major rewrites.
- Do not introduce risky dependencies.
- Do not chase perfection.

A simpler working implementation is always preferred over a sophisticated incomplete one.

---

# 19. Emergency Scope Reduction Protocol

If the project falls behind schedule, AntiGravity must simplify features **in this order:**

1. Remove optional enhancements.
2. Simplify data sources while preserving truthful labeling.
3. Reduce the number of supported stocks/scenarios.
4. Simplify persistence.
5. Simplify advanced analytics.
6. Simplify non-essential metrics.
7. Simplify secondary interactions.

**AntiGravity must NOT remove or compromise:**

- Three specialized agents
- Independent agent responsibilities
- Structured outputs
- Synthesis layer
- At least one RAG-grounded output
- User risk personalization
- Different outputs for different profiles
- Explainability
- Source attribution
- End-to-end demo flow
- Graceful handling of at least one degraded-data scenario

---

# 20. Communication Protocol

**Before implementing a major phase, AntiGravity should briefly state:**

- What it is about to implement
- Which files it will modify
- What success looks like

**After implementation, it should report:**

- What was implemented
- Files changed
- How it was tested
- Any known limitations

Do not produce unnecessary long explanations. **Focus on execution.**

---

# 21. Absolute Prohibitions

AntiGravity is strictly prohibited from:

- Rewriting the entire codebase without approval.
- Changing architecture without justification.
- Adding random features.
- Installing dependencies without checking existing ones.
- Using `any` to bypass type problems.
- Using `@ts-ignore` to hide errors.
- Disabling TypeScript or lint checks to force builds.
- Leaving broken imports.
- Leaving dead placeholder functionality.
- Creating buttons that do nothing.
- Fabricating API results.
- Fabricating citations.
- Claiming simulated data is live.
- Exposing API keys.
- Ignoring agent failures.
- Silently swallowing errors.
- Deleting working functionality without approval.
- Making large untested changes near the deadline.
- Declaring completion without verifying the build.

---

# 22. Final Operating Command

> **BUILD THE SMALLEST COMPLETE SYSTEM THAT SATISFIES THE REQUIREMENTS.**
>
> **DO NOT OPTIMIZE FOR THE MOST CODE, THE MOST FEATURES, OR THE MOST COMPLEX ARCHITECTURE.**
>
> **OPTIMIZE FOR A WORKING, EXPLAINABLE, TESTABLE, DEMONSTRABLE PRODUCT.**
>
> **EVERY NEW CHANGE MUST EARN ITS COMPLEXITY.**
