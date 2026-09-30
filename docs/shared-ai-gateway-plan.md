# Shared AI Gateway

## Purpose
Rightshore AI (web) and AI Keyboard V2 (iOS) use one secure AI gateway so the provider secret stays server-side and both clients share the same action contract.

## Runtime
- Render service: `rightshore-ai-backend`
- Public API: `https://rightshore-ai-backend.onrender.com`
- AI provider: OpenRouter
- Default model route: `openrouter/free`
- Web client: `VITE_RIGHTSHORE_API_URL`
- iOS client: `AIKeyboardConfig.apiBaseURL`

## API contract
- `GET /` returns service status.
- `GET /health` returns health/provider metadata.
- `POST /v1/ai` accepts `action`, `text`, optional `instruction`, `tone`, `language`, and optional image `attachedMedia`.
- Supported actions include the Rightshore writing modes plus the keyboard actions: Reply, Paraphrase, Synonyms, Versify, Check & Improve, Change Tone, Continue, Emojify, Translate, Ask AI, Humanize, Shorten, Email, Detect, Expand, and Extract Text.

## Security
- Provider keys are environment variables only.
- Browser CORS is restricted to configured Rightshore origins.
- Request bodies are limited to 15 MB.
- Text is limited to 12,000 characters.
- Basic per-IP rate limiting is enabled.
- Provider error details are not returned to clients.

## Operational rule
Do not paste provider API keys into chat, source control, client bundles, or screenshots. If a key is exposed, revoke it and replace the server-side secret.
