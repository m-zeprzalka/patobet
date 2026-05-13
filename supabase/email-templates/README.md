# Email templates

Templates do wklejenia w **Supabase Dashboard → Authentication → Email Templates**.

Każdy email ma trzy pola w UI Supabase:
- **Subject** — temat maila (pole tekstowe)
- **Message (HTML)** — body HTML (treść maila)
- *(Plain text alt jest auto-generowany przez Supabase z HTML jeśli nie ustawisz osobno)*

## Confirm signup

Trigger: signUp z włączonym "Confirm email".

| Pole | Wartość |
|---|---|
| Subject | `Potwierdź email — PatoBet` |
| Message | wklej `confirm-signup.html` |

## Reset Password

Trigger: `requestPasswordReset` z `/forgot-password`.

| Pole | Wartość |
|---|---|
| Subject | `Resetowanie hasła — PatoBet` |
| Message | wklej `reset-password.html` |

---

## Dostępne zmienne (Supabase)

- `{{ .ConfirmationURL }}` — link do kliknięcia (specific per typ maila)
- `{{ .Email }}` — adres odbiorcy
- `{{ .SiteURL }}` — URL aplikacji z config
- `{{ .Token }}` — surowy OTP token (rzadko potrzebne)
- `{{ .TokenHash }}` — hash tokena

Po wklejeniu zapisz w Supabase, wyślij testowego maila do siebie żeby sprawdzić.
