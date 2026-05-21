<p align="center">
  <a href="https://librechat.ai">
    <img src="client/public/assets/logo.svg" height="256">
  </a>
  <h1 align="center">
    <a href="https://librechat.ai">LibreChat</a>
  </h1>
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.zh.md">中文</a>
</p>

<p align="center">
  <a href="https://discord.librechat.ai"> 
    <img
      src="https://img.shields.io/discord/1086345563026489514?label=&logo=discord&style=for-the-badge&logoWidth=20&logoColor=white&labelColor=000000&color=blueviolet">
  </a>
  <a href="https://www.youtube.com/@LibreChat"> 
    <img
      src="https://img.shields.io/badge/YOUTUBE-red.svg?style=for-the-badge&logo=youtube&logoColor=white&labelColor=000000&logoWidth=20">
  </a>
  <a href="https://docs.librechat.ai"> 
    <img
      src="https://img.shields.io/badge/DOCS-blue.svg?style=for-the-badge&logo=read-the-docs&logoColor=white&labelColor=000000&logoWidth=20">
  </a>
  <a aria-label="Sponsors" href="https://github.com/sponsors/danny-avila">
    <img
      src="https://img.shields.io/badge/SPONSORS-brightgreen.svg?style=for-the-badge&logo=github-sponsors&logoColor=white&labelColor=000000&logoWidth=20">
  </a>
</p>

<p align="center">
<a href="https://railway.com/deploy/librechat-official?referralCode=HI9hWz&utm_medium=integration&utm_source=readme&utm_campaign=librechat">
  <img src="https://railway.com/button.svg" alt="Deploy on Railway" height="30">
</a>
<a href="https://zeabur.com/templates/0X2ZY8">
  <img src="https://zeabur.com/button.svg" alt="Deploy on Zeabur" height="30"/>
</a>
<a href="https://template.cloud.sealos.io/deploy?templateName=librechat">
  <img src="https://raw.githubusercontent.com/labring-actions/templates/main/Deploy-on-Sealos.svg" alt="Deploy on Sealos" height="30">
</a>
</p>

<p align="center">
  <a href="https://www.librechat.ai/docs/translation">
    <img 
      src="https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&color=2096F3&label=locize&query=%24.translatedPercentage&url=https://api.locize.app/badgedata/4cb2598b-ed4d-469c-9b04-2ed531a8cb45&suffix=%+translated" 
      alt="Translation Progress">
  </a>
</p>


# ✨ Features

- 🖥️ **UI & Experience** inspired by ChatGPT with enhanced design and features

- 🤖 **AI Model Selection**:  
  - Anthropic (Claude), AWS Bedrock, OpenAI, Azure OpenAI, Google, Vertex AI, OpenAI Responses API (incl. Azure)
  - [Custom Endpoints](https://www.librechat.ai/docs/quick_start/custom_endpoints): Use any OpenAI-compatible API with LibreChat, no proxy required
  - Compatible with [Local & Remote AI Providers](https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints):
    - Ollama, groq, Cohere, Mistral AI, Apple MLX, koboldcpp, together.ai,
    - OpenRouter, Helicone, Perplexity, ShuttleAI, Deepseek, Qwen, and more

- 🔧 **[Code Interpreter API](https://www.librechat.ai/docs/features/code_interpreter)**: 
  - Secure, Sandboxed Execution in Python, Node.js (JS/TS), Go, C/C++, Java, PHP, Rust, and Fortran
  - Seamless File Handling: Upload, process, and download files directly
  - No Privacy Concerns: Fully isolated and secure execution

- 🔦 **Agents & Tools Integration**:  
  - **[LibreChat Agents](https://www.librechat.ai/docs/features/agents)**:
    - No-Code Custom Assistants: Build specialized, AI-driven helpers
    - Agent Marketplace: Discover and deploy community-built agents
    - Collaborative Sharing: Share agents with specific users and groups
    - Flexible & Extensible: Use MCP Servers, tools, file search, code execution, and more
    - [Skills](https://www.librechat.ai/docs/features/skills): Create reusable `SKILL.md` instruction bundles for manual, automatic, or always-on agent workflows
    - [Subagents](https://www.librechat.ai/docs/features/subagents): Delegate focused work to isolated child agent runs with their own context windows
    - Compatible with Custom Endpoints, OpenAI, Azure, Anthropic, AWS Bedrock, Google, Vertex AI, Responses API, and more
    - [Model Context Protocol (MCP) Support](https://modelcontextprotocol.io/clients#librechat) for Tools

- 🔍 **Web Search**:  
  - Search the internet and retrieve relevant information to enhance your AI context
  - Combines search providers, content scrapers, and result rerankers for optimal results
  - **Customizable Jina Reranking**: Configure custom Jina API URLs for reranking services
  - **[Learn More →](https://www.librechat.ai/docs/features/web_search)**

- 🪄 **Generative UI with Code Artifacts**:  
  - [Code Artifacts](https://youtu.be/GfTj7O4gmd0?si=WJbdnemZpJzBrJo3) allow creation of React, HTML, and Mermaid diagrams directly in chat

- 🎨 **Image Generation & Editing**
  - Text-to-image and image-to-image with [GPT-Image-1](https://www.librechat.ai/docs/features/image_gen#1--openai-image-tools-recommended)
  - Text-to-image with [DALL-E (3/2)](https://www.librechat.ai/docs/features/image_gen#2--dalle-legacy), [Stable Diffusion](https://www.librechat.ai/docs/features/image_gen#3--stable-diffusion-local), [Flux](https://www.librechat.ai/docs/features/image_gen#4--flux), or any [MCP server](https://www.librechat.ai/docs/features/image_gen#5--model-context-protocol-mcp)
  - Produce stunning visuals from prompts or refine existing images with a single instruction

- 💾 **Presets & Context Management**:  
  - Create, Save, & Share Custom Presets  
  - Switch between AI Endpoints and Presets mid-chat
  - Edit, Resubmit, and Continue Messages with Conversation branching  
  - Create and share prompts with specific users and groups
  - [Fork Messages & Conversations](https://www.librechat.ai/docs/features/fork) for Advanced Context control

- 💬 **Multimodal & File Interactions**:  
  - Upload and analyze images with Claude 3, GPT-4.5, GPT-4o, o1, Llama-Vision, and Gemini 📸  
  - Chat with Files using Custom Endpoints, OpenAI, Azure, Anthropic, AWS Bedrock, & Google 🗃️

- 🌎 **Multilingual UI**:
  - English, 中文 (简体), 中文 (繁體), العربية, Deutsch, Español, Français, Italiano
  - Polski, Português (PT), Português (BR), Русский, 日本語, Svenska, 한국어, Tiếng Việt
  - Türkçe, Nederlands, עברית, Català, Čeština, Dansk, Eesti, فارسی
  - Suomi, Magyar, Հայերեն, Bahasa Indonesia, ქართული, Latviešu, ไทย, ئۇيغۇرچە

- 🧠 **Reasoning UI**:  
  - Dynamic Reasoning UI for Chain-of-Thought/Reasoning AI models like DeepSeek-R1

- 🎨 **Customizable Interface**:  
  - Customizable Dropdown & Interface that adapts to both power users and newcomers

- 🌊 **[Resumable Streams](https://www.librechat.ai/docs/features/resumable_streams)**:  
  - Never lose a response: AI responses automatically reconnect and resume if your connection drops
  - Multi-Tab & Multi-Device Sync: Open the same chat in multiple tabs or pick up on another device
  - Production-Ready: Works from single-server setups to horizontally scaled deployments with Redis

- 🗣️ **Speech & Audio**:  
  - Chat hands-free with Speech-to-Text and Text-to-Speech  
  - Automatically send and play Audio  
  - Supports OpenAI, Azure OpenAI, and Elevenlabs

- 📥 **Import & Export Conversations**:  
  - Import Conversations from LibreChat, ChatGPT, Chatbot UI  
  - Export conversations as screenshots, markdown, text, json

- 🔍 **Search & Discovery**:  
  - Search all messages/conversations

- 👥 **Multi-User & Secure Access**:
  - Multi-User, Secure Authentication with OAuth2, LDAP, & Email Login Support
  - Built-in Moderation, and Token spend tools

- ⚙️ **Configuration & Deployment**:  
  - Configure Proxy, Reverse Proxy, Docker, & many Deployment options  
  - Use [S3 with CloudFront](https://www.librechat.ai/docs/configuration/cdn/cloudfront) for stable media links, edge delivery, signed cookies, and secured downloads
  - Use completely local or deploy on the cloud

- 📖 **Open-Source & Community**:  
  - Completely Open-Source & Built in Public  
  - Community-driven development, support, and feedback

[For a thorough review of our features, see our docs here](https://docs.librechat.ai/) 📚

## 🪶 All-In-One AI Conversations with LibreChat

LibreChat is a self-hosted AI chat platform that unifies all major AI providers in a single, privacy-focused interface.

Beyond chat, LibreChat provides AI Agents, Model Context Protocol (MCP) support, Artifacts, Code Interpreter, custom actions, conversation search, and enterprise-ready multi-user authentication.

Open source, actively developed, and built for anyone who values control over their AI infrastructure.

---

## 🌐 Resources

**GitHub Repo:**
  - **RAG API:** [github.com/danny-avila/rag_api](https://github.com/danny-avila/rag_api)
  - **Website:** [github.com/LibreChat-AI/librechat.ai](https://github.com/LibreChat-AI/librechat.ai)

**Other:**
  - **Website:** [librechat.ai](https://librechat.ai)
  - **Documentation:** [librechat.ai/docs](https://librechat.ai/docs)
  - **Blog:** [librechat.ai/blog](https://librechat.ai/blog)

---

## 📝 Changelog

Keep up with the latest updates by visiting the releases page and notes:
- [Releases](https://github.com/danny-avila/LibreChat/releases)
- [Changelog](https://www.librechat.ai/changelog) 

**⚠️ Please consult the [changelog](https://www.librechat.ai/changelog) for breaking changes before updating.**

---

## ⭐ Star History

<p align="center">
  <a href="https://star-history.com/#danny-avila/LibreChat&Date">
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=danny-avila/LibreChat&type=Date&theme=dark" onerror="this.src='https://api.star-history.com/svg?repos=danny-avila/LibreChat&type=Date'" />
  </a>
</p>
<p align="center">
  <a href="https://trendshift.io/repositories/4685" target="_blank" style="padding: 10px;">
    <img src="https://trendshift.io/api/badge/repositories/4685" alt="danny-avila%2FLibreChat | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/>
  </a>
  <a href="https://runacap.com/ross-index/q1-24/" target="_blank" rel="noopener" style="margin-left: 20px;">
    <img style="width: 260px; height: 56px" src="https://runacap.com/wp-content/uploads/2024/04/ROSS_badge_white_Q1_2024.svg" alt="ROSS Index - Fastest Growing Open-Source Startups in Q1 2024 | Runa Capital" width="260" height="56"/>
  </a>
</p>

---

## ✨ Contributions

Contributions, suggestions, bug reports and fixes are welcome!

For new features, components, or extensions, please open an issue and discuss before sending a PR.

If you'd like to help translate LibreChat into your language, we'd love your contribution! Improving our translations not only makes LibreChat more accessible to users around the world but also enhances the overall user experience. Please check out our [Translation Guide](https://www.librechat.ai/docs/translation).

---

## 💖 This project exists in its current state thanks to all the people who contribute

<a href="https://github.com/danny-avila/LibreChat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=danny-avila/LibreChat" />
</a>

---

## 🗃️ Contacts Workspace Integration (Assignment)

This fork extends LibreChat with a **Contacts Workspace**: structured contact storage, bulk CSV import, hybrid vector search (RAG-style retrieval), and AI chat integration via tool calling and `#` contact mentions.

### Quick start

1. **Prerequisites**: MongoDB, Redis (required for CSV import worker), Node.js 20+
2. **Environment** (add to `.env`):

```env
# Required for background CSV import
REDIS_URI=redis://127.0.0.1:6379

# Azure OpenAI embeddings for contact vector search (recommended)
CONTACTS_EMBEDDING_PROVIDER=azure
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_API_INSTANCE_NAME=your-azure-resource-name
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=your-embedding-deployment-name
AZURE_OPENAI_API_VERSION=2024-08-01-preview

# Optional tuning
CONTACTS_MAX_UPLOAD_SIZE=524288000        # 500MB
CONTACTS_IMPORT_BATCH_SIZE=5000
CONTACTS_VECTOR_SCAN_LIMIT=10000
```

3. **Install & run**:

```bash
npm run smart-reinstall
npm run backend
npm run frontend:dev
```

4. **Enable the contacts tool** on an agent (Agent builder → Tools → **Contacts Workspace**).
5. Open the **Contacts** panel in the unified sidebar to create/import contacts.
6. In chat, type **`#`** to mention a contact (autocomplete + context injection).

---

### Architecture

```
┌──────────────── Client ────────────────┐
│ ContactsPanel (CRUD, import, search)   │
│ Chat: # mention → contactIds in payload│
└───────────────┬────────────────────────┘
                │ REST /api/contacts/*
                ▼
┌────────────── API Server ──────────────┐
│ Chunked CSV upload (5MB parts)       │
│ BullMQ worker → stream parse → bulk  │
│   insert (transactions) → embed batch│
│ Hybrid search (lexical + vector)     │
│ contacts tool + # mention context    │
└───────────────┬────────────────────────┘
                ▼
         MongoDB (contacts, embeddings, import jobs)
                ▲
         Redis (BullMQ contact-import queue)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Schema | `packages/data-schemas/src/schema/contact.ts` | Fields, `metadata` map, `embedding[]`, indexes |
| Embeddings | `packages/api/src/contacts/` | Flatten, Google embed, cosine similarity, hybrid search |
| REST | `api/server/routes/contacts.js` | CRUD, search, chunked import |
| Worker | `api/server/services/workers/contactImportWorker.js` | Stream CSV, batch insert, **embed on each batch** |
| AI tool | `api/app/clients/tools/structured/Contacts.js` | `search` / `list` / `get` for agents |
| Chat context | `api/server/controllers/agents/client.js` | Injects `#`-mentioned contacts into agent context |
| UI | `client/src/components/Contacts/ContactsPanel.tsx` | Sidebar panel |
| # mention | `client/src/components/Chat/Input/ContactsCommand.tsx` | Autocomplete + chips |

---

### Chunked CSV upload (network reliability)

Large CSV files (1K–1M rows) are uploaded in **5MB chunks** from the browser (`packages/data-provider/src/data-service.ts` → `importContacts`):

1. Client splits the file into 5MB `FormData` chunks
2. Each chunk is POSTed to `/api/contacts/import/chunk` with `uploadId`, `chunkIndex`, `totalChunks`
3. After all chunks arrive, client POSTs `/api/contacts/import/complete`
4. Server assembles the file and enqueues a BullMQ job

This avoids single-request timeouts on slow networks and supports files up to `CONTACTS_MAX_UPLOAD_SIZE` (default 500MB).

---

### Background import reliability

The **contact-import** worker (`contactImportWorker.js`):

- **Streams** CSV with `fast-csv` (constant memory)
- **Pauses** the parser during MongoDB writes (backpressure)
- **Inserts in batches** (default 5000) inside **MongoDB transactions**
- **Tracks progress** in `ContactImportJob` (`processedRows`, `failedRows`, row-level errors)
- **Embeds each batch** after commit via **Azure OpenAI embeddings** (default when configured; also supports OpenAI/Google)
- **Cleans up** temp files on success or failure
- Processes **one import at a time** (`concurrency: 1`) to protect DB/CPU

Client polls `GET /api/contacts/import/:jobId` every 3 seconds until `completed` or `failed`.

---

### AI retrieval (hybrid RAG)

Contacts are **not** dumped into every prompt. Retrieval is **on-demand**:

| Mechanism | Trigger | How it works |
|-----------|---------|--------------|
| **`contacts` tool** | Model decides during chat | `search` runs hybrid lexical + vector search, returns top-k JSON |
| **`#` mention** | User picks contacts in chat | Full contact records injected into agent `additional_instructions` |
| **Lexical fallback** | Always available | MongoDB text index + regex on all fields including `searchText` / metadata |

**Embedding pipeline**: each contact is flattened to text (including `metadata` fields) → embedded via **Azure OpenAI** (`text-embedding-3-small` or your deployment) → stored as `embedding[]` on the document.

**Hybrid scoring**: `0.7 × cosine_similarity + 0.3 × lexical_score`, deduplicated, capped at 15–50 results.

Example: *"Who is interested in AI infrastructure?"* matches contacts where `Industry` lives only in `metadata` because it is included in the flattened embedding text.

---

### API endpoints

All routes require JWT auth and are scoped per user.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/contacts` | Cursor-paginated list (`search`, `tag`, `company` filters) |
| POST | `/api/contacts/search` | Hybrid semantic + lexical search |
| GET | `/api/contacts/:id` | Single contact |
| POST | `/api/contacts` | Create (+ embed) |
| PUT | `/api/contacts/:id` | Update (+ re-embed) |
| DELETE | `/api/contacts/:id` | Soft delete |
| GET | `/api/contacts/disk-space` | Pre-upload disk check |
| POST | `/api/contacts/import/chunk` | Upload one CSV chunk |
| POST | `/api/contacts/import/complete` | Finalize upload → queue job |
| POST | `/api/contacts/import` | Single-shot upload (legacy) |
| GET | `/api/contacts/import/:jobId` | Import job status |

---

### Design questions

**1. If the system needed to support 1,000,000 contacts, how would you redesign it?**

- Move embeddings to **MongoDB Atlas Vector Search** or a dedicated vector DB (Pinecone, Qdrant)
- **Async embedding queue** decoupled from import (separate BullMQ queue, horizontal workers)
- **Shard** by `userId` / `tenantId`; archive cold contacts
- Replace in-memory cosine scan with **approximate nearest neighbor** indexes
- **Pre-compute** common filter indexes (`company`, `role`, `tags`) for structured queries
- Stream export/import via object storage (S3/Azure Blob) instead of local disk

**2. How would you ensure the assistant retrieves the most relevant contacts for a query?**

Current approach (implemented):

- Hybrid **vector + lexical** search with weighted merge
- Tool calling so the model passes a focused natural-language query (not all contacts)
- `#` mentions for guaranteed inclusion of specific contacts
- Flattened text includes all metadata for semantic matching

Future improvements: query decomposition (extract `company=Stripe`, `role=CTO`), cross-encoder reranking, user feedback loop on search results.

**3. What are the limitations of the current implementation?**

- Vector scan loads up to `CONTACTS_VECTOR_SCAN_LIMIT` embeddings per user (fine for 10K, not 1M)
- Embeddings require **Azure OpenAI** (or OpenAI/Google fallback); without a provider, search falls back to lexical only
- CSV import requires Redis; no import without it
- `contacts` tool must be enabled on the agent manually
- `#` mention uses a separate trigger from `@` (agents/endpoints) to avoid conflicts
- No automated tests for contacts yet
- Single worker concurrency for imports (safe but slow for parallel uploads)

---

### ☁️ Azure OpenAI Integration

To configure LibreChat to use Azure OpenAI models, you should define the `azureOpenAI` endpoint in your `librechat.yaml` file (placed in the root of your project).

1. Add the following to your `librechat.yaml` file:
   ```yaml
   version: 1.3.11
   cache: true

   endpoints:
     azureOpenAI:
       titleModel: "gpt-4"
       groups:
         - group: "azure-openai-group"
           apiKey: "${AZURE_OPENAI_API_KEY}"
           instanceName: "${AZURE_OPENAI_INSTANCE_NAME}"
           version: "2024-03-01-preview"
           models:
             gpt-4:
               deploymentName: "${AZURE_OPENAI_GPT4_DEPLOYMENT}"
             gpt-3.5-turbo:
               deploymentName: "${AZURE_OPENAI_GPT35_DEPLOYMENT}"
   ```

2. Add the corresponding environment variables in your `.env` file:
   ```env
   AZURE_OPENAI_API_KEY=your_azure_api_key_here
   AZURE_OPENAI_INSTANCE_NAME=your_azure_resource_instance_name
   AZURE_OPENAI_GPT4_DEPLOYMENT=your_gpt4_model_deployment_name
   AZURE_OPENAI_GPT35_DEPLOYMENT=your_gpt35_model_deployment_name
   ```

---

## 🎉 Special Thanks

We thank [Locize](https://locize.com) for their translation management tools that support multiple languages in LibreChat.

<p align="center">
  <a href="https://locize.com" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/user-attachments/assets/d6b70894-6064-475e-bb65-92a9e23e0077" alt="Locize Logo" height="50">
  </a>
</p>
