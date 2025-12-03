import React from "react";
import type { Chunk } from "../types/chunk";
import "./ChunkList.scss";

interface ChunkListProps {
  chunks: Chunk[];
  onSelectChunk: (chunk: Chunk) => void;
  loading?: boolean;
}

export const ChunkList: React.FC<ChunkListProps> = ({ chunks, onSelectChunk, loading }) => {
  if (loading) {
    return (
      <div className="chunk-list loading">
        <p>Loading chunks...</p>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="chunk-list empty">
        <p>No chunks found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="chunk-list">
      <div className="chunk-list-header">
        <h3>Search Results ({chunks.length})</h3>
      </div>
      <div className="chunk-items">
        {chunks.map((chunk) => {
          const contextText = chunk.metadata.summary || chunk.pageContent;
          return (
            <div
              key={chunk.id}
              className="chunk-item"
              onClick={() => onSelectChunk(chunk)}
            >
              <div className="chunk-header">
                {chunk.score !== undefined && (
                  <span className="chunk-score">Score: {chunk.score.toFixed(4)}</span>
                )}
                <span className="chunk-id">ID: {chunk.id}</span>
              </div>
              <div className="chunk-metadata">
                {/* 标准字段 */}
                {chunk.metadata.type && (
                  <span className="metadata-tag">Type: {chunk.metadata.type}</span>
                )}
                {chunk.metadata.module && (
                  <span className="metadata-tag">Module: {chunk.metadata.module}</span>
                )}
                {chunk.metadata.name && (
                  <span className="metadata-tag">Name: {chunk.metadata.name}</span>
                )}
                {chunk.metadata.path && (
                  <span className="metadata-tag">Path: {chunk.metadata.path}</span>
                )}
                {chunk.metadata.chunkIndex !== undefined && (
                  <span className="metadata-tag">Chunk Index: {chunk.metadata.chunkIndex}</span>
                )}
                {chunk.metadata.summary && (
                  <span className="metadata-tag">Summary: {chunk.metadata.summary}</span>
                )}
                {chunk.metadata.tags && chunk.metadata.tags.length > 0 && (
                  <span className="metadata-tag">Tags: {chunk.metadata.tags.join(", ")}</span>
                )}
                {chunk.metadata.keywords && chunk.metadata.keywords.length > 0 && (
                  <span className="metadata-tag">Keywords: {chunk.metadata.keywords.join(", ")}</span>
                )}
                {chunk.metadata.lastModified && (
                  <span className="metadata-tag">
                    Last Modified: {new Date(chunk.metadata.lastModified).toLocaleString()}
                  </span>
                )}
                {chunk.metadata.extra && Object.keys(chunk.metadata.extra).length > 0 && (
                  <span className="metadata-tag">
                    Extra: {Object.entries(chunk.metadata.extra).map(([k, v]) => `${k}=${v}`).join(", ")}
                  </span>
                )}
                {/* 显示所有其他自定义字段 */}
                {Object.keys(chunk.metadata)
                  .filter((key) => {
                    // 排除已显示的标准字段和特殊字段
                    const standardFields = [
                      "type",
                      "module",
                      "name",
                      "path",
                      "chunkIndex",
                      "summary",
                      "tags",
                      "keywords",
                      "lastModified",
                      "extra",
                      "pageContent",
                      "text",
                    ];
                    return !standardFields.includes(key);
                  })
                  .map((key) => {
                    const value = chunk.metadata[key];
                    // 格式化不同类型的值
                    let displayValue: string;
                    if (value === null || value === undefined) {
                      return null;
                    } else if (Array.isArray(value)) {
                      displayValue = value.join(", ");
                    } else if (typeof value === "object") {
                      displayValue = JSON.stringify(value);
                    } else {
                      displayValue = String(value);
                    }
                    return (
                      <span key={key} className="metadata-tag">
                        {key}: {displayValue}
                      </span>
                    );
                  })}
              </div>
              <div className="chunk-content-preview">
                {chunk.pageContent.substring(0, 200)}
                {chunk.pageContent.length > 200 && "..."}
              </div>
              <button className="edit-button">Edit</button>
              <div className="chunk-tooltip">
                <div className="chunk-tooltip-title">Context</div>
                <div className="chunk-tooltip-content">{contextText}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

