'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api-client'
import { Plus, Tractor as TractorIcon, Info, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Tractor {
    id: string;
    label: string;
    description: string;
    status: string;
}

import { RegisterTractorModal } from '@/components/forms/register-tractor-modal'

export default function TractorsPage() {
    const [tractors, setTractors] = useState<Tractor[]>([])
    const [loading, setLoading] = useState(true)
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const fetchTractors = async () => {
        setLoading(true)
        try {
            const data = await apiRequest<Tractor[]>('/v1/tractors');
            setTractors(data);
        } catch (error) {
            console.error('Failed to fetch tractors', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTractors();
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Boom-Sprayer Fleet</h1>
                        <p className="text-slate-400 max-w-2xl">
                            Manage tractors equipped with 3-point hitch mounted KRISHI-EYE precision boom systems.
                        </p></div>
                <Button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-[#10B981] hover:bg-[#0E9D6E] text-[#0F1115]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Attachment
                </Button>
            </div>

            {showRegisterModal && (
                <RegisterTractorModal
                    onSuccess={() => {
                        setShowRegisterModal(false);
                        fetchTractors();
                    }}
                    onCancel={() => setShowRegisterModal(false)}
                />
            )}

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tractors.map((tractor) => (
                        <Card key={tractor.id} className="border-[#2A2D35] bg-[#181A20] text-white overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold">{tractor.label}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-slate-400 hover:text-emerald-400"
                                        onClick={() => copyToClipboard(tractor.id)}
                                        title="Copy Tractor ID for RPi .env"
                                    >
                                        {copiedId === tractor.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <div className={`h-2 w-2 rounded-full ${tractor.status === 'active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-[#6B7280] mb-4">Model: {tractor.description}</div>
                                <div className="flex items-center justify-center p-8 bg-[#22252C] rounded-xl mb-4">
                                    <TractorIcon className="h-16 w-16 text-[#10B981]/40" />
                                </div>
                                <Button className="w-full border-[#2A2D35] hover:bg-[#2A2D35] bg-transparent text-white border">
                                    <Info className="mr-2 h-4 w-4" />
                                    Diagnostics
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {tractors.length === 0 && (
                        <div className="col-span-full rounded-xl border border-dashed border-[#2A2D35] p-12 text-center text-[#A0AAB5]">
                            <TractorIcon className="h-12 w-12 text-[#6B7280]/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No boom attachments registered</h3>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                You haven't connected any KRISHI-EYE boom systems yet. Equip your host vehicles to start wide-pass spraying operations.
                            </p>
                            <Button
                                onClick={() => setShowRegisterModal(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Register Boom System
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
