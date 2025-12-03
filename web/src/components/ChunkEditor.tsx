import React, { useState, useEffect } from "react";
import type { Chunk, ChunkMetadata } from "../types/chunk";
import { updateChunk } from "../services/api";
import "./ChunkEditor.scss";

interface ChunkEditorProps {
  chunk: Chunk;
  onSave: (chunk: Chunk) => void;
  onCancel: () => void;
}

export const ChunkEditor: React.FC<ChunkEditorProps> = ({ chunk, onSave, onCancel }) => {
  const [pageContent, setPageContent] = useState(chunk.pageContent);
  const [metadata, setMetadata] = useState<ChunkMetadata>({ ...chunk.metadata });
  const [summary, setSummary] = useState(metadata.summary || "");
  const [tags, setTags] = useState((metadata.tags || []).join(", "));
  const [keywords, setKeywords] = useState((metadata.keywords || []).join(", "));
  const [extra, setExtra] = useState<Record<string, string>>(metadata.extra || {});
  const [extraKey, setExtraKey] = useState("");
  const [extraValue, setExtraValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageContent(chunk.pageContent);
    setMetadata({ ...chunk.metadata });
    setSummary(chunk.metadata.summary || "");
    setTags((chunk.metadata.tags || []).join(", "));
    setKeywords((chunk.metadata.keywords || []).join(", "));
    setExtra(chunk.metadata.extra || {});
  }, [chunk]);

  const handleAddExtra = () => {
    if (extraKey.trim() && extraValue.trim()) {
      setExtra({ ...extra, [extraKey.trim()]: extraValue.trim() });
      setExtraKey("");
      setExtraValue("");
    }
  };

  const handleRemoveExtra = (key: string) => {
    const newExtra = { ...extra };
    delete newExtra[key];
    setExtra(newExtra);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedMetadata: ChunkMetadata = {
        ...metadata,
        summary: summary || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter((t) => t) : undefined,
        keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter((k) => k) : undefined,
        extra: Object.keys(extra).length > 0 ? extra : undefined,
        lastModified: new Date().toISOString(),
      };

      const response = await updateChunk(chunk.id, {
        pageContent: pageContent !== chunk.pageContent ? pageContent : undefined,
        metadata: updatedMetadata,
      });

      if (response.success && response.chunk) {
        onSave(response.chunk);
      } else {
        setError(response.error || "Failed to update chunk");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the chunk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chunk-editor">
      <div className="editor-header">
        <h2>Edit Chunk</h2>
        <div className="chunk-id-display">ID: {chunk.id}</div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="editor-content">
        <div className="editor-section">
          <label htmlFor="pageContent">Content:</label>
          <textarea
            id="pageContent"
            value={pageContent}
            onChange={(e) => setPageContent(e.target.value)}
            rows={15}
            className="content-textarea"
          />
        </div>

        <div className="editor-section">
          <h3>Metadata</h3>

          <div className="metadata-field">
            <label htmlFor="summary">Summary:</label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Enter a summary for this chunk"
            />
          </div>

          <div className="metadata-field">
            <label htmlFor="tags">Tags (comma-separated):</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="metadata-field">
            <label htmlFor="keywords">Keywords (comma-separated):</label>
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div className="metadata-field">
            <label>Extra (Custom Key-Value Pairs):</label>
            <div className="extra-editor">
              <div className="extra-pairs">
                {Object.entries(extra).map(([key, value]) => (
                  <div key={key} className="extra-pair">
                    <span className="extra-key">{key}:</span>
                    <span className="extra-value">{value}</span>
                    <button
                      type="button"
                      className="remove-extra-button"
                      onClick={() => handleRemoveExtra(key)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="extra-input">
                <input
                  type="text"
                  value={extraKey}
                  onChange={(e) => setExtraKey(e.target.value)}
                  placeholder="Key"
                  className="extra-key-input"
                />
                <input
                  type="text"
                  value={extraValue}
                  onChange={(e) => setExtraValue(e.target.value)}
                  placeholder="Value"
                  className="extra-value-input"
                />
                <button
                  type="button"
                  className="add-extra-button"
                  onClick={handleAddExtra}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="metadata-readonly">
            <h4>Read-only Fields</h4>
            <div className="readonly-field">
              <label>Module:</label>
              <span>{metadata.module || "N/A"}</span>
            </div>
            <div className="readonly-field">
              <label>Name:</label>
              <span>{metadata.name || "N/A"}</span>
            </div>
            <div className="readonly-field">
              <label>Path:</label>
              <span>{metadata.path || "N/A"}</span>
            </div>
            <div className="readonly-field">
              <label>Type:</label>
              <span>{metadata.type || "N/A"}</span>
            </div>
            <div className="readonly-field">
              <label>Chunk Index:</label>
              <span>{metadata.chunkIndex !== undefined ? metadata.chunkIndex : "N/A"}</span>
            </div>
            {metadata.lastModified && (
              <div className="readonly-field">
                <label>Last Modified:</label>
                <span>{new Date(metadata.lastModified).toLocaleString()}</span>
              </div>
            )}
            {/* 显示所有其他自定义字段 */}
            {Object.keys(metadata)
              .filter((key) => {
                // 排除已显示的标准字段和可编辑字段
                const standardFields = [
                  "module",
                  "name",
                  "path",
                  "type",
                  "chunkIndex",
                  "lastModified",
                  "summary",
                  "tags",
                  "keywords",
                  "extra",
                  "pageContent",
                  "text",
                ];
                return !standardFields.includes(key);
              })
              .map((key) => {
                const value = metadata[key];
                let displayValue: string;
                if (value === null || value === undefined) {
                  displayValue = "N/A";
                } else if (Array.isArray(value)) {
                  displayValue = value.join(", ");
                } else if (typeof value === "object") {
                  displayValue = JSON.stringify(value, null, 2);
                } else {
                  displayValue = String(value);
                }
                return (
                  <div key={key} className="readonly-field">
                    <label>{key}:</label>
                    <span>{displayValue}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button onClick={handleSave} disabled={loading} className="save-button">
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button onClick={onCancel} disabled={loading} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
};

