# Shared AI Gateway Skill

For future agents working on this project:

- Read docs/shared-ai-gateway-plan.md before changing AI transport.
- Treat backend/src/server.js in the Rightshore repository as the canonical provider gateway.
- Treat Shared/AIAction.swift and Shared/AIClient.swift in AIKeyboardV2 as the canonical iOS client contract.
- Keep action names identical across web, backend, and iOS.
- Keep provider secrets server-side.
- Verify Render deployment status after backend changes.
- Verify Netlify deployment status after web-client changes.
- Do not claim Xcode signing, IPA export, or physical iPhone installation without an actual macOS/Xcode/device result.
