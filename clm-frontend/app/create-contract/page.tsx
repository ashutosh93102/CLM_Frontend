'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { ApiClient, FileTemplateItem } from '../lib/api-client';
import DashboardLayout from '../components/DashboardLayout';

// Types
type Template = FileTemplateItem;

const CreateContractInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [contractTitle, setContractTitle] = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateFields, setTemplateFields] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [templateContentLoading, setTemplateContentLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filename = searchParams.get('template');
    if (filename) setSelectedTemplate(filename);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateContent('');
      setTemplateFields([]);
      setFieldValues({});
      return;
    }

    const load = async () => {
      try {
        setTemplateContentLoading(true);
        const client = new ApiClient();
        const res = await client.getTemplateFileContent(selectedTemplate);
        if (!res.success) {
          setTemplateContent('');
          setTemplateFields([]);
          setFieldValues({});
          return;
        }

        const content = (res.data as any)?.content || '';
        setTemplateContent(content);

        const rx = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
        const keys = new Set<string>();
        let m: RegExpExecArray | null;
        while ((m = rx.exec(content)) !== null) {
          const key = (m[1] || '').trim();
          if (key) keys.add(key);
        }

        const fields = Array.from(keys).sort();
        setTemplateFields(fields);
        setFieldValues((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const f of fields) {
            if (next[f] === undefined) next[f] = '';
          }
          // Remove stale keys
          Object.keys(next).forEach((k) => {
            if (!keys.has(k)) delete next[k];
          });
          return next;
        });
      } finally {
        setTemplateContentLoading(false);
      }
    };

    load();
  }, [selectedTemplate]);

  const labelFromKey = (k: string) =>
    k
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const inputTypeForKey = (k: string) => {
    const s = k.toLowerCase();
    if (s.includes('date')) return 'date';
    if (s.includes('email')) return 'email';
    if (s.includes('amount') || s.includes('price') || s.includes('value') || s.includes('fee')) return 'number';
    return 'text';
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const client = new ApiClient();
      const templatesResponse = await client.listTemplateFiles();

      if (!templatesResponse.success) {
        setError(templatesResponse.error || 'Failed to load templates');
        setTemplates([]);
      } else {
        const templateList = (templatesResponse.data as any)?.results || [];
        setTemplates(templateList);

        const templateFromQuery = searchParams.get('template');
        if (!templateFromQuery && templateList.length > 0) {
          setSelectedTemplate(templateList[0].filename);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractTitle.trim()) {
      setError('Contract title is required');
      return;
    }

    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new ApiClient();
      const response = await client.generateContractFromFile({
        filename: selectedTemplate,
        title: contractTitle,
        selectedClauses: [],
        structuredInputs: fieldValues,
      });

      if (!response.success) {
        setError(response.error || 'Failed to create contract');
        return;
      }

      const contractId = (response.data as any)?.contract?.id;
      if (contractId) {
        router.push(`/contracts/${contractId}`);
      } else {
        router.push('/contracts');
      }
    } catch (err) {
      console.error('Failed to create contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateObj = templates.find((t) => t.filename === selectedTemplate) || null;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F2F0EB] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#2D3748]">Create New Contract</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
          </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
            <p className="font-medium">{error}</p>
          </div>
        )}

          <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contract Title */}
          <div className="bg-white p-6 rounded-[20px] shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Title *
            </label>
            <input
              type="text"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter contract title"
              required
            />
          </div>

          {/* Template Selection */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm">
              <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Select Template</h3>
              {templatesLoading ? (
                <p className="text-gray-500 text-center py-8">Loading templates…</p>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.filename}
                  onClick={() => setSelectedTemplate(template.filename)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.filename
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-[#2D3748]">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{template.filename}</p>
                </div>
              ))}
            </div>
              )}
            {templates.length === 0 && (
              <p className="text-gray-500 text-center py-8">No templates available</p>
            )}
            </div>

          {/* Template Fields */}
          <div className="bg-white p-6 rounded-[20px] shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#2D3748]">Fill Template Values</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Fields are detected from <span className="font-mono font-semibold">{'{{placeholders}}'}</span> inside the selected template.
                </p>
              </div>
              {!selectedTemplate && (
                <div className="text-sm text-gray-500">Select a template first</div>
              )}
            </div>

            {templateContentLoading ? (
              <div className="text-gray-500 text-center py-8">Loading template…</div>
            ) : !selectedTemplate ? (
              <div className="text-gray-500 text-center py-8">No template selected</div>
            ) : templateFields.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No placeholders found. You can still create the contract.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {templateFields.map((k) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{labelFromKey(k)}</label>
                    <input
                      type={inputTypeForKey(k)}
                      value={fieldValues[k] || ''}
                      onChange={(e) => setFieldValues((p) => ({ ...p, [k]: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Enter ${labelFromKey(k)}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !selectedTemplateObj || !user}
                className="bg-[#0F141F] text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Creating Contract...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Contract
                </>
              )}
              </button>
            </div>

            {!user && (
              <div className="text-sm text-gray-500 text-right">
                Please log in to create contracts.
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

const CreateContractPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F2F0EB] p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[20px] shadow-sm p-6 text-gray-600">
              Loading...
            </div>
          </div>
        </div>
      }
    >
      <CreateContractInner />
    </Suspense>
  );
};

export default CreateContractPage;