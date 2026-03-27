'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api-client'
import { Plus, ClipboardList, CheckCircle2, Clock, XCircle, Play, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Job {
    id: string;
    type: string;
    status: string;
    tractor: { name: string };
    field: { name: string };
    created_at: string;
}

const statusIcons: Record<string, any> = {
    'scheduled': <Clock className="h-4 w-4 text-[#F59E0B]" />,
    'running': <Play className="h-4 w-4 text-[#3B82F6] animate-pulse" />,
    'completed': <CheckCircle2 className="h-4 w-4 text-[#10B981]" />,
    'failed': <XCircle className="h-4 w-4 text-[#EF4444]" />,
    'cancelled': <XCircle className="h-4 w-4 text-[#6B7280]" />,
}

import { NewJobModal } from '@/components/forms/new-job-modal'

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewJobModal, setShowNewJobModal] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const fetchJobs = async () => {
        setLoading(true)
        try {
            const data = await apiRequest<Job[]>('/v1/jobs');
            setJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Spraying Operations</h1>
                        <p className="text-slate-400">
                            Review and manage wide-pass operation records for your sprayer-assisted field runs.
                        </p>
                </div>
                <Button
                    onClick={() => setShowNewJobModal(true)}
                    className="bg-[#10B981] hover:bg-[#0E9D6E] text-[#0F1115]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Job
                </Button>
            </div>

            {showNewJobModal && (
                <NewJobModal
                    onSuccess={() => {
                        setShowNewJobModal(false);
                        fetchJobs();
                    }}
                    onCancel={() => setShowNewJobModal(false)}
                />
            )}

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181A20] rounded-xl border border-[#2A2D35] border-dashed">
                    <ClipboardList className="h-12 w-12 text-[#A0AAB5] mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No operation records yet</h3>
                            <p className="text-slate-400 mb-6 max-w-md">
                                Completed field runs and boom-sprayer coverage logs will appear here after your first operation.
                            </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {jobs.map((job) => (
                        <Card key={job.id} className="border-[#2A2D35] bg-[#181A20] text-white hover:border-[#10B981]/50 transition-colors">
                            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-[#2A2D35] flex items-center justify-center">
                                        <ClipboardList className="h-5 w-5 text-[#A0AAB5]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold capitalize">{job.type.replace('_', ' ')}</div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-slate-400 hover:text-emerald-400"
                                                onClick={() => copyToClipboard(job.id)}
                                                title="Copy Job ID for RPi .env"
                                            >
                                                {copiedId === job.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                        <div className="text-sm text-[#A0AAB5]">
                                            {job.tractor.name} • {job.field.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col gap-1 md:items-end">
                                        <div className="text-xs text-[#6B7280]">Status</div>
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            {statusIcons[job.status] || <Clock className="h-4 w-4" />}
                                            <span className="capitalize">{job.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 md:items-end">
                                        <div className="text-xs text-[#6B7280]">Created</div>
                                        <div className="text-sm">{new Date(job.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <Button variant="ghost" className="text-[#10B981] hover:text-[#0E9D6E] hover:bg-[#10B981]/10">View Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {jobs.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#2A2D35] p-12 text-center text-[#A0AAB5]">
                            No jobs found. Click "New Job" to schedule an operation.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
