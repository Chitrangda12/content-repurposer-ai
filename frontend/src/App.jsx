import { useState } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [platforms, setPlatforms] = useState(["LinkedIn", "Twitter/X", "Instagram", "Threads",]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePlatformChange = (platform) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((item) => item !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const generateContent = async () => {
    if (!content.trim()) {
      setError("Please enter some content first.");
      return;
    }

    if (platforms.length === 0) {
      setError("Please select at least one platform.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("https://contentcrafter-backend.onrender.com/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          tone,
          length,
          platforms,
        }),
      });

      const data = await response.json();
      console.log("AI RESPONSE:", data);

      if (data.success && data.data) {
        setResult({
          linkedin: data.data.linkedin || "",
          twitter: Array.isArray(data.data.twitter) ? data.data.twitter : [],
          instagram: data.data.instagram || "",
          threads: Array.isArray(data.data.threads) ? data.data.threads : [],
          hooks: Array.isArray(data.data.hooks) ? data.data.hooks : [],
          hashtags: Array.isArray(data.data.hashtags) ? data.data.hashtags : [],
          scores: data.data.scores || {
            readability: 0,
            engagement: 0,
            virality: 0,
          },
          suggestions: Array.isArray(data.data.suggestions)
            ? data.data.suggestions
            : [],
        });
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.log(err);
      setError("Backend connection failed. Please check if backend is running.");
    }

    setLoading(false);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  const clearAll = () => {
    setContent("");
    setTone("Professional");
    setLength("Medium");
    setPlatforms(["LinkedIn", "Twitter/X", "Instagram", "Threads"]);
    setResult(null);
    setError("");
  };

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    let y = 20;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;

    const addSection = (title, text) => {
      if (!text) return;

      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const lines = doc.splitTextToSize(text, maxWidth);

      lines.forEach((line) => {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }

        doc.text(line, margin, y);
        y += 6;
      });

      y += 8;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ContentCrafter AI Output", margin, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
    y += 14;

    addSection("LinkedIn Post", result.linkedin);

    if (result.twitter && result.twitter.length > 0) {
      addSection(
        "Twitter/X",
        result.twitter.map((tweet, index) => `${index + 1}. ${tweet}`).join("\n\n")
      );
    }

    addSection("Instagram Caption", result.instagram);

    if (
      result.threads &&
      result.threads.length > 0
    ) {
      addSection(
        "Threads Posts", result.threads.map((post, index) => `${index + 1}. ${post}`).join("\n\n")
      );
    }

    if (result.hooks && result.hooks.length > 0) {
      addSection("Viral Hooks", result.hooks.map((hook) => `- ${hook}`).join("\n"));
    }

    if (result.hashtags && result.hashtags.length > 0) {
      addSection("Hashtags", result.hashtags.join(" "));
    }

    if (result.suggestions && result.suggestions.length > 0) {
      addSection(
        "Improvement Suggestions",
        result.suggestions.map((item) => `- ${item}`).join("\n")
      );
    }

    doc.save("contentcrafter-output.pdf");
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const getCharStatus = (platform, text) => {
    const count = text ? text.length : 0;

    return ` ${count} characters`;
  };
  return (
    <div className="app">
      <header className="hero">
        <h1>ContentCrafter</h1>
        <br />
        <p>
          Transform long-form content into optimized social media posts,
          viral hooks, hashtags, and engagement insights.
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
            placeholder="Paste your blog, article, notes, paragraph, or idea here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="stats">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>

          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option>Professional</option>
            <option>Motivational</option>
            <option>Funny</option>
            <option>Educational</option>
            <option>Startup Founder</option>
            <option>Gen Z</option>
            <option>Storytelling</option>
            <option>Corporate</option>
          </select>

          <label>Length</label>
          <select value={length} onChange={(e) => setLength(e.target.value)}>
            <option>Short</option>
            <option>Medium</option>
            <option>Long</option>
          </select>

          <label>Platforms</label>
          <div className="platforms">
            <div
              className={`platform-card linkedin ${platforms.includes("LinkedIn") ? "active" : ""
                }`}
              onClick={() => handlePlatformChange("LinkedIn")}
            >
              <i className="fa-brands fa-linkedin"></i>
              <span>LinkedIn</span>
            </div>

            <div
              className={`platform-card twitter ${platforms.includes("Twitter/X") ? "active" : ""
                }`}
              onClick={() => handlePlatformChange("Twitter/X")}
            >
              <i className="fa-brands fa-x-twitter"></i>
              <span>Twitter/X</span>
            </div>

            <div
              className={`platform-card instagram ${platforms.includes("Instagram") ? "active" : ""
                }`}
              onClick={() => handlePlatformChange("Instagram")}
            >
              <i className="fa-brands fa-instagram"></i>
              <span>Instagram</span>
            </div>

            <div
              className={`platform-card threads ${platforms.includes("Threads") ? "active" : ""
                }`}
              onClick={() => handlePlatformChange("Threads")}
            >
              <i className="fa-brands fa-threads"></i>
              <span>Threads</span>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="primary-btn" onClick={generateContent} disabled={loading}>
            {loading ? "Generating..." : "Generate Content"}
          </button>
        </section>

        <section className="preview-panel">
          {!result && !loading && (
            <div className="empty-state">
              <h2>Ready to create content</h2>
              <p>Generate optimized content for multiple platforms.</p>

              <div className="placeholder-grid">
                <div className="placeholder-card">
                  <h3>LinkedIn Post</h3>
                  <p>Professional long-form content</p>
                </div>

                <div className="placeholder-card">
                  <h3>Twitter/X</h3>
                  <p>Engaging thread generation</p>
                </div>

                <div className="placeholder-card">
                  <h3>Instagram Caption</h3>
                  <p>Short-form social content</p>
                </div>

                <div className="placeholder-card">
                  <h3>Viral Hooks</h3>
                  <p>Attention-grabbing openers</p>
                </div>

                <div className="placeholder-card">
                  <h3>Content Score</h3>
                  <p>Readability & engagement analysis</p>
                </div>

                <div className="placeholder-card">
                  <h3>Hashtags</h3>
                  <p>Relevant hashtag suggestions</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-card">
              <div className="loader"></div>
              <h2>Generating optimized content...</h2>
              <p>AI is creating posts, hooks, hashtags, and scores.</p>
            </div>
          )}

          {result && (
            <>
              <div className="result-actions">
                <button className="regenerate-btn" onClick={generateContent}>
                  Regenerate
                </button>

                <button className="download-btn" onClick={downloadPDF}>
                  Download PDF
                </button>
              </div>

              <div className="results-grid">

                {result.linkedin && (
                  <OutputCard
                    title="LinkedIn Post"
                    content={result.linkedin}
                    meta={getCharStatus("LinkedIn", result.linkedin)}
                    onCopy={() => copyText(result.linkedin)}
                  />
                )}

                {result.twitter && result.twitter.length > 0 && (
                  <div className="output-card">
                    <div className="output-header">
                      <h3>Twitter/X</h3>
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
                )}

                {result.instagram && (
                  <OutputCard
                    title="Instagram Caption"
                    content={result.instagram}
                    meta={getCharStatus("Instagram", result.instagram)}
                    onCopy={() => copyText(result.instagram)}
                  />
                )}
                {result.threads && result.threads.length > 0 && (
                  <div className="output-card">
                    <div className="output-header">
                      <h3>Threads Posts</h3>

                      <button
                        onClick={() => copyText(result.threads.join("\n\n"))}
                      >
                        Copy
                      </button>
                    </div>

                    <div className="thread-list">
                      {result.threads.map((post, index) => (
                        <p key={index}>
                          <strong>{index + 1}.</strong> {post}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {result.hooks && result.hooks.length > 0 && (
                  <div className="output-card">
                    <div className="output-header">
                      <h3>Viral Hooks</h3>
                      <button onClick={() => copyText(result.hooks.join("\n"))}>
                        Copy
                      </button>
                    </div>

                    <div className="hook-list">
                      {result.hooks.map((hook, index) => (
                        <p key={index}>✨ {hook}</p>
                      ))}
                    </div>
                  </div>
                )}

                {result.hashtags && result.hashtags.length > 0 && (
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
                )}

                {result.scores && (
                  <div className="output-card">
                    <h3>Content Scores</h3>

                    <div className="score-grid">
                      <Score label="Readability" value={result.scores.readability} />
                      <Score label="Engagement" value={result.scores.engagement} />
                      <Score label="Virality" value={result.scores.virality} />
                    </div>
                  </div>
                )}

                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="output-card">
                    <h3>Improvement Suggestions</h3>

                    <ul className="suggestions">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function OutputCard({ title, content, meta, onCopy }) {
  return (
    <div className="output-card">
      <div className="output-header">
        <h3>{title}</h3>

        <div className="header-actions">
          {meta && <span className="content-meta">{meta}</span>}

          <button onClick={onCopy}>Copy</button>
        </div>
      </div>

      <p>{content}</p>
    </div>
  );
}

function Score({ label, value }) {
  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>{value || 0}/100</strong>
    </div>
  );
}

export default App;