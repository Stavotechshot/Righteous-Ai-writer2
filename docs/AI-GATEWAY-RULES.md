# Shared AI Gateway Rules

1. Rightshore AI and AIKeyboardV2 use the single Render service rightshore-ai-backend.
2. Client applications never contain an OpenRouter/OpenAI provider secret.
3. Browser requests are accepted only from configured Rightshore Netlify origins.
4. New AI actions must be added to the shared backend action map before clients ship them.
5. Changes to the API request shape must update both the web client and AIKeyboardV2 request model in the same change.
6. The /health endpoint is the operational health check; / is a human-readable status endpoint.
7. Exposed provider keys are treated as compromised and must be revoked and replaced outside source control.
8. Native iOS build/signing/device installation is a release gate and must not be marked complete without observed evidence.
