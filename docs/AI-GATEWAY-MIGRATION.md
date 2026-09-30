# Rightshore AI Provider Migration

## Decision
Rightshore AI uses Google Gemini as the canonical AI provider through the shared Render backend.

## Architecture
Rightshore web app and AIKeyboardV2 both call the same `POST /v1/ai` gateway. The gateway calls Gemini's `generateContent` API. Provider credentials remain server-side on Render.

## Environment
Required on Render:
- `GEMINI_API_KEY`: Gemini API key stored as a secret.
- `GEMINI_MODEL`: optional primary model override; default is `gemini-3.8-flash`.
- `GEMINI_FALLBACK_MODELS`: optional comma-separated fallback models; default is `gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash-lite`.

The gateway retries transient Gemini capacity/rate-limit/server failures and falls back through the configured model list. Authentication and malformed-request errors do not trigger model fallback.

No Gemini key belongs in the web app, iOS app, Git repository, or IPA.

## Compatibility
The client request/response contract remains unchanged: clients send the existing action/text/instruction/language/tone/attachedMedia payload and receive `{ text }`. The existing iOS keyboard therefore does not need a provider-specific change for this migration.

## Image handling
When `attachedMedia` is supplied, the backend converts the existing base64 media payload into Gemini `inlineData`, preserving the existing screenshot/image workflows.

## Verification
1. Confirm Render has `GEMINI_API_KEY`.
2. Confirm `/health` reports provider `gemini` and the configured model chain.
3. Test `POST /v1/ai` with Paraphrase.
4. Test an image action such as Extract Text when image input is available.
5. Confirm the web client and iOS keyboard still consume the unchanged `{ text }` response.
6. Confirm transient Gemini 429/5xx responses are retried and can fail over to the next configured model.

## Security
Never paste or commit the Gemini API key. If exposed, revoke it and create a replacement.
