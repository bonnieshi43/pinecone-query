import React, { useState } from "react";
import { QueryForm } from "./components/QueryForm";
import { ChunkList } from "./components/ChunkList";
import { ChunkEditor } from "./components/ChunkEditor";
import { QueryProcessor } from "./components/QueryProcessor";
import { queryChunks } from "./services/api";
import type { Chunk, QueryChunksRequest } from "./types/chunk";
import "./App.scss";

type TabType = "query" | "processor";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("query");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryPrompt, setQueryPrompt] = useState<string>("");
  const [queryTextValue, setQueryTextValue] = useState<string>("");
  const [processorPrompt, setProcessorPrompt] = useState<string>("");
  const [processorQuery, setProcessorQuery] = useState<string>("");
  const [processorResults, setProcessorResults] = useState<string[]>([]);

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

  const handleDeleteChunk = (chunkId: string) => {
    // Remove the chunk from the list
    setChunks((prevChunks) => prevChunks.filter((c) => c.id !== chunkId));
    setSelectedChunk(null);
    alert("Chunk deleted successfully!");
  };

  const handleCancelEdit = () => {
    setSelectedChunk(null);
  };

  const handleResultSelect = (result: string) => {
    // 将处理结果填充到 QueryForm 的 queryText 字段
    setQueryTextValue(result);
    // 切换回 Pinecone Query 标签，方便直接搜索
    setActiveTab("query");
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
            <div className="tabs">
              <button
                className={`tab-button ${activeTab === "query" ? "active" : ""}`}
                onClick={() => setActiveTab("query")}
              >
                Pinecone Query
              </button>
              <button
                className={`tab-button ${activeTab === "processor" ? "active" : ""}`}
                onClick={() => setActiveTab("processor")}
              >
                Query Processor
              </button>
            </div>

            {activeTab === "query" ? (
              <>
                <QueryForm 
                  onQuery={handleQuery} 
                  loading={loading}
                  initialPrompt={queryPrompt}
                  initialQueryText={queryTextValue}
                  onPromptChange={setQueryPrompt}
                  onQueryTextChange={setQueryTextValue}
                />

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
              <QueryProcessor
                onResultSelect={handleResultSelect}
                initialPrompt={processorPrompt}
                onPromptChange={setProcessorPrompt}
                initialQuery={processorQuery}
                onQueryChange={setProcessorQuery}
                initialResults={processorResults}
                onResultsChange={setProcessorResults}
              />
            )}
          </>
        ) : (
          <div className="editor-container">
            <button className="back-button" onClick={handleCancelEdit}>
              ← Back to Results
            </button>
            <ChunkEditor
              chunk={selectedChunk}
              onSave={handleSaveChunk}
              onDelete={handleDeleteChunk}
              onCancel={handleCancelEdit}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

