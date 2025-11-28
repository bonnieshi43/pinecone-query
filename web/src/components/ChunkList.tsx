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
        {chunks.map((chunk) => (
          <div key={chunk.id} className="chunk-item" onClick={() => onSelectChunk(chunk)}>
            <div className="chunk-header">
              <span className="chunk-id">ID: {chunk.id}</span>
              {chunk.score !== undefined && (
                <span className="chunk-score">Score: {chunk.score.toFixed(4)}</span>
              )}
            </div>
            <div className="chunk-metadata">
              {chunk.metadata.module && (
                <span className="metadata-tag">Module: {chunk.metadata.module}</span>
              )}
              {chunk.metadata.name && (
                <span className="metadata-tag">Name: {chunk.metadata.name}</span>
              )}
              {chunk.metadata.path && (
                <span className="metadata-tag">Path: {chunk.metadata.path}</span>
              )}
              {chunk.metadata.keywords && chunk.metadata.keywords.length > 0 && (
                <span className="metadata-tag">Keywords: {chunk.metadata.keywords.join(", ")}</span>
              )}
              {chunk.metadata.extra && Object.keys(chunk.metadata.extra).length > 0 && (
                <span className="metadata-tag">
                  Extra: {Object.entries(chunk.metadata.extra).map(([k, v]) => `${k}=${v}`).join(", ")}
                </span>
              )}
            </div>
            <div className="chunk-content-preview">
              {chunk.pageContent.substring(0, 200)}
              {chunk.pageContent.length > 200 && "..."}
            </div>
            <button className="edit-button">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
};

