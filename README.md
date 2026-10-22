# CodeShalaByKMFL AI

**A browser-based AI workspace for chat, coding, search, writing, image generation, vision, voice, and deeper reasoning.**

CodeShalaByKMFL AI brings eight focused tools into one responsive interface. It connects directly from the browser to the Google Gemini API, keeps conversations and preferences in the browser, and lets each tool use a model suited to its task.

> **Important:** This project is a static front-end application, not a hosted AI service. You need your own Google Gemini API key, and API requests are made from your browser.

---

## Contents

- [Highlights](#highlights)
- [Tools](#tools)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Connecting your Gemini API key](#connecting-your-gemini-api-key)
- [Project structure](#project-structure)
- [Models and usage counters](#models-and-usage-counters)
- [Data and privacy](#data-and-privacy)
- [Deploying](#deploying)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Highlights

- Eight task-focused tools in one interface.
- Responsive layout with a dashboard, tool navigation, and recent conversation history.
- Google Search grounding for live, source-backed responses where enabled and supported.
- Model fallback chains for selected text-based tools when a model is unavailable or temporarily busy.
- Markdown-formatted responses, code copying, image downloads, and audio playback.
- Browser-based persistence for conversations, preferences, usage counters, and generated-image gallery.
- Input validation and output-safety helpers, plus a Content Security Policy and additional Apache security headers.

## Tools

| Tool | What it does | Configured model | Displayed daily counter |
| --- | --- | --- | ---: |
| **AI Chat** | General questions, explanations, and everyday assistance | `gemini-2.5-flash-lite` | 1,000 |
| **Code Studio** | Generates code and a short explanation for a selected language | `gemini-2.5-flash` | 250 |
| **Search** | Answers questions using Google Search grounding and may show sources | `gemini-2.5-flash` | 250 |
| **Writing** | Drafts content such as emails, essays, poems, and captions | `gemini-2.5-flash` | 250 |
| **Image Gen** | Generates images from a text prompt and saves them to the gallery | `gemini-2.5-flash-image` | 100 |
| **Vision AI** | Analyzes an uploaded image with a question or instruction | `gemini-2.5-flash` | 250 |
| **Voice Gen** | Converts text to speech with a choice of five voices | `gemini-2.5-flash-preview-tts` | 15 |
| **Deep Think** | Handles more involved prompts using the Pro model and configured fallbacks | `gemini-2.5-pro` | 100 |

The counters shown in the interface are **local application counters**, not guaranteed Google API quotas. Actual availability, quotas, model access, and charges depend on your Google AI Studio / Gemini API account and current provider terms.

## Requirements

- A current desktop or mobile browser with JavaScript modules, `fetch`, and browser storage support.
- Python 3 or Node.js for the local static server (choose either).
- A Google Gemini API key with access to the models and features you intend to use.
- An internet connection to reach the Gemini API and load Google Fonts.

Opening `index.html` directly as a `file://` URL is not recommended. Run a local HTTP server so browser modules and API requests work as expected.

## Getting started

### 1. Open the project directory

In PowerShell:

```powershell
cd "C:\path\to\codeshala-ai"
```

Replace the example path with the location where you saved the project.

### 2. Start a local server

With Python:

```powershell
python -m http.server 8080
```

Or, with Node.js and npm:

```powershell
npx serve .
```

Keep the server terminal running while you use the app.

### 3. Open the app

Visit **http://localhost:8080** when using Python's server. If you use `npx serve`, open the local URL printed in the terminal.

### 4. Add your API key

The API-key dialog opens when the app has no saved key. You can also open it from the key/settings control in the top bar. Paste your key and choose **Save & Verify**.

Create or manage a key in [Google AI Studio](https://aistudio.google.com/app/apikey). Do not put API keys in source files, screenshots, public issues, or commits.

## Connecting your Gemini API key

The app calls the Gemini API directly from the browser. The configured API base URL is `https://generativelanguage.googleapis.com/v1beta`; model identifiers, feature defaults, and client-side counter values are in [`js/config.js`](./js/config.js).

The browser verifies a key through the Gemini models endpoint before saving it. If verification fails, check that:

1. The key was copied correctly and has not been revoked.
2. The associated Google project has Gemini API access and billing/quota configured as required.
3. The selected model is available to your account.
4. Your browser, network, or hosting policy allows requests to `generativelanguage.googleapis.com`.

## Project structure

```text
codeshala-ai/
├── index.html                 # App layout, tool sections, CSP, and entry point
├── .htaccess                  # Apache headers, HTTPS redirect, and static asset rules
├── README.md
├── css/
│   ├── base.css               # Shared design tokens and base styles
│   ├── sidebar.css            # Sidebar and tool navigation
│   ├── topbar.css             # Top bar and usage counters
│   ├── dashboard.css          # Dashboard and tool cards
│   ├── chat.css               # Chat-style tools and messages
│   ├── code-studio.css        # Code Studio layout
│   ├── image.css              # Image generator and gallery
│   ├── vision-voice.css       # Vision and voice interfaces
│   ├── settings.css           # Settings interface
│   ├── modals.css             # Modal styles
│   └── responsive.css         # Responsive adjustments
└── js/
    ├── app.js                 # App initialization, navigation, and event wiring
    ├── config.js              # API base, tool/model settings, and suggestions
    ├── security.js            # Escaping, validation, and browser-side key storage
    ├── storage.js             # Local persistence for app data
    ├── limits.js              # Client-side daily counters
    ├── settings.js            # API-key verification and settings behavior
    ├── api/
    │   └── gemini-client.js   # Gemini requests, fallback helper, and source parsing
    ├── features/
    │   ├── chat.js            # Chat, search, writing, and deep-think flows
    │   ├── code.js            # Code generation
    │   ├── image.js           # Image generation and gallery
    │   ├── vision.js          # Image upload and analysis
    │   ├── voice.js           # Text-to-speech generation
    │   └── conversations.js   # Conversation history and persistence
    └── ui/
        ├── sidebar.js         # Sidebar behavior
        ├── topbar.js          # Search-mode toggle
        ├── toast.js           # Toast notifications
        ├── confetti.js        # Success animation
        └── markdown.js        # Markdown rendering
```

## Models and usage counters

The current defaults and fallback chains are maintained in [`js/config.js`](./js/config.js). The daily counters and their display logic are in [`js/limits.js`](./js/limits.js).

- Counters are stored in the browser and reset according to the browser's local date.
- They are convenience safeguards for this interface only. They are not server-enforced limits and can be changed by clearing or editing browser storage.
- Google may enforce different quotas, rate limits, model availability, or billing rules.
- Some tools can fall back to another configured text model when a request is retryable or a model limit is reached. Image and voice generation use their configured models directly.
- Search grounding depends on provider support, account availability, and the app's Search toggle.

## Data and privacy

This application has no application server or account system. Requests containing your prompts, uploaded images, or text for speech are sent from your browser to Google Gemini when you use the corresponding features. Review Google's current terms and privacy information before sending sensitive content.

The app stores conversations, settings, usage counters, and generated-image gallery data in browser storage. Clearing site data can remove this information. The API key is stored in browser storage using a Web Crypto AES-GCM helper when available; **this is not a substitute for a secure server-side secret store**. The key is used by client-side JavaScript and can be exposed to anyone who can access the browser profile or run code in the page.

For safer use:

- Use a dedicated API key with the narrowest restrictions and quotas available to you.
- Do not use a personal or unrestricted key on a public/shared deployment.
- Do not commit keys or paste them into source code.
- Revoke or rotate a key if you believe it has been exposed.
- For a public production service, move Gemini calls behind a trusted backend that protects credentials and enforces server-side rate limits.

The included `.htaccess` file is intended for Apache hosting. The page also defines a Content Security Policy; if you change external services or asset origins, review and update the policy deliberately rather than disabling it.

## Deploying

The project is static and can be hosted on any static web host that serves the files without changing their relative paths. For production:

1. Serve the site over HTTPS.
2. Confirm the host serves JavaScript modules with a suitable MIME type.
3. Configure API key restrictions and quotas in Google Cloud / AI Studio where available.
4. Review `.htaccess` if deploying on Apache. It uses rewrite, header, and compression directives; the corresponding modules must be enabled. Other hosts need equivalent HTTPS, security-header, and directory-listing settings in their own configuration.
5. Do not treat client-side usage counters as abuse prevention. Use a backend for enforceable limits and protected credentials.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| The page is blank or scripts fail to load | Start a local HTTP server from the project root; check browser developer tools for missing files or JavaScript errors. |
| API-key verification fails | Confirm the key, API access, network connectivity, and account/model availability. Read the error shown in the settings dialog. |
| Requests return quota or rate-limit errors | Check the provider's quota for the selected model. The app's local counters do not represent Google's quota. |
| Search results have no sources | Enable the Search toggle and verify that Search grounding is available for your account and request. Not every response includes source links. |
| The image upload is rejected | Use a supported image format (PNG, JPG/JPEG, or WEBP) and keep the file under the displayed 10 MB limit. |
| Saved data is missing | Check that you are using the same browser profile and site origin. Clearing site data removes browser-stored app data. |
| Apache rejects a rule or redirects unexpectedly | Check that the required Apache modules are enabled and adjust `.htaccess` for your hosting environment. |

## Contributing

1. Keep the existing separation between layout (`index.html`), styles (`css/`), shared utilities (`js/`), and feature flows (`js/features/`).
2. Keep user-provided text escaped or safely rendered, and validate uploaded files before sending them.
3. Never add secrets to the repository.
4. Test changes in a browser served over HTTP or HTTPS, including the feature's success and error states.

---

**CodeShalaByKMFL AI** — one workspace, eight focused AI tools.
