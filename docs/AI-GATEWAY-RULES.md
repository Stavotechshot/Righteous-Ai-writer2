# Shared AI Gateway Rules

1. Rightshore AI and AIKeyboardV2 use the single Render service rightshore-ai-backend.
2. Client applications never contain a Gemini provider secret.
3. The canonical AI provider is Google Gemini through the Gemini API.
4. The canonical backend provider environment variables are GEMINI_API_KEY and GEMINI_MODEL.
5. Browser requests are accepted only from configured Rightshore Netlify origins.
6. New AI actions must be added to the shared backend action map before clients ship them.
7. Changes to the API request shape must update both the web client and AIKeyboardV2 request model in the same change.
8. The /health endpoint is the operational health check; / is a human-readable status endpoint.
9. Exposed provider keys are treated as compromised and must be revoked and replaced outside source control.
10. Native iOS build/signing/device installation is a release gate and must not be marked complete without observed evidence.
