import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Briefcase, GraduationCap, Code, Download, Plus, Trash2, Eye, Layout } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  desc: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
}

export default function ResumeBuilder({ initialTheme = 'modern' }: { initialTheme?: string }) {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState('midnight-executive'); // modern, classic, photo-sidebar, colored-header, etc.
  const [personal, setPersonal] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 890',
    location: 'New York, USA',
    summary: 'Experienced software engineer with a passion for building scalable web applications.',
    photo: null as string | null
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonal({ ...personal, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', company: 'Tech Corp', role: 'Senior Developer', duration: '2020 - Present', desc: 'Leading the frontend team to build modern interfaces.' }
  ]);
  
  const [education, setEducation] = useState<Education[]>([
    { id: '1', school: 'State University', degree: 'B.S. in Computer Science', year: '2016 - 2020' }
  ]);
  
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Tailwind CSS', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');

  const resumeRef = useRef<HTMLDivElement>(null);

  const addExperience = () => {
    setExperiences([...experiences, { id: Date.now().toString(), company: '', role: '', duration: '', desc: '' }]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    setEducation([...education, { id: Date.now().toString(), school: '', degree: '', year: '' }]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    const canvas = await html2canvas(resumeRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${personal.name.replace(/ /g, '_')}_Resume.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-0 overflow-hidden bg-[#F8FAFC] dark:bg-[#0F172A] rounded-[40px] border border-border">
      {/* 40% Form Area */}
      <div className="w-full lg:w-[40%] bg-white dark:bg-[#111827] border-r border-border p-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-8 pb-32">
          <div>
            <h2 className="font-syne text-2xl font-bold text-text mb-2 tracking-tight">Create Professional Resume</h2>
            <p className="text-muted text-sm">Fill in your details and watch the live preview.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                onClick={() => setStep(s)}
                className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${step === s ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-white/5 border border-border text-muted hover:bg-gray-200 dark:hover:bg-white/10'}`}
              >
                {s === 1 ? 'Info' : s === 2 ? 'Experience' : s === 3 ? 'Education' : s === 4 ? 'Skills' : 'Layout'}
              </button>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group w-24 h-24">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" title="Upload Photo" />
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-white/5 group-hover:border-[#2563EB] transition-colors">
                    {personal.photo ? <img src={personal.photo} className="w-full h-full object-cover" alt="Profile" /> : <Plus className="w-6 h-6 text-muted" />}
                  </div>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Profile Photo</p>
                   <p className="text-[10px] text-muted">A professional photo increases your chances.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Full Name</label>
                  <input value={personal.name} onChange={e => setPersonal({...personal, name: e.target.value})} className="w-full bg-white/5 border border-border px-6 py-4 rounded-2xl text-text outline-none focus:border-[#2563EB] transition-all font-medium" placeholder="E.g. Sachin Gautam" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email</label>
                    <input value={personal.email} onChange={e => setPersonal({...personal, email: e.target.value})} className="w-full bg-white/5 border border-border px-6 py-4 rounded-2xl text-text outline-none focus:border-[#2563EB] transition-all font-medium text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Phone</label>
                    <input value={personal.phone} onChange={e => setPersonal({...personal, phone: e.target.value})} className="w-full bg-white/5 border border-border px-6 py-4 rounded-2xl text-text outline-none focus:border-[#2563EB] transition-all font-medium text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Location</label>
                  <input value={personal.location} onChange={e => setPersonal({...personal, location: e.target.value})} className="w-full bg-white/5 border border-border px-6 py-4 rounded-2xl text-text outline-none focus:border-[#2563EB] transition-all font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Summary</label>
                  <textarea value={personal.summary} onChange={e => setPersonal({...personal, summary: e.target.value})} rows={4} className="w-full bg-white/5 border border-border px-6 py-4 rounded-2xl text-text outline-none focus:border-[#2563EB] transition-all font-medium text-sm resize-none" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">Experience</h3>
                <button onClick={addExperience} className="p-2 bg-[#2563EB] text-white rounded-xl"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {experiences.map((exp, i) => (
                  <div key={exp.id} className="p-6 bg-white/5 border border-border rounded-3xl relative space-y-4 hover:border-[#2563EB]/40 transition-all">
                    <button onClick={() => removeExperience(exp.id)} className="absolute top-6 right-6 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid grid-cols-1 gap-4">
                      <input placeholder="Company" value={exp.company} onChange={e => {
                        const newExp = [...experiences];
                        newExp[i].company = e.target.value;
                        setExperiences(newExp);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB] font-bold" />
                      <input placeholder="Role" value={exp.role} onChange={e => {
                        const newExp = [...experiences];
                        newExp[i].role = e.target.value;
                        setExperiences(newExp);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB]" />
                      <input placeholder="Duration" value={exp.duration} onChange={e => {
                        const newExp = [...experiences];
                        newExp[i].duration = e.target.value;
                        setExperiences(newExp);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB] text-xs text-muted" />
                      <textarea placeholder="Description" value={exp.desc} onChange={e => {
                        const newExp = [...experiences];
                        newExp[i].desc = e.target.value;
                        setExperiences(newExp);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB] text-sm h-20 resize-none" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">Education</h3>
                <button onClick={addEducation} className="p-2 bg-[#2563EB] text-white rounded-xl"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {education.map((edu, i) => (
                  <div key={edu.id} className="p-6 bg-white/5 border border-border rounded-3xl relative space-y-4">
                    <button onClick={() => removeEducation(edu.id)} className="absolute top-6 right-6 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid grid-cols-1 gap-4">
                      <input placeholder="School" value={edu.school} onChange={e => {
                        const newEdu = [...education];
                        newEdu[i].school = e.target.value;
                        setEducation(newEdu);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB] font-bold" />
                      <input placeholder="Degree" value={edu.degree} onChange={e => {
                        const newEdu = [...education];
                        newEdu[i].degree = e.target.value;
                        setEducation(newEdu);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB]" />
                      <input placeholder="Year" value={edu.year} onChange={e => {
                        const newEdu = [...education];
                        newEdu[i].year = e.target.value;
                        setEducation(newEdu);
                      }} className="bg-transparent border-b border-border py-2 outline-none focus:border-[#2563EB] text-xs text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex gap-2">
                <input 
                  value={newSkill} 
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="Add Skill"
                  className="flex-1 bg-white/5 border border-border px-6 py-4 rounded-2xl outline-none focus:border-[#2563EB]" 
                />
                <button onClick={addSkill} className="px-6 bg-[#2563EB] text-white font-bold rounded-2xl">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-border rounded-xl text-xs font-bold transition-all group">
                    {s}
                    <button onClick={() => removeSkill(i)} className="text-red-400 group-hover:block hidden"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-10">
                {[
                  { id: 'timeline-blue', name: 'Timeline Blue', desc: 'Modern & Pro' },
                  { id: 'classic-clean', name: 'Classic Clean', desc: 'Minimalist' },
                  { id: 'midnight-executive', name: 'Midnight Executive', desc: 'Professional' },
                  { id: 'indigo-bold', name: 'Indigo Bold', desc: 'Creative' },
                  { id: 'luxe-minimalist', name: 'Luxe Minimalist', desc: 'Minimal' },
                  { id: 'emerald-grid', name: 'Emerald Grid', desc: 'Designer' },
                  { id: 'crimson-modern', name: 'Crimson Modern', desc: 'Corporate' },
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-6 rounded-3xl border text-left transition-all ${theme === t.id ? 'bg-[#2563EB]/10 border-[#2563EB]' : 'bg-white/5 border-border hover:bg-white/10'}`}
                  >
                    <div className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{t.name}</div>
                    <div className="text-[10px] text-muted">{t.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 60% Live Preview Area */}
      <div className="hidden lg:flex w-[60%] flex-col bg-[#F8FAFC] dark:bg-[#0F172A] p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[800px] mx-auto w-full space-y-8">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold border border-green-500/20 uppercase tracking-widest animate-pulse">
                 Live Preview Active
              </div>
              <button 
                onClick={downloadPDF} 
                className="px-8 py-3 bg-[#2563EB] text-white font-syne font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Resume
              </button>
           </div>

           {/* A4 Resume Page Preview */}
           <div 
             ref={resumeRef} 
             className="bg-white text-[#1E293B] shadow-2xl w-full aspect-[210/297] rounded-none sm:p-16 p-8 font-sans overflow-hidden print:p-0"
             style={{ minHeight: '1123px' }}
           >
              {theme === 'timeline-blue' && (
                <TimelineBlueTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
              {theme === 'classic-clean' && (
                <ClassicCleanTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
              {theme === 'midnight-executive' && (
                <MidnightExecutiveTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
              {theme === 'indigo-bold' && (
                <IndigoBoldTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
              {theme === 'luxe-minimalist' && (
                <LuxeMinimalistTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
              {theme === 'emerald-grid' && (
                <EmeraldGridTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
              {theme === 'crimson-modern' && (
                <CrimsonModernTheme personal={personal} experiences={experiences} education={education} skills={skills} />
              )}
           </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
         <button onClick={() => setStep(step === 6 ? 1 : 6)} className="w-14 h-14 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-2xl">
            {step === 6 ? <X className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
         </button>
      </div>
    </div>
  );
}

function TimelineBlueTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full">
      {/* Profile Header */}
      <div className="flex justify-between items-start mb-12">
          <div className="space-y-4">
            <div>
              <h1 className="text-5xl font-syne font-black text-[#1E293B] uppercase tracking-tighter leading-tight">{personal.name || 'YOUR NAME'}</h1>
              <p className="text-[#2563EB] font-bold text-lg uppercase tracking-widest mt-1">Professional Candidate</p>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
                <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{personal.email || 'email@example.com'}</div>
                <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{personal.phone || 'Phone'}</div>
                <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{personal.location || 'Location'}</div>
            </div>
          </div>
          {personal.photo && (
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-xl shrink-0">
                <img src={personal.photo} className="w-full h-full object-cover" alt="" />
            </div>
          )}
      </div>
      <div className="space-y-12">
          {personal.summary && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Profile Summary</h2>
              <div className="w-12 h-1 bg-[#2563EB] mb-4" />
              <p className="text-sm leading-relaxed text-slate-600 mb-8 whitespace-pre-wrap">{personal.summary}</p>
            </div>
          )}
          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Experience</h2>
            <div className="space-y-8">
                {experiences.map((exp: any) => (
                  <div key={exp.id} className="flex gap-10">
                    <div className="w-24 text-right shrink-0 pt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{exp.duration}</div>
                    <div className="relative border-l-2 border-slate-100 pl-10 pb-2">
                        <div className="absolute w-3 h-3 bg-[#2563EB] rounded-full -left-[7.5px] top-1.5 ring-4 ring-white" />
                        <h3 className="font-bold text-[#1E293B] text-lg leading-tight">{exp.company || 'Compay Name'}</h3>
                        <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest mt-1 mb-3">{exp.role || 'Job Role'}</p>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[480px]">{exp.desc}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Education</h2>
            <div className="space-y-4">
                {education.map((edu: any) => (
                  <div key={edu.id} className="flex gap-10">
                    <div className="w-24 text-right shrink-0 pt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{edu.year}</div>
                    <div className="relative border-l-2 border-slate-100 pl-10">
                        <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[5px] top-2 ring-4 ring-white" />
                        <h3 className="font-bold text-[#1E293B] text-base">{edu.school || 'University Name'}</h3>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">{edu.degree}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Technical Skills</h2>
            <div className="flex flex-wrap gap-2">
                {skills.map((s: any, i: number) => (
                  <span key={i} className="px-4 py-2 bg-[#2563EB]/5 text-[#2563EB] text-[9px] font-black uppercase tracking-widest rounded-full border border-[#2563EB]/10">
                    {s}
                  </span>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
}

function ClassicCleanTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full font-serif border-8 border-slate-100 p-12">
      <div className="text-center mb-10 border-b border-slate-200 pb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{personal.name || 'YOUR NAME'}</h1>
        <div className="flex justify-center gap-6 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
          <span>{personal.email}</span>
          <span>•</span>
          <span>{personal.phone}</span>
          <span>•</span>
          <span>{personal.location}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 max-w-[600px] mx-auto">
        {personal.summary && (
          <section>
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 mb-4 pb-1">Professional Profile</h2>
            <p className="text-sm text-slate-600 leading-relaxed italic">{personal.summary}</p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 mb-6 pb-1">Experience</h2>
          <div className="space-y-8">
            {experiences.map((exp: any) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-900">{exp.company}</h3>
                  <span className="text-[10px] text-slate-400 italic">{exp.duration}</span>
                </div>
                <div className="text-xs font-bold text-slate-500 mb-2">{exp.role}</div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{exp.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 mb-4 pb-1">Education</h2>
          <div className="space-y-4">
            {education.map((edu: any) => (
              <div key={edu.id} className="flex justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{edu.school}</div>
                  <div className="text-[10px] text-slate-500">{edu.degree}</div>
                </div>
                <div className="text-[10px] text-slate-400">{edu.year}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 mb-4 pb-1">Expertise</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 font-sans">
            {skills.map((s: any, i: number) => <span key={i}>• {s}</span>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function MidnightExecutiveTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full flex overflow-hidden -m-16">
      {/* Sidebar */}
      <div className="w-[35%] bg-[#0F172A] text-white p-12 flex flex-col items-center">
        {personal.photo ? (
          <img src={personal.photo} className="w-32 h-32 rounded-full object-cover border-4 border-white/10 mb-8" alt="" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8">
            <User className="w-12 h-12 text-white/40" />
          </div>
        )}
        
        <div className="w-full space-y-10">
          <section>
            <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Contact Detail</h2>
            <div className="space-y-3 text-[11px] text-slate-300">
              <div className="flex gap-3 leading-tight"><span className="opacity-50">E:</span> {personal.email}</div>
              <div className="flex gap-3 leading-tight"><span className="opacity-50">T:</span> {personal.phone}</div>
              <div className="flex gap-3 leading-tight"><span className="opacity-50">L:</span> {personal.location}</div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Core Skills</h2>
            <div className="space-y-2">
              {skills.slice(0, 8).map((s: any, i: number) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  {s}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Education</h2>
            <div className="space-y-4">
              {education.map((edu: any) => (
                <div key={edu.id}>
                  <div className="text-xs font-bold leading-tight">{edu.degree}</div>
                  <div className="text-[10px] text-slate-400">{edu.school}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white p-16">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight mb-2 uppercase">{personal.name}</h1>
          <div className="w-16 h-1 bg-blue-600 mb-6" />
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{personal.summary}</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-lg font-serif font-bold text-slate-900 border-b border-slate-200 mb-6 pb-2">Professional Experience</h2>
            <div className="space-y-8">
              {experiences.map((exp: any) => (
                <div key={exp.id}>
                  <div className="flex justify-between mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{exp.role}</h3>
                    <span className="text-[10px] font-bold text-blue-600">{exp.duration}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mb-3">{exp.company}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{exp.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function IndigoBoldTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full bg-white shadow-none">
      <div className="bg-indigo-700 text-white p-16 mb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">{personal.name}</h1>
            <p className="text-indigo-200 font-bold uppercase tracking-[0.3em] text-sm">Professional Profile</p>
          </div>
          <div className="text-right text-xs font-bold text-indigo-100 space-y-1">
            <div>{personal.email}</div>
            <div>{personal.location}</div>
          </div>
        </div>
      </div>

      <div className="px-16 grid grid-cols-12 gap-16">
        <div className="col-span-8 space-y-16">
          <section>
             <h2 className="text-4xl font-black text-indigo-700 mb-8 italic uppercase tracking-tighter">Experience</h2>
             <div className="space-y-12">
                {experiences.map((exp: any) => (
                  <div key={exp.id} className="relative pl-8 border-l-4 border-indigo-50">
                    <div className="text-2xl font-black text-slate-900 mb-1">{exp.role}</div>
                    <div className="flex gap-4 text-xs font-bold text-indigo-600 uppercase mb-4">
                      <span>{exp.company}</span>
                      <span className="opacity-30">/</span>
                      <span>{exp.duration}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{exp.desc}</p>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="col-span-4 space-y-16">
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#2563EB] mb-6">Skills</h2>
            <div className="flex flex-col gap-3">
              {skills.map((s: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 border-2 border-indigo-50 rounded-xl text-xs font-bold text-slate-700">{s}</div>
              ))}
            </div>
          </section>

          <section>
             <h2 className="text-xs font-black uppercase tracking-widest text-[#2563EB] mb-6">Education</h2>
             <div className="space-y-6">
                {education.map((edu: any) => (
                  <div key={edu.id}>
                    <div className="font-bold text-sm text-slate-900 leading-tight">{edu.school}</div>
                    <div className="text-xs text-indigo-600 mt-1">{edu.degree}</div>
                  </div>
                ))}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function LuxeMinimalistTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full flex flex-col p-20 font-serif">
      <header className="text-center mb-20">
        <h1 className="text-3xl font-light tracking-[0.5em] text-slate-900 uppercase mb-6">{personal.name}</h1>
        <div className="flex justify-center gap-8 text-[9px] font-medium text-slate-400 uppercase tracking-[0.3em]">
          <span>{personal.email}</span>
          <span>{personal.phone}</span>
          <span>{personal.location}</span>
        </div>
      </header>

      <div className="space-y-20 max-w-[500px] mx-auto">
        <section className="text-center">
          <p className="text-sm leading-loose text-slate-500 italic px-10">"{personal.summary}"</p>
        </section>

        <section>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-10 text-center relative">
            Professional History
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-px bg-slate-200" />
          </h2>
          <div className="space-y-12">
            {experiences.map((exp: any) => (
              <div key={exp.id} className="text-center">
                <div className="text-xs font-bold text-slate-800 tracking-wider mb-1 uppercase">{exp.role}</div>
                <div className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest">{exp.company} • {exp.duration}</div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed px-4">{exp.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="grid grid-cols-2 gap-10">
            <div>
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-6">Expertise</h3>
              <div className="space-y-2">
                {skills.slice(0, 6).map((s: any, i: number) => <div key={i} className="text-xs text-slate-400 font-sans">{s}</div>)}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-6">Education</h3>
              <div className="space-y-4">
                {education.map((edu: any) => (
                  <div key={edu.id} className="text-[10px] leading-tight text-slate-400 uppercase tracking-wide">
                    <div className="font-bold text-slate-800 mb-1">{edu.degree}</div>
                    {edu.school}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function EmeraldGridTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full bg-slate-50 p-12 overflow-hidden flex flex-col">
      <div className="grid grid-cols-12 gap-8 mb-12 bg-white p-10 rounded-3xl border border-emerald-100 shadow-sm shrink-0">
        <div className="col-span-8">
           <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{personal.name}</h1>
           <p className="text-emerald-600 font-bold text-sm tracking-widest mt-1 uppercase">Ready for new opportunities</p>
           <p className="text-xs text-slate-500 mt-6 leading-relaxed max-w-[400px]">{personal.summary}</p>
        </div>
        <div className="col-span-4 flex flex-col justify-end items-end text-xs font-bold text-slate-400 gap-2">
          <div>{personal.email}</div>
          <div>{personal.location}</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden min-h-0">
        <div className="bg-white rounded-3xl p-10 border border-slate-100 space-y-10 overflow-y-auto">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><Briefcase className="w-4 h-4" /></div>
              <h2 className="font-bold text-slate-900 uppercase tracking-wider">Experience</h2>
            </div>
            <div className="space-y-10">
              {experiences.map((exp: any) => (
                <div key={exp.id} className="relative pl-6">
                  <div className="absolute left-0 top-1 w-1.5 h-full bg-emerald-100 rounded-full" />
                  <div className="font-bold text-sm text-slate-900 mb-1">{exp.role}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mb-3">{exp.company} / {exp.duration}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{exp.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
           <div className="bg-white rounded-3xl p-10 border border-slate-100 h-[280px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><Code className="w-4 h-4" /></div>
                <h2 className="font-bold text-slate-900 uppercase tracking-wider">Skill Stack</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {skills.slice(0, 8).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {s}
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-[#111827] text-white rounded-3xl p-10 flex-1">
              <div className="flex items-center gap-3 mb-8">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold uppercase tracking-wider">Education</h2>
              </div>
              <div className="space-y-6">
                {education.map((edu: any) => (
                  <div key={edu.id}>
                    <div className="font-bold text-[11px] uppercase tracking-wide">{edu.degree}</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-1">{edu.school}</div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function CrimsonModernTheme({ personal, experiences, education, skills }: any) {
  return (
    <div className="h-full bg-white flex flex-col border-t-[20px] border-crimson-600" style={{ borderTopColor: '#DC2626' }}>
      <div className="p-16 flex justify-between items-center bg-slate-50 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{personal.name}</h1>
          <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mt-1 border-l-4 border-red-600 pl-4">Expert Professional</p>
        </div>
        <div className="flex flex-col gap-2 text-[10px] font-bold text-slate-400 tracking-widest text-right">
           <div>{personal.email}</div>
           <div>{personal.location}</div>
        </div>
      </div>

      <div className="flex-1 p-16 grid grid-cols-12 gap-16">
        <div className="col-span-4 space-y-12">
          <section>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 bg-slate-900 text-white px-4 py-2 inline-block">Introduction</h2>
            <p className="text-xs text-slate-500 leading-loose italic">{personal.summary}</p>
          </section>

          <section>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 bg-slate-900 text-white px-4 py-2 inline-block">Education</h2>
            <div className="space-y-6">
              {education.map((edu: any) => (
                <div key={edu.id}>
                  <div className="text-xs font-bold text-slate-900 mb-1">{edu.degree}</div>
                  <div className="text-[10px] text-red-600 font-bold">{edu.school}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
             <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 bg-slate-900 text-white px-4 py-2 inline-block">Capability</h2>
             <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
               {skills.map((s: any, i: number) => <span key={i}>{s} {i < skills.length - 1 ? '/' : ''}</span>)}
             </div>
          </section>
        </div>

        <div className="col-span-8 space-y-12 border-l border-slate-100 pl-16">
           <section>
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-8 border-b-2 border-slate-900 pb-2">Experience Highlights</h2>
              <div className="space-y-10">
                {experiences.map((exp: any) => (
                  <div key={exp.id}>
                    <div className="flex justify-between mb-2">
                       <h3 className="font-extrabold text-sm text-slate-900">{exp.role}</h3>
                       <span className="text-[10px] font-black text-red-600">{exp.duration}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 mb-4">{exp.company}</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{exp.desc}</p>
                  </div>
                ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
