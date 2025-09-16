import React, { useState, useRef } from "react";

/*******************************
 * AI Resume Builder - Single File App
 * Drop this file into your Stackblitz React project's src/App.tsx
 * - Default export a React component so Stackblitz can preview it
 * - This file intentionally contains:
 *   - A lightweight form-driven UI for collecting resume data
 *   - Three ATS-friendly templates (Minimal, Modern, Executive)
 *   - An "AI generate" placeholder that shows how to call a backend
 *   - A printable PDF-friendly stylesheet (uses window.print())
 *   - An ATS-ish analyzer and job-description keyword helper
 *
 * IMPORTANT:
 * - This is a front-end prototype. To call real AI (OpenAI/GPT/etc.)
 *   you should create a small serverless endpoint that stores your API key
 *   securely and forwards requests. See the comments around generateWithAI()
 *
 *******************************/

type Experience = {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
};

type Education = {
  id: string;
  school: string;
  degree: string;
  year: string;
};

type ResumeData = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
};

const blankExperience = (): Experience => ({
  id: String(Math.random()).slice(2),
  company: "",
  role: "",
  start: "",
  end: "",
  bullets: [""]
});

const blankEducation = (): Education => ({
  id: String(Math.random()).slice(2),
  school: "",
  degree: "",
  year: ""
});

const initialResume: ResumeData = {
  fullName: "Your Name",
  title: "Job Title (e.g. Senior Frontend Engineer)",
  email: "name@example.com",
  phone: "(555) 555-5555",
  location: "City, Country",
  summary:
    "Concise 2-3 line professional summary. Use action words and mention your job title and years of experience.",
  experiences: [blankExperience()],
  education: [blankEducation()],
  skills: ["JavaScript", "React", "Team Leadership"]
};

// Helpful utility: simple keyword extractor from job description
function extractKeywords(text: string, topN = 15) {
  const words = text
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const freq: Record<string, number> = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  const keys = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  return keys.slice(0, topN);
}

export default function App() {
  const [resume, setResume] = useState<ResumeData>(initialResume);
  const [selectedTemplate, setSelectedTemplate] = useState<"minimal" | "modern" | "executive">("minimal");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [aiBusy, setAIBusy] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // --- helpers to mutate resume state ---
  function updateField<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    setResume((r) => ({ ...r, [key]: value }));
  }

  function updateExperience(id: string, patch: Partial<Experience>) {
    setResume((r) => ({
      ...r,
      experiences: r.experiences.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex))
    }));
  }

  function addExperience() {
    setResume((r) => ({ ...r, experiences: [...r.experiences, blankExperience()] }));
  }

  function removeExperience(id: string) {
    setResume((r) => ({ ...r, experiences: r.experiences.filter((e) => e.id !== id) }));
  }

  function addExperienceBullet(id: string) {
    setResume((r) => ({
      ...r,
      experiences: r.experiences.map((ex) => (ex.id === id ? { ...ex, bullets: [...ex.bullets, ""] } : ex))
    }));
  }

  function updateExperienceBullet(id: string, idx: number, text: string) {
    setResume((r) => ({
      ...r,
      experiences: r.experiences.map((ex) =>
        ex.id === id ? { ...ex, bullets: ex.bullets.map((b, i) => (i === idx ? text : b)) } : ex
      )
    }));
  }

  function addSkill(skill = "") {
    setResume((r) => ({ ...r, skills: [...r.skills, skill] }));
  }

  function updateSkill(i: number, value: string) {
    setResume((r) => ({ ...r, skills: r.skills.map((s, idx) => (idx === i ? value : s)) }));
  }

  function removeSkill(i: number) {
    setResume((r) => ({ ...r, skills: r.skills.filter((_, idx) => idx !== i) }));
  }

  function addEducation() {
    setResume((r) => ({ ...r, education: [...r.education, blankEducation()] }));
  }

  function updateEducation(id: string, patch: Partial<Education>) {
    setResume((r) => ({
      ...r,
      education: r.education.map((ed) => (ed.id === id ? { ...ed, ...patch } : ed))
    }));
  }

  // Simple ATS-ish analyzer
  function analyzeATS() {
    // Criteria (simple prototype):
    // - Presence of name/title/contact
    // - No images or complex layout
    // - Bullet points used
    // - Uses plain fonts / short summary
    let score = 50;
    if (resume.fullName && resume.title) score += 10;
    if (resume.email && resume.phone) score += 10;
    // more bullets increases score
    const bulletsCount = resume.experiences.reduce((s, ex) => s + ex.bullets.filter(Boolean).length, 0);
    score += Math.min(20, bulletsCount * 2);
    // negative if user uses odd characters in summary
    if (/[<>\/=]/.test(resume.summary)) score -= 10;
    score = Math.max(0, Math.min(100, score));
    setAtsScore(Math.round(score));
    return score;
  }

  // Download as PDF via print - simpler and ATS-friendly. For production, use server-side PDF or html2pdf.
  function downloadPDF() {
    // Add a short CSS tweak for print - we included print styles in the preview area
    window.print();
  }

  // Copy resume HTML to clipboard (so user can paste to email or Word)
  async function copyHtmlToClipboard() {
    if (!previewRef.current) return;
    const html = previewRef.current.innerHTML;
    try {
      await navigator.clipboard.writeText(html);
      alert("Resume HTML copied to clipboard — you can paste into a document or email.");
    } catch (e) {
      alert("Copy failed — your browser may block clipboard from this site.");
    }
  }

  // Basic local "AI" generator: combine fields into stronger summary/bullets.
  // This is a local heuristic generator so you can prototype without an API.
  function generateLocal() {
    // create an improved summary from role and skills
    const skillList = resume.skills.filter(Boolean).slice(0, 6).join(", ");
    const years = resume.summary.match(/\d+\+?\s+years/)?.[0] || "several years";
    const newSummary = `${resume.title} with ${years} of experience. Skilled in ${skillList}. Proven record of delivering results.`;
    // create bullets for first experience
    const newExperiences = resume.experiences.map((ex, idx) => {
      const bullets = ex.bullets.slice();
      if (!bullets.filter(Boolean).length) {
        bullets[0] = `Led ${Math.max(1, idx + 1)} project(s) to improve product metrics and deliver value.`;
        bullets[1] = `Used ${resume.skills.slice(0, 3).join(", ")} to solve complex problems and ship features.`;
      }
      return { ...ex, bullets };
    });
    setResume((r) => ({ ...r, summary: newSummary, experiences: newExperiences }));
  }

  // AI generation placeholder - DO NOT put secret API keys here in client code in production
  // Recommended flow:
  // 1) Create a small serverless function (Vercel/Netlify/AWS Lambda) that stores your OpenAI key.
  // 2) The client calls that endpoint with the user's resume skeleton and jobDescription.
  // 3) The server calls OpenAI and returns the generated text.
  // Example server API contract: POST /api/generate { resume, jobDescription } => { improvedSummary, improvedBullets }
  async function generateWithAI() {
    setAIBusy(true);
    try {
      // Example fetch (replace /api/generate with your serverless endpoint)
      // const resp = await fetch('/api/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ resume, jobDescription })
      // });
      // const data = await resp.json();
      // if (data.improvedSummary) updateField('summary', data.improvedSummary);
      // if (data.experiences) setResume(r => ({ ...r, experiences: data.experiences }));

      // For now: fallback to the local generator so you can test UX without a server or API key
      await new Promise((res) => setTimeout(res, 900));
      generateLocal();
    } catch (err) {
      console.error(err);
      alert("AI generation failed — check the server logs or network.");
    } finally {
      setAIBusy(false);
    }
  }

  // Renderers for templates - keep markup simple and ATS-friendly (no fancy columns or images)
  const TemplateRenderer: React.FC<{ data: ResumeData; variant: string }> = ({ data, variant }) => {
    if (variant === "modern") {
      return (
        <div className="resume modern" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
          <header style={{ borderBottom: "2px solid #222", paddingBottom: 8, marginBottom: 12 }}>
            <h1 style={{ margin: 0 }}>{data.fullName}</h1>
            <div style={{ fontWeight: 600 }}>{data.title} • {data.location}</div>
            <div style={{ marginTop: 6 }}>{data.email} • {data.phone}</div>
          </header>
          <section>
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>Summary</h2>
            <p style={{ marginTop: 0 }}>{data.summary}</p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>Experience</h2>
            {data.experiences.map((ex) => (
              <div key={ex.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{ex.role} — {ex.company}</div>
                <div style={{ fontStyle: "italic", fontSize: 12 }}>{ex.start} • {ex.end}</div>
                <ul>
                  {ex.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section>
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>Education</h2>
            {data.education.map((ed) => (
              <div key={ed.id}>
                <div style={{ fontWeight: 700 }}>{ed.school} — {ed.degree}</div>
                <div style={{ fontSize: 12 }}>{ed.year}</div>
              </div>
            ))}
          </section>

          <section>
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>Skills</h2>
            <div>{data.skills.join(" • ")}</div>
          </section>
        </div>
      );
    }

    if (variant === "executive") {
      return (
        <div className="resume executive" style={{ fontFamily: "Georgia, serif" }}>
          <header style={{ textAlign: "center", marginBottom: 12 }}>
            <h1 style={{ marginBottom: 2 }}>{data.fullName}</h1>
            <div style={{ fontWeight: 600 }}>{data.title}</div>
            <div style={{ fontSize: 13 }}>{data.email} • {data.phone} • {data.location}</div>
          </header>
          <section>
            <h3 style={{ marginBottom: 6 }}>Executive Summary</h3>
            <p style={{ marginTop: 0 }}>{data.summary}</p>
          </section>
          <section>
            <h3>Professional Experience</h3>
            {data.experiences.map((ex) => (
              <div key={ex.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{ex.role} @ {ex.company}</div>
                <div style={{ fontStyle: "italic", fontSize: 12 }}>{ex.start} — {ex.end}</div>
                <ul>
                  {ex.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </section>
          <section>
            <h3>Education & Skills</h3>
            <div>
              {data.education.map((ed) => <div key={ed.id}>{ed.school} — {ed.degree} ({ed.year})</div>)}
            </div>
            <div style={{ marginTop: 8 }}>{data.skills.join(', ')}</div>
          </section>
        </div>
      );
    }

    // minimal
    return (
      <div className="resume minimal" style={{ fontFamily: "Calibri, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ margin: 0 }}>{data.fullName}</h1>
          <div style={{ textAlign: "right" }}>
            <div>{data.email}</div>
            <div>{data.phone}</div>
            <div>{data.location}</div>
          </div>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{data.title}</div>
        <section>
          <h2 style={{ fontSize: 14 }}>Profile</h2>
          <p style={{ marginTop: 0 }}>{data.summary}</p>
        </section>
        <section>
          <h2 style={{ fontSize: 14 }}>Experience</h2>
          {data.experiences.map((ex) => (
            <div key={ex.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{ex.role} — {ex.company}</div>
              <div style={{ fontSize: 12 }}>{ex.start} – {ex.end}</div>
              <ul>
                {ex.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
        <section>
          <h2 style={{ fontSize: 14 }}>Education</h2>
          {data.education.map((ed) => (
            <div key={ed.id}>{ed.school} — {ed.degree} ({ed.year})</div>
          ))}
        </section>
        <section>
          <h2 style={{ fontSize: 14 }}>Skills</h2>
          <div>{data.skills.join(', ')}</div>
        </section>
      </div>
    );
  };

  // quick stats to display keywords the job description contains
  const suggestedKeywords = jobDescription ? extractKeywords(jobDescription, 20) : [];

  return (
    <div style={{ display: "flex", gap: 20, padding: 16, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto" }}>
      {/* Left: Form */}
      <div style={{ width: "42%", maxHeight: "90vh", overflow: "auto", paddingRight: 12 }}>
        <h2>AI Resume Builder (Prototype)</h2>
        <p style={{ marginTop: 4, marginBottom: 12 }}>Fill the form, choose a template, then click <strong>AI Generate</strong> to get improved text. This prototype uses a local generator by default — connect a server endpoint to enable real AI.</p>

        <label style={{ display: "block", marginBottom: 8 }}>
          Full name
          <input value={resume.fullName} onChange={(e) => updateField('fullName', e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Job title
          <input value={resume.title} onChange={(e) => updateField('title', e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ flex: 1 }}>
            Email
            <input value={resume.email} onChange={(e) => updateField('email', e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label style={{ flex: 1 }}>
            Phone
            <input value={resume.phone} onChange={(e) => updateField('phone', e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </label>
        </div>

        <label style={{ display: "block", marginTop: 8 }}>
          Location
          <input value={resume.location} onChange={(e) => updateField('location', e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <label style={{ display: "block", marginTop: 8 }}>
          Summary
          <textarea value={resume.summary} onChange={(e) => updateField('summary', e.target.value)} rows={4} style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <div style={{ marginTop: 8 }}>
          <h4>Experience</h4>
          {resume.experiences.map((ex, idx) => (
            <div key={ex.id} style={{ border: "1px solid #eee", padding: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Role #{idx + 1}</strong>
                <div>
                  <button onClick={() => removeExperience(ex.id)} aria-label="Remove" style={{ marginLeft: 8 }}>Remove</button>
                </div>
              </div>
              <input placeholder="Role" value={ex.role} onChange={(e) => updateExperience(ex.id, { role: e.target.value })} style={{ width: "100%", padding: 6, marginTop: 6 }} />
              <input placeholder="Company" value={ex.company} onChange={(e) => updateExperience(ex.id, { company: e.target.value })} style={{ width: "100%", padding: 6, marginTop: 6 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input placeholder="Start (e.g. Jan 2020)" value={ex.start} onChange={(e) => updateExperience(ex.id, { start: e.target.value })} style={{ flex: 1, padding: 6 }} />
                <input placeholder="End (e.g. Present)" value={ex.end} onChange={(e) => updateExperience(ex.id, { end: e.target.value })} style={{ flex: 1, padding: 6 }} />
              </div>
              <div style={{ marginTop: 6 }}>
                {ex.bullets.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <input value={b} onChange={(e) => updateExperienceBullet(ex.id, i, e.target.value)} style={{ flex: 1, padding: 6 }} />
                    <button onClick={() => addExperienceBullet(ex.id)}>+</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addExperience}>Add Experience</button>
        </div>

        <div style={{ marginTop: 8 }}>
          <h4>Education</h4>
          {resume.education.map((ed) => (
            <div key={ed.id} style={{ border: "1px solid #eee", padding: 8, marginBottom: 8 }}>
              <input placeholder="School" value={ed.school} onChange={(e) => updateEducation(ed.id, { school: e.target.value })} style={{ width: "100%", padding: 6, marginTop: 6 }} />
              <input placeholder="Degree" value={ed.degree} onChange={(e) => updateEducation(ed.id, { degree: e.target.value })} style={{ width: "100%", padding: 6, marginTop: 6 }} />
              <input placeholder="Year" value={ed.year} onChange={(e) => updateEducation(ed.id, { year: e.target.value })} style={{ width: "100%", padding: 6, marginTop: 6 }} />
            </div>
          ))}
          <button onClick={addEducation}>Add Education</button>
        </div>

        <div style={{ marginTop: 8 }}>
          <h4>Skills</h4>
          {resume.skills.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input value={s} onChange={(e) => updateSkill(i, e.target.value)} style={{ flex: 1, padding: 6 }} />
              <button onClick={() => removeSkill(i)}>Remove</button>
            </div>
          ))}
          <button onClick={() => addSkill("")}>Add Skill</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>Job description (paste here to match keywords)</h4>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} style={{ width: "100%", padding: 8 }} />
          <div style={{ marginTop: 8 }}>
            Suggested keywords: {suggestedKeywords.slice(0, 10).join(', ') || <em>Paste a JD to get suggestions</em>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={generateWithAI} disabled={aiBusy}>{aiBusy ? 'Generating…' : 'AI Generate'}</button>
          <button onClick={generateLocal}>Quick Improve (local)</button>
          <button onClick={() => { analyzeATS(); }}>Analyze ATS</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Template</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={() => setSelectedTemplate('minimal')} aria-pressed={selectedTemplate === 'minimal'}>Minimal</button>
            <button onClick={() => setSelectedTemplate('modern')} aria-pressed={selectedTemplate === 'modern'}>Modern</button>
            <button onClick={() => setSelectedTemplate('executive')} aria-pressed={selectedTemplate === 'executive'}>Executive</button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={downloadPDF}>Download PDF (Print)</button>
          <button onClick={copyHtmlToClipboard}>Copy HTML</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>ATS Score:</strong> {atsScore ?? '—'}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          <p><strong>Notes:</strong> This prototype intentionally uses simple, ATS-friendly markup (no images, no complex columns). For a production app you can add server-side PDF generation, cloud AI calls, persistent user accounts, and an admin panel to upload additional templates.</p>
        </div>
      </div>

      {/* Right: Preview */}
      <div style={{ width: "58%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Preview — {selectedTemplate}</h3>
          <div>
            <button onClick={() => { window.alert('Share link created: feature to add in production'); }}>Share</button>
          </div>
        </div>

        {/* print-friendly container */}
        <div
          ref={previewRef}
          id="resume-preview"
          style={{ background: '#000000', padding: 20, border: '1px solid #ddd', minHeight: 400 }}
        >
          <TemplateRenderer data={resume} variant={selectedTemplate} />
        </div>

        {/* print CSS — when the user prints, only the preview should be visible */}
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              #resume-preview, #resume-preview * { visibility: visible; }
              #resume-preview { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}
        </style>
      </div>
    </div>
  );
}
