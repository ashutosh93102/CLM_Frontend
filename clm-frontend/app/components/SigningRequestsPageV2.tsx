'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSignature, Search } from 'lucide-react';

import DashboardLayout from './DashboardLayout';
import { ApiClient, InhouseSigningRequestListItem } from '../lib/api-client';

type StatusFilter = 'all' | 'draft' | 'sent' | 'in_progress' | 'completed' | 'declined' | 'failed';

function formatMaybeDate(value: any): string {
	if (!value) return '—';
	const d = new Date(String(value));
	if (Number.isNaN(d.getTime())) return String(value);
	return d.toLocaleString();
}

function statusBadgeClass(status: string): string {
	const raw = String(status || '').trim().toLowerCase();
	if (['completed', 'signed', 'executed', 'done', 'finished'].includes(raw)) {
		return 'bg-blue-600 text-white border-blue-600';
	}
	if (['declined', 'rejected', 'canceled', 'cancelled', 'refused', 'failed', 'error'].includes(raw)) {
		return 'bg-gray-900 text-white border-gray-900';
	}
	if (['sent', 'invited', 'pending', 'in_progress', 'in progress', 'viewed', 'draft'].includes(raw)) {
		return 'bg-blue-50 text-blue-700 border-blue-200';
	}
	return 'bg-gray-100 text-gray-700 border-gray-200';
}

function safeFilenameBase(title: string): string {
	const raw = String(title || 'contract').trim() || 'contract';
	return raw.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

async function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

const SigningRequestsPageV2: React.FC = () => {
	const router = useRouter();
	const [rows, setRows] = useState<InhouseSigningRequestListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
	const [search, setSearch] = useState('');
	const [downloadingFor, setDownloadingFor] = useState<string | null>(null);

	const lastRefreshAtRef = useRef<number>(0);

	const fetchRequests = async (params?: { q?: string; status?: StatusFilter }) => {
		try {
			setLoading(true);
			setError(null);
			lastRefreshAtRef.current = Date.now();

			const client = new ApiClient();
			const res = await client.inhouseListSigningRequests({
				q: params?.q,
				status: params?.status && params.status !== 'all' ? params.status : undefined,
				limit: 200,
				offset: 0,
			});

			if (!res.success) {
				setError(res.error || 'Failed to fetch signing requests');
				setRows([]);
				return;
			}

			const results = Array.isArray(res.data?.results) ? res.data!.results : [];
			setRows(results);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to fetch signing requests');
			setRows([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRequests();
		const onFocus = () => fetchRequests({ q: search.trim() || undefined, status: filterStatus });
		window.addEventListener('focus', onFocus);
		return () => window.removeEventListener('focus', onFocus);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const q = search.trim();
		const handle = window.setTimeout(() => {
			fetchRequests({ q: q || undefined, status: filterStatus });
		}, 250);
		return () => window.clearTimeout(handle);
	}, [search, filterStatus]);

	const stats = useMemo(() => {
		const by = (s: string) => rows.filter((r) => String(r.status || '').toLowerCase() === s).length;
		const sent = by('sent');
		const inProgress = by('in_progress') + by('in progress');
		const completed = by('completed');
		const declined = by('declined');
		const failed = by('failed');
		const draft = by('draft');
		const active = sent + inProgress;
		return {
			total: rows.length,
			draft,
			active,
			completed,
			declined: declined + failed,
		};
	}, [rows]);

	const openSigningStatus = (contractId: string) => {
		router.push(`/contracts/signing-status?id=${encodeURIComponent(contractId)}&provider=inhouse`);
	};

	const downloadExecuted = async (row: InhouseSigningRequestListItem) => {
		const contractId = String(row.contract_id || '').trim();
		if (!contractId) return;
		try {
			setDownloadingFor(contractId);
			setError(null);
			const client = new ApiClient();
			const res = await client.inhouseDownloadExecutedPdf(contractId);
			if (!res.success || !res.data) {
				setError(res.error || 'Failed to download executed PDF');
				return;
			}
			const base = safeFilenameBase(row.contract_title || 'contract');
			await downloadBlob(res.data, `${base}_signed.pdf`);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to download executed PDF');
		} finally {
			setDownloadingFor(null);
		}
	};

	const downloadCertificate = async (row: InhouseSigningRequestListItem) => {
		const contractId = String(row.contract_id || '').trim();
		if (!contractId) return;
		try {
			setDownloadingFor(contractId);
			setError(null);
			const client = new ApiClient();
			const res = await client.inhouseDownloadCertificate(contractId);
			if (!res.success || !res.data) {
				setError(res.error || 'Failed to download certificate');
				return;
			}
			const base = safeFilenameBase(row.contract_title || 'contract');
			await downloadBlob(res.data, `${base}_certificate.pdf`);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to download certificate');
		} finally {
			setDownloadingFor(null);
		}
	};

	const visibleRows = rows;

	return (
		<DashboardLayout>
			<div className="space-y-6">

				{/* ── HEADER ── */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Signing Requests</h1>
						<p className="mt-1 text-sm text-slate-500">
							In-house signing &middot; <span className="font-semibold text-slate-700">{visibleRows.length} request{visibleRows.length !== 1 ? 's' : ''}</span>
						</p>
					</div>
					<div className="flex items-center gap-3">
						<div className="relative">
							<Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by contract or signer…"
								className="w-full sm:w-[280px] bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
							/>
						</div>
						<button
							onClick={() => router.push('/contracts')}
							className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
						>
							<FileSignature className="w-4 h-4" />
							Go to Contracts
						</button>
					</div>
				</div>

				{/* ── STAT STRIP ── */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{[
						{ label: 'Total', value: stats.total, bar: 'bg-slate-300', sub: 'All requests' },
						{ label: 'Active', value: stats.active, bar: 'bg-blue-500', sub: 'Sent or in progress' },
						{ label: 'Completed', value: stats.completed, bar: 'bg-blue-700', sub: 'Fully signed' },
						{ label: 'Declined', value: stats.declined, bar: 'bg-slate-800', sub: 'Rejected or failed' },
					].map((s) => (
						<div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-sm transition">
							<div className={`w-1 h-12 rounded-full shrink-0 ${s.bar}`} />
							<div>
								<p className="text-3xl font-extrabold text-slate-900 leading-none">{String(s.value).padStart(2, '0')}</p>
								<p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p>
								<p className="text-[11px] text-slate-400">{s.sub}</p>
							</div>
						</div>
					))}
				</div>

				{/* ── TABLE CARD ── */}
				<div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">

					{/* Toolbar */}
					<div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<p className="text-sm font-extrabold text-slate-800">All Requests</p>
						<div className="flex gap-1.5 flex-wrap">
							{(['all', 'draft', 'sent', 'in_progress', 'completed', 'declined', 'failed'] as StatusFilter[]).map((s) => (
								<button
									key={s}
									onClick={() => setFilterStatus(s)}
									className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
										filterStatus === s
											? 'bg-blue-600 text-white border-blue-600'
											: 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
									}`}
								>
									{s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
								</button>
							))}
						</div>
					</div>

					{/* Column headers */}
					{!loading && !error && visibleRows.length > 0 && (
						<div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
							<div className="col-span-5">Contract</div>
							<div className="col-span-2 text-center">Signers</div>
							<div className="col-span-2">Timeline</div>
							<div className="col-span-2">Status</div>
							<div className="col-span-1 text-right">Actions</div>
						</div>
					)}

					{/* Rows */}
					<div className="divide-y divide-slate-100">
						{loading ? (
							<div className="py-20 text-center">
								<div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto" />
								<p className="text-sm text-slate-400 mt-3">Loading signing requests…</p>
							</div>
						) : error ? (
							<div className="py-20 text-center text-red-500 text-sm">{error}</div>
						) : visibleRows.length === 0 ? (
							<div className="py-20 text-center">
								<FileSignature className="w-10 h-10 text-slate-200 mx-auto" />
								<p className="text-sm text-slate-400 mt-3">No signing requests found</p>
							</div>
						) : (
							visibleRows.map((row) => {
								const contractId = String(row.contract_id || '').trim();
								const signers = Array.isArray(row.signers) ? row.signers : [];
								const signedCount = signers.filter((s) => Boolean(s?.has_signed) || String(s?.status || '').toLowerCase() === 'signed').length;
								const canDownload = String(row.status || '').toLowerCase() === 'completed';
								const disabled = downloadingFor === contractId;
								const pct = signers.length > 0 ? Math.round((signedCount / signers.length) * 100) : 0;

								return (
									<div
										key={row.id}
										role="button"
										tabIndex={0}
										onClick={() => openSigningStatus(contractId)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												openSigningStatus(contractId);
											}
										}}
										className="px-6 py-4 hover:bg-slate-50 transition cursor-pointer group"
									>
										<div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">

											{/* Contract info */}
											<div className="md:col-span-5 flex items-center gap-3 min-w-0">
												<div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition">
													<FileSignature className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
												</div>
												<div className="min-w-0">
													<p className="text-sm font-semibold text-slate-900 truncate">{row.contract_title || 'Contract'}</p>
													<p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">{contractId || '—'}</p>
												</div>
											</div>

											{/* Signers + progress bar */}
											<div className="md:col-span-2 flex flex-col items-start md:items-center gap-1.5">
												<div className="flex items-center gap-1.5">
													<span className="text-sm font-bold text-slate-800">{signedCount}</span>
													<span className="text-xs text-slate-400">/ {signers.length} signed</span>
												</div>
												{signers.length > 0 && (
													<div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
														<div
															className="h-full rounded-full bg-blue-500 transition-all"
															style={{ width: `${pct}%` }}
														/>
													</div>
												)}
											</div>

											{/* Timeline */}
											<div className="md:col-span-2 min-w-0">
												<p className="text-xs text-slate-600 truncate">{formatMaybeDate(row.sent_at)}</p>
												<p className="text-[11px] text-slate-400 truncate mt-0.5">Upd: {formatMaybeDate(row.updated_at || row.last_activity_at)}</p>
											</div>

											{/* Status badge */}
											<div className="md:col-span-2">
												<span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(row.status)}`}>
													{String(row.status || '—').replace('_', ' ').toUpperCase()}
												</span>
											</div>

											{/* Actions */}
											<div
												className="md:col-span-1 flex items-center justify-end gap-1.5"
												onClick={(e) => e.stopPropagation()}
											>
												{canDownload ? (
													<>
														<button
															type="button"
															onClick={(e) => { e.preventDefault(); e.stopPropagation(); void downloadExecuted(row); }}
															disabled={disabled}
															className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition disabled:opacity-50"
															title="Download signed PDF"
														>
															<Download className="w-3.5 h-3.5" />
														</button>
														<button
															type="button"
															onClick={(e) => { e.preventDefault(); e.stopPropagation(); void downloadCertificate(row); }}
															disabled={disabled}
															className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 text-[10px] font-black transition disabled:opacity-50"
															title="Download certificate"
														>C</button>
													</>
												) : (
													<span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">View →</span>
												)}
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>

					{/* Footer */}
					{!loading && visibleRows.length > 0 && (
						<div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
							<p className="text-xs text-slate-400">{visibleRows.length} request{visibleRows.length !== 1 ? 's' : ''} displayed</p>
							<button
								onClick={() => router.push('/contracts')}
								className="text-xs font-semibold text-blue-600 hover:underline"
							>
								View all contracts →
							</button>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
};

export default SigningRequestsPageV2;
