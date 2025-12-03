import React, { useState } from "react";
import type { QueryChunksRequest } from "../types/chunk";
import "./QueryForm.scss";

interface QueryFormProps {
  onQuery: (request: QueryChunksRequest) => void;
  loading?: boolean;
}

export const QueryForm: React.FC<QueryFormProps> = ({ onQuery, loading }) => {
  const [id, setId] = useState("");
  const [module, setModule] = useState("");
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [queryText, setQueryText] = useState("");
  const [topK, setTopK] = useState(20);
  const [useMetadataFilter, setUseMetadataFilter] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证至少有一个查询条件
    if (!id && !module && !name && !path && !queryText) {
      alert("Please provide at least one query parameter");
      return;
    }

    const request: QueryChunksRequest = {
      id: id || undefined,
      module: module || undefined,
      name: name || undefined,
      path: path || undefined,
      queryText: queryText || undefined,
      metadataFilter: useMetadataFilter,
      topK: topK || 20,
      page: 1,
      pageSize: 20,
    };

    onQuery(request);
  };

  const handleReset = () => {
    setId("");
    setModule("");
    setName("");
    setPath("");
    setQueryText("");
    setTopK(20);
    setUseMetadataFilter(false);
  };

  return (
    <form className="query-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="id">Chunk ID:</label>
          <input
            id="id"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Search by chunk ID"
          />
        </div>

        <div className="form-group">
          <label htmlFor="module">Module:</label>
          <input
            id="module"
            type="text"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            placeholder="Filter by module name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Filter by document name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="path">Path:</label>
          <input
            id="path"
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="Filter by document path"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group full-width">
          <label htmlFor="queryText">Query Text (Semantic Search):</label>
          <textarea
            id="queryText"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Enter text for semantic search"
            rows={4}
          />
        </div>
      </div>

      <div className="form-row metadata-filter-row">
        <button
          type="button"
          className={`metadata-filter-toggle ${useMetadataFilter ? "active" : ""}`}
          onClick={() => setUseMetadataFilter((prev) => !prev)}
        >
          {useMetadataFilter ? "Metadata Filter: ON" : "Metadata Filter: OFF"}
        </button>
        <span className="metadata-filter-hint">开启后按 Module/Name/Path 精确过滤 metadata</span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="topK">Max Results:</label>
          <input
            id="topK"
            type="number"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value) || 20)}
            min="1"
            max="100"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  );
};

