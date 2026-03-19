'use client'

import { useState, useEffect } from 'react'
import { MetricCard } from '@/components/charts/metric-card'
import { FarmHeatmap } from '@/components/map/farm-heatmap'
import { apiRequest } from '@/lib/api-client'
import { Activity, Tractor, Target, CheckCircle2 } from 'lucide-react'

interface AnalyticsOverview {
    totalFarms: number;
    activeFields: number;
    totalJobs: number;
    totalSavings: number;
}

export default function DashboardPage() {
    const [data, setData] = useState<AnalyticsOverview | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const overview = await apiRequest<AnalyticsOverview>('/v1/analytics/overview');
                setData(overview);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
                <div className="flex flex-col gap-2 mb-2">
                    <div className="h-8 w-72 rounded-lg skeleton" />
                    <div className="h-4 w-96 rounded-lg skeleton" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-xl skeleton" />
                    ))}
                </div>
                <div className="h-[600px] rounded-xl skeleton" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-1 mb-2">
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Spraying Operations Overview
                </h1>
                <p className="max-w-2xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Monitor your boom-width coverage, precision detection metrics, and spraying efficiency for equipped tractors.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard
                    title="Coverage Area"
                    value="0ac"
                    icon={<Target className="h-5 w-5" style={{ color: 'var(--info)' }} />}
                    trend={{ value: 12.5, label: 'vs last run', positive: true }}
                />
                <MetricCard
                    title="Equipped Boom Fleet"
                    value="1"
                    icon={<Tractor className="h-5 w-5" style={{ color: 'var(--success)' }} />}
                    trend={{ value: 0, label: 'All systems ready', positive: true }}
                />
                <MetricCard
                    title="Spraying Passes"
                    value="0"
                    icon={<Activity className="h-5 w-5" style={{ color: 'var(--danger)' }} />}
                />
                <MetricCard
                    title="Treatment Efficiency"
                    value="85%"
                    icon={<CheckCircle2 className="h-5 w-5" style={{ color: 'var(--success)' }} />}
                    trend={{ value: 5, label: 'Optimized Spraying', positive: true }}
                />
            </div>

            <div className="w-full h-[600px] flex rounded-xl overflow-hidden" style={{
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <FarmHeatmap />
            </div>
        </div>
    )
}
