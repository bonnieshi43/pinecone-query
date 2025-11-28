# Pinecone Update - Chunk Management Tool

A web application for querying and updating chunks in your Pinecone vector database.

## Features

- 🔍 **Query Chunks**: Search chunks by module, name, path, or semantic text search
- ✏️ **Edit Chunks**: Update chunk content and metadata (summary, tags, etc.)
- 📊 **View Details**: Inspect individual chunk information
- 🎨 **Modern UI**: Clean and intuitive user interface

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Pinecone account with API key
- Voyage AI API key (for generating embeddings when updating content)

## Installation

1. **Install dependencies for all packages:**

```bash
npm run install:all
```

2. **Configure environment variables:**

Copy the example environment file and fill in your credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=your_index_name_here
VOYAGE_API_KEY=your_voyage_api_key_here
VOYAGE_EMBEDDING_MODEL=voyage-3
PORT=3102
```

## Running the Application

### Development Mode

Run both frontend and backend servers:

```bash
npm run dev
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:3102

### Production Mode

1. Build all packages:

```bash
npm run build:all
```

2. Start the servers:

```bash
npm start
```

## Usage

### Querying Chunks

1. Open the application in your browser (http://localhost:3001)
2. Use the query form to search for chunks:
   - **Module**: Filter by module name
   - **Name**: Filter by document name
   - **Path**: Filter by document path
   - **Query Text**: Semantic search using text similarity
   - **Max Results**: Limit the number of results returned

3. Click "Search" to execute the query
4. Results will be displayed in a list below the form

### Editing Chunks

1. Click on a chunk from the search results (or click the "Edit" button)
2. The chunk editor will open with:
   - **Content**: Editable text area for chunk content
   - **Summary**: Add or edit a summary
   - **Tags**: Add comma-separated tags
   - **Read-only metadata**: Module, name, path, chunk index, etc.

3. Make your changes and click "Save Changes"
4. The chunk will be updated in Pinecone (embedding will be regenerated if content changed)

## API Endpoints

### Health Check
```
GET /api/health
```

### Query Chunks
```
POST /api/chunks/query
Body: {
  module?: string;
  name?: string;
  path?: string;
  queryText?: string;
  topK?: number;
  page?: number;
  pageSize?: number;
}
```

### Get Chunk by ID
```
GET /api/chunks/:chunkId
```

### Update Chunk
```
PUT /api/chunks/:chunkId
Body: {
  pageContent?: string;
  metadata?: {
    summary?: string;
    tags?: string[];
    [key: string]: any;
  }
}
```

### Get Index Stats
```
GET /api/stats
```

## Project Structure

```
pinecone-update/
├── server/              # Backend Express server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── types/       # TypeScript types
│   └── .env             # Environment variables
├── web/                 # Frontend React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript types
└── package.json         # Root package.json
```

## Technical Details

### Backend
- **Framework**: Express.js with TypeScript
- **Vector DB**: Pinecone
- **Embeddings**: Voyage AI (via LangChain)
- **Port**: 3102 (configurable)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS
- **Port**: 3001

## Notes

- When updating chunk content, the embedding is automatically regenerated using Voyage AI
- Metadata-only updates don't require embedding regeneration
- The application supports partial matching for module, name, and path filters
- Semantic search uses vector similarity when query text is provided

## Troubleshooting

### Connection Issues
- Verify your Pinecone API key and index name in `.env`
- Check that the Pinecone index exists and is accessible
- Ensure Voyage AI API key is configured if you plan to update content

### Query Returns No Results
- Try using broader search criteria
- Check that your Pinecone index contains data
- Verify metadata field names match your index structure

### Update Fails
- Ensure the chunk ID is valid
- Check that Voyage AI API key is configured
- Verify network connectivity to Pinecone and Voyage AI services

## License

MIT

