'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Download,
  FileText,
  Trash2,
  Minus,
  PlusCircle,
  Plus,
  Search,
  Shield,
} from 'lucide-react';
import { ApiClient, FileTemplateItem } from '@/app/lib/api-client';
import { useAuth } from '@/app/lib/auth-context';
import { downloadTextAsPdf } from '@/app/lib/downloads';

type Template = FileTemplateItem;

function statusPill(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'published' || s === 'active') return { label: 'ACTIVE', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (s === 'archived') return { label: 'ARCHIVED', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return { label: 'DRAFT', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
}

const TemplateLibrary: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Agreements' | 'NDA' | 'SOW' | 'All'>('All');
  const [zoom, setZoom] = useState(100);
  const [rawTemplateDoc, setRawTemplateDoc] = useState('');
  const [templateDocLoading, setTemplateDocLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('NDA');
  const [createDescription, setCreateDescription] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [myTemplatesCount, setMyTemplatesCount] = useState<number | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [templatesMenuOpen, setTemplatesMenuOpen] = useState(false);
  const [semanticMatches, setSemanticMatches] = useState<string[] | null>(null);
  const [showAllList, setShowAllList] = useState(false);
  const router = useRouter();

  const LIST_LIMIT = 18;

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Keep "My Templates" card accurate.
    if (!user) {
      setMyTemplatesCount(null);
      return;
    }
    fetchMyTemplatesCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    if (!selectedTemplate) return;
    setDownloadOpen(false);
    setTemplatesMenuOpen(false);
    const load = async () => {
      try {
        setTemplateDocLoading(true);
        const client = new ApiClient();
        const response = await client.getTemplateFileContent(selectedTemplate.filename);
        if (response.success && response.data) {
          const content = (response.data as any).content || '';
          setRawTemplateDoc(content);
          return;
        }
        setRawTemplateDoc('');
      } catch {
        setRawTemplateDoc('');
      } finally {
        setTemplateDocLoading(false);
      }
    };
    load();
  }, [selectedTemplate]);

  useEffect(() => {
    if (!downloadOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Close for any click outside the menu/button container.
      if (target.closest('[data-download-menu]')) return;
      setDownloadOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [downloadOpen]);

  useEffect(() => {
    if (!templatesMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-templates-menu]')) return;
      setTemplatesMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [templatesMenuOpen]);

  // Semantic search for templates (debounced)
  useEffect(() => {
    const q = search.trim();
    if (!q || q.length < 2) {
      setSemanticMatches(null);
      return;
    }
    if (!user) {
      setSemanticMatches(null);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        const client = new ApiClient();
        const res = await client.semanticSearchWithParams(q, { entity_type: 'template', limit: '50' });
        const results = (res.data as any)?.results || [];
        const filenames: string[] = [];
        for (const r of results) {
          const fn = (r?.metadata && (r.metadata.filename as string)) || '';
          if (fn) filenames.push(fn);
        }
        setSemanticMatches(filenames.length ? filenames : []);
      } catch {
        setSemanticMatches(null);
      }
    }, 250);

    return () => window.clearTimeout(t);
  }, [search, user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const client = new ApiClient();
      const response = await client.listTemplateFiles();

      if (!response.success) {
        setError(response.error || 'Failed to load templates');
        return;
      }

      const templateList = (response.data as any)?.results || [];

      setTemplates(templateList);
      if (templateList.length > 0) {
        setSelectedTemplate(templateList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTemplatesCount = async () => {
    try {
      const client = new ApiClient();
      const res = await client.listMyTemplateFiles();
      if (!res.success) {
        setMyTemplatesCount(0);
        return;
      }
      const count = (res.data as any)?.count;
      setMyTemplatesCount(typeof count === 'number' ? count : ((res.data as any)?.results || []).length);
    } catch {
      setMyTemplatesCount(0);
    }
  };

  const canDeleteTemplate = (t: Template | null) => {
    if (!user || !t) return false;
    const uid = String((user as any).user_id || '');
    const email = String((user as any).email || '').toLowerCase();
    const createdById = String((t as any).created_by_id || '');
    const createdByEmail = String((t as any).created_by_email || '').toLowerCase();
    return Boolean((uid && createdById && uid === createdById) || (email && createdByEmail && email === createdByEmail));
  };

  const deleteSelectedTemplate = async () => {
    if (!user || !selectedTemplate) return;
    if (!canDeleteTemplate(selectedTemplate)) {
      setError('You can only delete templates you created.');
      return;
    }
    const ok = window.confirm(`Delete "${selectedTemplate.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError(null);
      const client = new ApiClient();
      const res = await client.deleteTemplateFile(selectedTemplate.filename);
      if (!res.success) {
        setError(res.error || 'Failed to delete template');
        return;
      }
      setSelectedTemplate(null);
      setRawTemplateDoc('');
      await fetchTemplates();
      await fetchMyTemplatesCount();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template');
    }
  };

  const createTemplate = async () => {
    try {
      if (!user) {
        setError('Please log in to create templates.');
        return;
      }
      setCreateBusy(true);
      const client = new ApiClient();
      const displayName = createName.trim() || 'New Template';
      const content =
        createContent ||
        `${displayName.toUpperCase()}\n\n${(createDescription || '').trim()}\n\n[Paste your template text here]\n`;

      const base = `${createType}-${displayName}`
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9_.-]/g, '');
      const uniqueFilename = `${base || createType}-${Date.now()}`;

      const res = await client.createTemplateFile({
        name: displayName,
        filename: uniqueFilename,
        description: (createDescription || '').trim(),
        content,
      });
      if (!res.success) {
        setError(res.error || 'Failed to create template');
        return;
      }
      setCreateOpen(false);
      setCreateName('');
      setCreateType('NDA');
      setCreateDescription('');
      setCreateContent('');
      await fetchTemplates();
      await fetchMyTemplatesCount();
    } finally {
      setCreateBusy(false);
    }
  };

  const stats = useMemo(() => {
    const total = templates.length;
    const activeCount = templates.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s === 'published' || s === 'active';
    }).length;
    const draftCount = Math.max(total - activeCount, 0);

    const byName = new Map<string, number>();
    templates.forEach((t) => {
      byName.set(t.name, (byName.get(t.name) || 0) + 1);
    });
    const mostUsed = Array.from(byName.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      mostUsedName: mostUsed?.[0] || (templates[0]?.name || '—'),
      mostUsedCount: mostUsed?.[1] || 0,
      activeCount,
      draftCount,
    };
  }, [templates]);

  const categories = useMemo(() => {
    const nda = templates.filter((t) => (t.contract_type || '').toLowerCase().includes('nda')).length;
    const sow = templates.filter((t) => (t.contract_type || '').toLowerCase().includes('sow')).length;
    const agreements = templates.length - nda - sow;
    return {
      All: templates.length,
      Agreements: Math.max(agreements, 0),
      NDA: nda,
      SOW: sow,
    };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = templates
      .filter((t) => {
        const ct = (t.contract_type || '').toLowerCase();
        if (activeCategory === 'All') return true;
        if (activeCategory === 'NDA') return ct.includes('nda');
        if (activeCategory === 'SOW') return ct.includes('sow');
        return !ct.includes('nda') && !ct.includes('sow');
      })
      .filter((t) => {
        if (!showOnlyMine) return true;
        if (!user) return false;
        return (
          (t.created_by_id && t.created_by_id === user.user_id) ||
          (t.created_by_email && t.created_by_email === user.email)
        );
      });

    // Prefer semantic matches when available; fallback to local substring matching.
    if (s && semanticMatches && semanticMatches.length > 0) {
      const set = new Set(semanticMatches);
      const rank = new Map<string, number>();
      semanticMatches.forEach((fn, idx) => rank.set(fn, idx));
      return base
        .filter((t) => set.has(t.filename))
        .sort((a, b) => (rank.get(a.filename) ?? 9999) - (rank.get(b.filename) ?? 9999));
    }

    return base.filter((t) => {
      if (!s) return true;
      return (
        (t.name || '').toLowerCase().includes(s) ||
        (t.filename || '').toLowerCase().includes(s) ||
        (t.description || '').toLowerCase().includes(s)
      );
    });
  }, [templates, search, activeCategory, showOnlyMine, user, semanticMatches]);

  const listTemplates = useMemo(() => {
    if (showAllList) return filteredTemplates;
    return filteredTemplates.slice(0, LIST_LIMIT);
  }, [filteredTemplates, showAllList]);

  const downloadTemplateTxt = () => {
    if (!selectedTemplate || !rawTemplateDoc) return;

    const blob = new Blob([rawTemplateDoc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedTemplate.filename || 'template.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadTemplatePdf = async () => {
    if (!selectedTemplate || !rawTemplateDoc) return;
    await downloadTextAsPdf({
      filename: selectedTemplate.filename,
      title: selectedTemplate.name,
      text: rawTemplateDoc,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* ── UNIFIED HEADER CARD ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Template Library</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {templates.length} total &middot; {stats.activeCount} active &middot; {myTemplatesCount ?? 0} by you
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full sm:w-[260px] bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <button
                onClick={() => { if (!user) { setError('Please log in to create templates.'); return; } setCreateOpen(true); }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                New Template
              </button>
            </div>
          </div>

          {/* Inline stats strip */}
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { label: 'Total Templates', value: stats.total, bar: 'bg-blue-600' },
              { label: 'Active', value: stats.activeCount, bar: 'bg-blue-400' },
              { label: 'Draft', value: stats.draftCount, bar: 'bg-slate-300' },
              { label: 'My Templates', value: myTemplatesCount ?? 0, bar: 'bg-slate-700' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-1 h-10 rounded-full shrink-0 ${s.bar}`} />
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 leading-none">{String(s.value).padStart(2, '0')}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CATEGORY TABS + CONTROLS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {(['All', 'Agreements', 'NDA', 'SOW'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition ${
                activeCategory === c
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {c}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${
                activeCategory === c ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {(categories as any)[c] ?? 0}
              </span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowOnlyMine((v) => !v)}
              disabled={!user}
              className={`inline-flex items-center gap-2 text-sm font-semibold rounded-full px-3 py-2 border transition disabled:opacity-50 ${
                showOnlyMine ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              My Templates
            </button>

            <div className="relative" data-templates-menu>
              <button
                type="button"
                onClick={() => setTemplatesMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Quick Switch <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {templatesMenuOpen && (
                <div className="absolute right-0 top-11 z-30 w-[320px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-400">Quick switch</div>
                    <div className="text-sm font-bold text-slate-900">Templates</div>
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    {templates.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-slate-500">No templates available</div>
                    ) : (
                      templates.map((t) => {
                        const active = selectedTemplate?.id === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { setSelectedTemplate(t); setTemplatesMenuOpen(false); }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between gap-4 hover:bg-slate-50 ${
                              active ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">{t.name}</div>
                              <div className="text-xs text-slate-400 truncate">{t.filename}</div>
                            </div>
                            {active && <span className="text-xs font-semibold text-blue-600">Active</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN SPLIT LAYOUT ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* LEFT — Template List */}
          <div className="xl:col-span-4">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800">Templates</span>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{filteredTemplates.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { if (!user) { setError('Please log in to create templates.'); return; } setCreateOpen(true); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="p-3">
                {loading ? (
                  <div className="text-slate-400 text-sm py-12 text-center">Loading…</div>
                ) : error ? (
                  <div className="text-red-500 text-sm py-12 text-center">{error}</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-slate-400 text-sm py-12 text-center">No templates found</div>
                ) : (
                  <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-auto pr-0.5">
                    {listTemplates.map((t) => {
                      const pill = statusPill(t.status);
                      const active = selectedTemplate?.id === t.id;
                      const isNda = (t.contract_type || '').toLowerCase().includes('nda');
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t)}
                          className={`w-full text-left rounded-2xl px-4 py-3.5 transition flex items-center gap-3 ${
                            active ? 'bg-blue-600' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            active ? 'bg-white/20' : 'bg-slate-100'
                          }`}>
                            {isNda
                              ? <Shield className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                              : <FileText className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                            <p className={`text-xs truncate mt-0.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>
                              {t.description || t.contract_type || 'Template'}
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full border shrink-0 ${
                            active ? 'bg-white/20 text-white border-white/20' : pill.cls
                          }`}>
                            {pill.label}
                          </span>
                        </button>
                      );
                    })}

                    {filteredTemplates.length > LIST_LIMIT && (
                      <button
                        type="button"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 mt-1"
                        onClick={() => setShowAllList((v) => !v)}
                      >
                        {showAllList ? 'Show fewer' : `Show all ${filteredTemplates.length} templates`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Document Preview */}
          <div className="xl:col-span-8">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col" style={{ minHeight: '560px' }}>

              {/* Preview toolbar */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedTemplate ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{selectedTemplate.name}</p>
                        <p className="text-xs text-slate-400 truncate font-mono">{selectedTemplate.filename}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Select a template to preview</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Zoom */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button
                      className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-600 transition"
                      onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-600 w-10 text-center">{zoom}%</span>
                    <button
                      className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-600 transition"
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={deleteSelectedTemplate}
                    disabled={!selectedTemplate || !canDeleteTemplate(selectedTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                    title={canDeleteTemplate(selectedTemplate) ? 'Delete this template' : 'Only templates you created can be deleted'}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  {/* Download */}
                  <div className="relative" data-download-menu>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                      onClick={() => setDownloadOpen((v) => !v)}
                      disabled={!selectedTemplate || !rawTemplateDoc || templateDocLoading}
                      type="button"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {downloadOpen && (
                      <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-3"
                          onClick={async () => { setDownloadOpen(false); await downloadTemplatePdf(); }}
                        >
                          <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Download className="w-3.5 h-3.5 text-slate-700" />
                          </span>
                          Download as PDF
                        </button>
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-3"
                          onClick={() => { setDownloadOpen(false); downloadTemplateTxt(); }}
                        >
                          <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Download className="w-3.5 h-3.5 text-slate-700" />
                          </span>
                          Download as .txt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document area */}
              <div className="flex-1 bg-slate-50 p-6 overflow-auto">
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 mx-auto overflow-hidden"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', maxWidth: '760px' }}
                >
                  {/* Document accent stripe */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-700 to-blue-400" />

                  <div className="px-8 py-6">
                    {/* Doc header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Contract Document</p>
                          <p className="text-xs text-slate-400 font-mono">ID-{selectedTemplate?.id?.slice(0, 8) || '—'}</p>
                        </div>
                      </div>
                      {selectedTemplate && (
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${statusPill(selectedTemplate.status).cls}`}>
                          {statusPill(selectedTemplate.status).label}
                        </span>
                      )}
                    </div>

                    {/* Title block */}
                    <div className="mt-5 pb-5 border-b border-slate-100">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        {selectedTemplate?.name || 'SELECT A TEMPLATE'}
                      </h2>
                      {selectedTemplate?.description && (
                        <p className="text-sm text-slate-500 mt-1.5">{selectedTemplate.description}</p>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mt-5">
                      {templateDocLoading ? (
                        <div className="flex items-center gap-3 py-10">
                          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                          <span className="text-sm text-slate-400">Loading preview…</span>
                        </div>
                      ) : rawTemplateDoc ? (
                        <pre className="whitespace-pre-wrap text-[11px] leading-6 text-slate-700 font-serif max-h-[58vh] overflow-auto">
                          {rawTemplateDoc}
                        </pre>
                      ) : (
                        <div className="py-14 text-center">
                          <FileText className="w-10 h-10 text-slate-200 mx-auto" />
                          <p className="text-sm text-slate-400 mt-3">No preview available for this template type.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {createOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !createBusy && setCreateOpen(false)} />
          <div className="relative w-[92vw] max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">New Template</h3>
                <p className="text-xs text-slate-500">Add a template to your library</p>
              </div>
              <button
                className="ml-auto text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition"
                onClick={() => !createBusy && setCreateOpen(false)}
                aria-label="Close"
              >✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="e.g. Standard MSA"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</label>
                <div className="mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <select value={createType} onChange={(e) => setCreateType(e.target.value)} className="w-full bg-transparent outline-none text-sm text-slate-900">
                    <option value="NDA">NDA</option>
                    <option value="MSA">MSA</option>
                    <option value="EMPLOYMENT">Employment</option>
                    <option value="AGENCY_AGREEMENT">Agency Agreement</option>
                    <option value="PROPERTY_MANAGEMENT">Property Management</option>
                    <option value="SERVICE_AGREEMENT">Service Agreement</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="mt-1.5 w-full min-h-[80px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Short summary (optional)"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Template Text</label>
                <textarea
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  className="mt-1.5 w-full min-h-[160px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 font-mono"
                  placeholder="Paste the exact template text (.txt) you want to display"
                />
                <p className="text-xs text-slate-400 mt-1.5">Saved to your template library.</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setCreateOpen(false)}
                disabled={createBusy}
              >Cancel</button>
              <button
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={createTemplate}
                disabled={createBusy}
              >{createBusy ? 'Creating…' : 'Create Template'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TemplateLibrary;
