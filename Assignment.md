# Fullstack Assignment

## Feature: Contact Workspace Integration for LibreChat

### Overview

LibreChat already provides a chat interface powered by LLMs. The goal of this assignment is to extend the system by adding a Contacts feature that the assistant can reference during normal conversations.

Instead of building a chat system, you will build a structured contacts workspace and integrate it so that the AI assistant can answer questions about the stored contacts during regular chat interactions.

This assignment evaluates your ability to design a feature that integrates structured application data with an AI assistant within an existing codebase.

### Core Objective

Implement a Contacts system and make it accessible to the assistant during normal chat. Users should be able to store contacts and then ask the assistant questions about them.

### Example Workflow

User creates contacts in the application.

Example contact:

- Name: John Doe
- Company: Acme Corp
- Role: CTO
- Email: john@acme.com
- Notes: Interested in AI infrastructure
- Industry: AI Infrastructure
- Location: San Francisco

Later in chat, the user asks:

> Who works at Acme Corp?

The assistant should respond using the stored contact information.

Example response:

> John Doe works at Acme Corp as CTO.

Other possible queries:

- What do we know about John Doe?
- List all contacts that work at Stripe.
- Who are the CTOs in our contacts?
- Which contacts are interested in AI infrastructure?

### Requirements

#### 1. Contacts Data Model

Design and implement a contact model. Contacts should support core fields such as:

- id
- name
- company
- role
- email
- notes
- created_at

In addition to these fields, contacts must support arbitrary attributes that are not strictly defined in the database schema.

Examples of arbitrary attributes:

- Industry
- Location
- Funding Stage
- Interests
- Tags
- Any other key-value metadata

Your system should allow contacts to be tagged or extended with these attributes and ensure they can still be used by the assistant when answering queries.

#### 2. Contact Importing (Mandatory)

The system must support importing contacts in bulk. Contacts should be imported from CSV files.

We will provide three CSV datasets for testing:

- 1,000 contacts
- 10,000 contacts
- 1,000,000 contacts

These datasets contain randomly generated contacts with a mix of structured fields and arbitrary attributes. The links to these CSV files will be provided with the assignment.

Your system should be able to ingest these datasets and store the contacts appropriately. You do not need to optimize specifically for 1 million contacts, but the system should be designed in a way that can reasonably handle large datasets.

#### 3. Contacts UI

Create a simple UI for managing contacts. The UI should allow users to:

- View contacts
- Create contacts
- View contact details
- View arbitrary attributes attached to contacts

A simple sidebar or panel is sufficient.

#### 4. Chat Integration

LibreChat already provides a chat interface. Your task is to integrate contacts so the assistant can answer questions about them during normal chat.

Example user queries:

- Who works at Stripe?
- What do we know about Sarah Chen?
- List all contacts in our system.
- Which contacts are interested in AI infrastructure?

Your system should provide relevant contact information to the model so that it can generate accurate responses. There is no single correct implementation approach.

**Possible approaches:**

- Prompt context injection
- Retrieval of relevant contacts before sending the prompt
- LLM tool/function calling
- Other designs you believe are appropriate

You are encouraged to explain your design decisions.

#### AI Provider

You will be provided with:

- Links to the CSV datasets
- For API Key, you can use Google AI Studio's Free API Key

These will allow you to test your integration with the assistant.

### Bonus Features (Optional)

These are not required, but may earn extra credit:

- Contact search
- Contact editing and deletion
- Contact tagging
- Ability to click a contact and ask the assistant about them
- Improved UI for browsing large contact lists

### Additional Challenge (Extra Credit)

A naive implementation may send all contacts to the AI model whenever the user asks a question.

For extra credit, design your system so the model only receives contacts that are relevant to the user's query.

**Example:**

| User query | Expected behavior |
|------------|-------------------|
| Who works at Acme Corp? | Instead of sending all contacts to the model, the system should attempt to send only contacts related to Acme Corp. |

### Design Questions

Please include short answers to the following questions in your README (see [Implementation — Design questions](#design-questions) below for this fork's answers).

1. If the system needed to support 1,000,000 contacts, how would you redesign it?
2. How would you ensure the assistant retrieves the most relevant contacts for a query?
3. What are the limitations of your current implementation?

### Implementation Notes (Important)

You are extending an existing LibreChat codebase. Please follow the conventions and architecture already present in the project where possible.

During the review process, we may ask follow-up questions about your design decisions and implementation details. Please ensure your code and README clearly explain your reasoning.

### Deliverables

Submit a GitHub repository containing:

- Your implementation changes
- A README with setup instructions
- A short architecture explanation
- Answers to the design questions
- Video recording of final state of assignment with commit id
- AI chat transcript exported

### Expected Time Commitment

The assignment should take approximately **6–10 hours**. You may take up to **3–4 days** to complete it. If you need an extension, feel free to reach out with a reason for the extension.

### Note for Candidates

Please prioritize clarity and thoughtful design over feature completeness. We are more interested in your engineering decisions than in implementing every possible feature.

---

## Implementation (This Fork)

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

### Azure OpenAI Integration

To configure LibreChat to use Azure OpenAI models, define the `azureOpenAI` endpoint in your `librechat.yaml` file (placed in the root of your project).

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
