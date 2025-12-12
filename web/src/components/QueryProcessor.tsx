import React, { useState, useEffect } from "react";
import "./QueryProcessor.scss";

interface QueryProcessorProps {
  onResultSelect?: (result: string) => void;
  initialPrompt?: string;
  onPromptChange?: (prompt: string) => void;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  initialResults?: string[];
  onResultsChange?: (results: string[]) => void;
}

export const QueryProcessor: React.FC<QueryProcessorProps> = ({
  onResultSelect,
  initialPrompt,
  onPromptChange,
  initialQuery,
  onQueryChange,
  initialResults,
  onResultsChange,
}) => {
  const [query, setQuery] = useState(initialQuery || "");
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [results, setResults] = useState<string[]>(initialResults || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 保持 prompt 在父组件控制下的同步
  useEffect(() => {
    if (initialPrompt !== undefined) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // 保持 query 在父组件控制下的同步
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // 保持 results 在父组件控制下的同步
  useEffect(() => {
    if (initialResults !== undefined) {
      setResults(initialResults);
    }
  }, [initialResults]);

  const handleProcess = async () => {
    if (!query.trim()) {
      alert("Please enter a query to process");
      return;
    }

    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    if (onResultsChange) onResultsChange([]);

    try {
      const response = await fetch("/api/query/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process query");
      }

      const data = await response.json();
      if (data.success && data.results) {
        setResults(data.results);
        if (onResultsChange) onResultsChange(data.results);
      } else {
        throw new Error(data.error || "Failed to process query");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while processing the query");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    if (onQueryChange) onQueryChange("");
    setPrompt("");
    if (onPromptChange) onPromptChange("");
    setResults([]);
    if (onResultsChange) onResultsChange([]);
    setError(null);
  };

  const handleCopyResult = () => {
    if (results.length > 0) {
      const text = results.join("\n");
      navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    }
  };

  const handleUseResult = (value: string) => {
    if (value && onResultSelect) {
      onResultSelect(value);
    }
  };

  return (
    <div className="query-processor">
      <div className="processor-header">
        <h3>Query Processor</h3>
        <p>Process your query using AI with custom prompts</p>
      </div>

      <div className="processor-controls">
        <div className="form-group">
          <label htmlFor="query-input">Query:</label>
          <textarea
            id="query-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (onQueryChange) onQueryChange(e.target.value);
            }}
            placeholder="Enter your query here..."
            rows={2}
          />
        </div>

        <div className="form-group">
          <label htmlFor="prompt-input">Prompt:</label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (onPromptChange) onPromptChange(e.target.value);
            }}
            placeholder="Enter instructions for processing (e.g., simplify, rewrite, decompose, etc.)"
            rows={7}
          />
        </div>

        <div className="processor-actions">
          <button
            type="button"
            onClick={handleProcess}
            disabled={loading || !query.trim()}
            className="process-button"
          >
            {loading ? "Processing..." : "Process Query"}
          </button>
          <button type="button" onClick={handleReset} className="reset-button">
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="result-section">
          <div className="result-header">
            <h4>Results ({results.length}):</h4>
            <div className="result-actions">
              <button
                type="button"
                onClick={handleCopyResult}
                className="copy-button"
              >
                Copy All
              </button>
            </div>
          </div>
          <div className="result-content">
            <ul className="decompose-list">
              {results.map((item, index) => (
                <li key={index}>
                  <div className="result-item">
                    <div className="result-item-text">{item}</div>
                    {onResultSelect && (
                      <button
                        type="button"
                        className="use-button"
                        onClick={() => handleUseResult(item)}
                      >
                        Use in Query
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

