import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Ultra-modern AI Resume Builder - single-file React component
export default function App(): JSX.Element {
  const [theme, setTheme] = useState<'light'|'dark'|'elegant'|'creative'|'corporate'>('elegant');
  const [name, setName] = useState('Your Name');
  const [title, setTitle] = useState('Senior Product Designer');
  const [contact, setContact] = useState('name@example.com • +00 000 000');
  const [summary, setSummary] = useState('Strategic product designer with a record of shipping delightful experiences.');
  const [experiences, setExperiences] = useState([{ role: 'Senior Designer', company: 'Acme Inc', date: '2020 — Present', bullets: ['Led product redesign', 'Improved metrics by 32%'] }]);
  const [education, setEducation] = useState([{ school: 'University X', degree: 'B.A. Design', year: '2017' }]);
  const [skills, setSkills] = useState(['Product Design','Figma','Research']);

  const previewRef = useRef<HTMLDivElement | null>(null);

  function addExperience() {
    setExperiences(s => [...s, { role: 'New Role', company: 'Company', date: 'Year — Year', bullets: ['Achievement'] }]);
  }

  function downloadStyledPDF() {
    if (!previewRef.current) return;
    const node = previewRef.current;
    const scale = 2;
    html2canvas(node, { scale, useCORS: true, allowTaint: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth - 40; // margin
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(`${name.replace(/\s+/g,'_')}_styled_resume.pdf`);
    }).catch(err => {
      console.error(err);
      alert('Styled PDF generation failed.');
    });
  }

  function downloadATSPDF() {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    let y = 40;
    const lineHeight = 14;
    pdf.setFont('Helvetica');
    pdf.setFontSize(18);
    pdf.text(name, left, y);
    y += lineHeight + 6;
    pdf.setFontSize(12);
    pdf.text(title, left, y);
    y += lineHeight + 2;
    pdf.text(contact, left, y);
    y += lineHeight + 8;
    pdf.setFontSize(12);
    pdf.text('Summary', left, y);
    y += lineHeight;
    const splitSummary = pdf.splitTextToSize(summary, 500);
    pdf.text(splitSummary, left, y);
    y += (splitSummary.length * lineHeight) + 6;

    pdf.text('Experience', left, y);
    y += lineHeight;
    experiences.forEach(exp => {
      pdf.setFontSize(11);
      pdf.text(`${exp.role} — ${exp.company}`, left, y);
      y += lineHeight;
      pdf.setFontSize(10);
      pdf.text(exp.date, left, y);
      y += lineHeight;
      exp.bullets.forEach(b => {
        const lines = pdf.splitTextToSize('• ' + b, 480);
        pdf.text(lines, left + 8, y);
        y += lines.length * lineHeight;
      });
      y += 6;
      if (y > 720) { pdf.addPage(); y = 40; }
    });

    pdf.text('Education', left, y);
    y += lineHeight;
    education.forEach(ed => {
      pdf.text(`${ed.school} — ${ed.degree} (${ed.year})`, left, y);
      y += lineHeight;
    });

    pdf.text('Skills', left, y + 6);
    pdf.text(skills.join(', '), left, y + 20);

    pdf.save(`${name.replace(/\s+/g,'_')}_ATS_resume.pdf`);
  }

  function updateExperienceField(index: number, field: 'role'|'company'|'date', value: string) {
    setExperiences(prev => prev.map((e,i) => i===index ? { ...e, [field]: value } : e));
  }

  function updateBullet(index: number, bIndex: number, text: string) {
    setExperiences(prev => prev.map((e,i) => {
      if (i!==index) return e;
      const bullets = e.bullets.slice(); bullets[bIndex] = text; return { ...e, bullets };
    }));
  }

  function addBullet(index: number) {
    setExperiences(prev => prev.map((e,i) => i===index ? { ...e, bullets: [...e.bullets, 'New bullet'] } : e));
  }

  // Theme styles
  const themeVars = {
    light: { bg: '#f6fbff', card: 'linear-gradient(180deg,#ffffff, #fbfdff)', accent: '#3b82f6', text: '#0f172a' },
    dark: { bg: '#0b1020', card: 'linear-gradient(180deg,#0f1724,#07101a)', accent: '#7c3aed', text: '#f8fafc' },
    elegant: { bg: 'linear-gradient(180deg,#f6f4ff,#f2fbff)', card: 'rgba(255,255,255,0.8)', accent: '#6b21a8', text: '#0b1220' },
    creative: { bg: 'linear-gradient(90deg,#fff0f6,#f0f9ff)', card: 'rgba(255,255,255,0.85)', accent: '#ef4444', text: '#071027' },
    corporate: { bg: 'linear-gradient(180deg,#eef2ff,#ffffff)', card: '#ffffff', accent: '#0ea5a3', text: '#04263b' }
  };

  const tv = themeVars[theme];

  return (
    <div style={{ minHeight: '100vh', padding: 28, background: tv.bg, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto", color: tv.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 36, letterSpacing: -0.6, background: `linear-gradient(90deg, ${tv.accent}, #06b6d4)`, WebkitBackgroundClip: 'text', color: 'transparent' }}>AI Resume Builder</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 22 }}>
          <div style={{ borderRadius: 18, padding: 18, background: tv.card, boxShadow: '0 8px 30px rgba(2,6,23,0.08)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {(['light','dark','elegant','creative','corporate'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{ flex: 1, padding: '8px 10px', borderRadius: 12, border: theme===t ? `2px solid ${themeVars[t].accent}` : '1px solid rgba(0,0,0,0.06)', background: theme===t ? themeVars[t].card : 'transparent', cursor: 'pointer' }}>{t[0].toUpperCase()+t.slice(1)}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder='Full name' style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(2,6,23,0.06)' }} />
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder='Job title' style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(2,6,23,0.06)' }} />
              <input value={contact} onChange={e=>setContact(e.target.value)} placeholder='Contact' style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(2,6,23,0.06)' }} />

              <textarea value={summary} onChange={e=>setSummary(e.target.value)} placeholder='Summary' rows={4} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(2,6,23,0.06)' }} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Experience</div>
                  <button onClick={addExperience} style={{ fontSize: 13, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(2,6,23,0.06)', background: 'transparent' }}>+ Add</button>
                </div>
                {experiences.map((ex, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                    <input value={ex.role} onChange={e=>updateExperienceField(i,'role',e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)', marginBottom: 6 }} />
                    <input value={ex.company} onChange={e=>updateExperienceField(i,'company',e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)', marginBottom: 6 }} />
                    <input value={ex.date} onChange={e=>updateExperienceField(i,'date',e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)', marginBottom: 6 }} />
                    <div style={{ display: 'grid', gap: 6 }}>
                      {ex.bullets.map((b,bi)=> (
                        <div key={bi} style={{ display: 'flex', gap: 6 }}>
                          <input value={b} onChange={e=>updateBullet(i,bi,e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)' }} />
                          <button onClick={()=>addBullet(i)} style={{ padding: '6px 8px', borderRadius: 8 }}>+</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Education</div>
                </div>
                {education.map((ed,i)=> (
                  <div key={i} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                    <input value={ed.school} onChange={e=> setEducation(prev => prev.map((p,pi)=> i===pi ? {...p, school: e.target.value} : p))} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)', marginBottom: 6 }} />
                    <input value={ed.degree} onChange={e=> setEducation(prev => prev.map((p,pi)=> i===pi ? {...p, degree: e.target.value} : p))} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)', marginBottom: 6 }} />
                    <input value={ed.year} onChange={e=> setEducation(prev => prev.map((p,pi)=> i===pi ? {...p, year: e.target.value} : p))} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(2,6,23,0.06)', marginBottom: 6 }} />
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Skills</div>
                  <button onClick={()=> setSkills(s=> [...s,'New'])} style={{ padding: '6px 10px', borderRadius: 10 }}>+ Add</button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {skills.map((s,i)=> (
                    <input key={i} value={s} onChange={e=> setSkills(prev => prev.map((p,pi)=> pi===i? e.target.value : p))} style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(2,6,23,0.06)' }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={downloadStyledPDF} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: `linear-gradient(90deg, ${tv.accent}, #06b6d4)`, color: '#fff', border: 'none' }}>Download Styled PDF</button>
                <button onClick={downloadATSPDF} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: 'transparent', border: '2px solid rgba(2,6,23,0.08)' }}>Download ATS PDF</button>
              </div>

            </div>
          </div>

          <div style={{ borderRadius: 18, padding: 20, background: tv.card, boxShadow: '0 10px 40px rgba(2,6,23,0.08)', backdropFilter: 'blur(6px)' }}>
            <div ref={previewRef} style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: 24, borderRadius: 12, background: theme==='dark' ? 'rgba(8,10,20,0.6)' : 'rgba(255,255,255,0.95)', color: tv.text }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>{title}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.9 }}>{contact}</div>
              </div>

              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Summary</div>
                  <div style={{ lineHeight: 1.45 }}>{summary}</div>

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Experience</div>
                    {experiences.map((ex,i)=> (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700 }}>{ex.role}</div>
                        <div style={{ fontSize: 12, opacity: 0.85 }}>{ex.company} • {ex.date}</div>
                        <ul style={{ marginTop: 6 }}>
                          {ex.bullets.map((b,bi)=> <li key={bi} style={{ marginBottom: 6 }}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>

                </div>

                <div style={{ borderLeft: '1px solid rgba(2,6,23,0.04)', paddingLeft: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Education</div>
                  {education.map((ed,i)=> (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700 }}>{ed.school}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>{ed.degree} • {ed.year}</div>
                    </div>
                  ))}

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Skills</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{skills.map((s,i)=> <div key={i} style={{ background: 'rgba(0,0,0,0.06)', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>{s}</div>)}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
