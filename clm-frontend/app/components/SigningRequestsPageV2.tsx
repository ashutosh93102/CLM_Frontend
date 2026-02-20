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
		return 'bg-emerald-50 text-emerald-700 border-emerald-200';
	}
	if (['declined', 'rejected', 'canceled', 'cancelled', 'refused', 'failed', 'error'].includes(raw)) {
		return 'bg-rose-50 text-rose-700 border-rose-200';
	}
	if (['sent', 'invited', 'pending', 'in_progress', 'in progress', 'viewed', 'draft'].includes(raw)) {
		return 'bg-amber-50 text-amber-800 border-amber-200';
	}
	return 'bg-slate-50 text-slate-700 border-slate-200';
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
			<div className="flex items-center justify-between gap-4 mb-6">
				<div className="min-w-0">
					<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Signing Requests</h1>
					<p className="mt-2 text-sm text-slate-600">
						Default provider: <span className="font-semibold">In-house signing</span>
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="relative hidden sm:block">
						<Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by contract or signer…"
							className="w-[340px] bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
						/>
					</div>
					<button
						onClick={() => router.push('/contracts')}
						className="inline-flex items-center gap-2 rounded-full bg-[#0F141F] text-white px-5 py-3 text-sm font-semibold"
					>
						<FileSignature className="w-4 h-4" />
						Go to Contracts
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				{[
					{ label: 'Total', value: stats.total },
					{ label: 'Draft', value: stats.draft },
					{ label: 'Active', value: stats.active },
					{ label: 'Completed', value: stats.completed },
				].map((s) => (
					<div key={s.label} className="rounded-3xl bg-white border border-slate-200 p-6">
						<p className="text-slate-500 text-sm">{s.label}</p>
						<p className="text-4xl font-extrabold text-slate-900 mt-2">{String(s.value).padStart(2, '0')}</p>
					</div>
				))}
			</div>

			<div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
				<div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
					<div>
						<p className="text-lg font-extrabold text-slate-900">All Signing Requests</p>
						<p className="text-sm text-slate-500 mt-1">{visibleRows.length} request{visibleRows.length !== 1 ? 's' : ''}</p>
					</div>

					<div className="flex gap-2 flex-wrap">
						{(['all', 'draft', 'sent', 'in_progress', 'completed', 'declined', 'failed'] as StatusFilter[]).map((s) => (
							<button
								key={s}
								onClick={() => setFilterStatus(s)}
								className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
									filterStatus === s
										? 'bg-[#0F141F] text-white border-[#0F141F]'
										: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
								}`}
							>
								{s === 'all'
									? 'All'
									: s === 'in_progress'
										? 'In Progress'
										: s.charAt(0).toUpperCase() + s.slice(1)}
							</button>
						))}
					</div>
				</div>

				<div className="divide-y divide-slate-200">
					{loading ? (
						<div className="py-16 text-center text-slate-500">Loading signing requests…</div>
					) : error ? (
						<div className="py-16 text-center text-rose-600">{error}</div>
					) : visibleRows.length === 0 ? (
						<div className="py-16 text-center text-slate-500">No signing requests found</div>
					) : (
						visibleRows.map((row) => {
							const contractId = String(row.contract_id || '').trim();
							const signers = Array.isArray(row.signers) ? row.signers : [];
							const signedCount = signers.filter((s) => Boolean(s?.has_signed) || String(s?.status || '').toLowerCase() === 'signed').length;
							const canDownload = String(row.status || '').toLowerCase() === 'completed';
							const disabled = downloadingFor === contractId;

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
									className="w-full text-left px-6 py-5 hover:bg-slate-50 transition cursor-pointer"
								>
									<div className="flex items-center justify-between gap-4">
										<div className="min-w-0">
											<p className="font-semibold text-slate-900 truncate">{row.contract_title || 'Contract'}</p>
											<p className="text-xs text-slate-500 mt-1 truncate">
												{contractId} • {signedCount}/{signers.length} signed
											</p>
											<p className="text-xs text-slate-500 mt-1 truncate">
												Sent: {formatMaybeDate(row.sent_at)} • Updated: {formatMaybeDate(row.updated_at || row.last_activity_at)}
											</p>
										</div>

										<div className="flex items-center gap-3 shrink-0">
											<span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(row.status)}`}>
												{String(row.status || '—').toUpperCase()}
											</span>

											{canDownload ? (
												<>
													<button
														type="button"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															downloadExecuted(row);
														}}
														disabled={disabled}
														className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-800 w-9 h-9 hover:bg-slate-50 disabled:opacity-50"
														aria-label="Download executed PDF"
														title="Download executed PDF"
													>
														<Download className="w-4 h-4" />
													</button>
													<button
														type="button"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															downloadCertificate(row);
														}}
														disabled={disabled}
														className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-800 w-9 h-9 hover:bg-slate-50 disabled:opacity-50"
														aria-label="Download certificate"
														title="Download certificate"
													>
														<span className="text-xs font-extrabold">C</span>
													</button>
												</>
											) : null}

											<span className="text-sm font-semibold text-slate-700">View →</span>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</DashboardLayout>
	);
};

export default SigningRequestsPageV2;
