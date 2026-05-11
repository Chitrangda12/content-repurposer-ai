import { useState } from "react";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("Professional");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateContent = async () => {
    if (!content.trim()) {
      setError("Please enter some content first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          tone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Backend connection failed. Please check if backend is running.");
    }

    setLoading(false);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const clearAll = () => {
    setContent("");
    setResult(null);
    setError("");
    setTone("Professional");
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="app">
      <header className="hero">
        <div className="badge">AI Content Repurposer</div>
        <h1>ContentCrafter AI</h1>
        <p>
          Turn long-form content into LinkedIn posts, Twitter/X threads,
          Instagram captions, and hashtags in seconds.
        </p>
      </header>

      <main className="layout">
        <section className="input-panel">
          <div className="panel-header">
            <h2>Input Content</h2>
            <button className="secondary-btn" onClick={clearAll}>
              Clear
            </button>
          </div>

          <textarea
            placeholder="Paste your blog, article, paragraph, notes, or idea here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="stats">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>

          <label>Select Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option>Professional</option>
            <option>Motivational</option>
            <option>Funny</option>
            <option>Educational</option>
            <option>Startup Style</option>
            <option>Creative</option>
          </select>

          {error && <p className="error">{error}</p>}

          <button className="primary-btn" onClick={generateContent} disabled={loading}>
            {loading ? "Generating Content..." : "Generate Content"}
          </button>
        </section>

        <section className="preview-panel">
          {!result && !loading && (
            <div className="empty-state">
              <h2>Your AI-generated content will appear here</h2>
              <p>
                Enter content, choose a tone, and generate platform-ready posts.
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-card">
              <div className="loader"></div>
              <h2>Creating optimized content...</h2>
              <p>Please wait while AI repurposes your text.</p>
            </div>
          )}

          {result && (
            <div className="results-grid">
              <OutputCard
                title="LinkedIn Post"
                content={result.linkedin}
                onCopy={() => copyText(result.linkedin)}
              />

              <div className="output-card">
                <div className="output-header">
                  <h3>Twitter/X Thread</h3>
                  <button onClick={() => copyText(result.twitter.join("\n\n"))}>
                    Copy
                  </button>
                </div>

                <div className="thread-list">
                  {result.twitter.map((tweet, index) => (
                    <p key={index}>
                      <strong>{index + 1}.</strong> {tweet}
                    </p>
                  ))}
                </div>
              </div>

              <OutputCard
                title="Instagram Caption"
                content={result.instagram}
                onCopy={() => copyText(result.instagram)}
              />

              <div className="output-card">
                <div className="output-header">
                  <h3>Hashtags</h3>
                  <button onClick={() => copyText(result.hashtags.join(" "))}>
                    Copy
                  </button>
                </div>

                <div className="hashtags">
                  {result.hashtags.map((tag, index) => (
                    <span key={index}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function OutputCard({ title, content, onCopy }) {
  return (
    <div className="output-card">
      <div className="output-header">
        <h3>{title}</h3>
        <button onClick={onCopy}>Copy</button>
      </div>
      <p>{content}</p>
    </div>
  );
}

export default App;