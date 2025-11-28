import React, { useState } from "react";
import { QueryForm } from "./components/QueryForm";
import { ChunkList } from "./components/ChunkList";
import { ChunkEditor } from "./components/ChunkEditor";
import { queryChunks } from "./services/api";
import type { Chunk, QueryChunksRequest } from "./types/chunk";
import "./App.scss";

function App() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (request: QueryChunksRequest) => {
    setLoading(true);
    setError(null);
    setSelectedChunk(null);

    try {
      const response = await queryChunks(request);
      if (response.success) {
        setChunks(response.chunks);
      } else {
        setError(response.error || "Failed to query chunks");
        setChunks([]);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while querying chunks");
      setChunks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChunk = (chunk: Chunk) => {
    setSelectedChunk(chunk);
  };

  const handleSaveChunk = (updatedChunk: Chunk) => {
    // Update the chunk in the list
    setChunks((prevChunks) =>
      prevChunks.map((c) => (c.id === updatedChunk.id ? updatedChunk : c))
    );
    setSelectedChunk(updatedChunk);
    alert("Chunk updated successfully!");
  };

  const handleCancelEdit = () => {
    setSelectedChunk(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pinecone Chunk Manager</h1>
        <p>Query and update chunks in your Pinecone index</p>
      </header>

      <main className="app-main">
        {!selectedChunk ? (
          <>
            <QueryForm onQuery={handleQuery} loading={loading} />

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <ChunkList
              chunks={chunks}
              onSelectChunk={handleSelectChunk}
              loading={loading}
            />
          </>
        ) : (
          <div className="editor-container">
            <button className="back-button" onClick={handleCancelEdit}>
              ← Back to Results
            </button>
            <ChunkEditor
              chunk={selectedChunk}
              onSave={handleSaveChunk}
              onCancel={handleCancelEdit}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

