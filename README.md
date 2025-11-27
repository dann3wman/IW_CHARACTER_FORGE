<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Character Forge

Character Forge is an AI-assisted toolkit for building richly detailed RPG or roleplay characters. It pairs structured tag inputs with Gemini-backed generation to create narrative descriptions, visual prompts, and images while keeping your work organized across projects.

## Key Features

- **Tag-driven generation:** Select tags across identity, appearance, genre, tone, skills, and more; at least three tags are required before forging a character. Project-level default tags and a configuration modal make it easy to reuse baselines across runs.
- **Smart assistance:** Ask the app to suggest tags from a world or adventure description, extract unified art styles from existing characters, or auto-organize saved characters into folders.
- **Flexible naming:** Toggle Markov-based name generation trained on 60 seed names derived from your tags or a custom naming convention, and preview batches directly in the settings modal.
- **Visual outputs:** Generate rich portrait prompt details, regenerate them without changing the character’s core data, and render images with adjustable framing, size, and aspect ratio. You can also edit prompts manually before sending them to image generation.
- **Project workspace:** Maintain multiple projects, nest characters into folders, reload saved characters for editing, and export any character as a JSON schema for external use.
- **Local-first persistence:** UI preferences, tags, active characters, and projects are stored in `localStorage` so you can pick up where you left off without extra setup.

## Tech Stack

- **Framework:** React 19 with TypeScript and Vite
- **UI:** Tailwind-inspired utility classes and [lucide-react](https://lucide.dev/) icons
- **Data & AI:** Gemini models via `@google/genai`, Markov name generation, and Recharts for skill visualization

## Prerequisites

- **Node.js:** v18 or later is recommended.
- **Gemini API key:** Provide a key with access to `gemini-2.5-flash` for text and `gemini-3-pro-image-preview` for images.

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and set your Gemini key:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

   The Vite configuration maps this value to `process.env.API_KEY` for the Gemini client. In AI Studio, you can also select a key through the in-app prompt instead of setting the file manually.

## Running Locally

Start the development server on port 3000:

```bash
npm run dev
```

Open the logged local URL in your browser. The UI will prompt you to select or provide an API key before generation begins.

## Build and Preview

Create an optimized production build:

```bash
npm run build
```

Preview the built app locally:

```bash
npm run preview
```

## Using Character Forge

1. **Select or create a project:** Use the sidebar to choose an existing project or add a new one. All work—characters, folders, and settings—is scoped to the active project.
2. **Set generation defaults:** Open **Config** to adjust narrative and visual settings, including naming conventions, Markov seed settings, image-generation rules, and project-wide default tags. You can also paste a world description to auto-suggest tags for the project.
3. **Pick tags:** Choose tags across the provided categories in the **Forge** tab. Use **Clear** to reset selections or the magic input to infer tags from prose. The **Forge Character** button becomes available once at least three tags are selected.
4. **Forge the character:** The app creates a character with structured skills, a formatted description, and detailed visual prompt fields. Regenerate only the visual prompts at any time without altering the narrative.
5. **Generate images:** Trigger a quick image render from the current prompts, or open the prompt editor to tweak framing, size, and aspect ratio before generation.
6. **Save or export:** Save the character into the active project (optionally into a folder) or export a JSON file containing the schema and data for external tools.

## Project Management Tips

- Use folders to group related characters; the AI organize action can propose folders and move characters based on their summaries.
- Run **Analyze Style** in the settings modal to derive unified `illustrStylePre` and `illustrStylePost` values from existing characters, keeping new renders visually consistent.
- Default tags in the settings modal automatically merge into every generation for the active project, reducing manual selection.

## Data Persistence

The app stores projects, characters, tag selections, and UI state in `localStorage`. Clearing site data will remove this information; use the settings modal to wipe everything if you want a clean slate.
