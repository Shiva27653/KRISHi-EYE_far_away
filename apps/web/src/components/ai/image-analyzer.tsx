'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, AlertTriangle, CheckCircle2, ImageIcon } from 'lucide-react'
import { apiRequest } from '@/lib/api-client'

interface VisionResult {
    status: 'healthy' | 'infected' | 'uncertain' | 'error'
    confidence: number
    annotated_image?: string
    detections?: { class: string; confidence: number; area_percent: number }[]
    advisory?: { situation: string; recommendation: string; action: string; safety_note: string }
    message?: string
    model_metadata?: { note: string }
}

interface ImageAnalyzerProps {
    onClose: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImageAnalyzer({ onClose }: ImageAnalyzerProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState<VisionResult | null>(null)
    const [error, setError] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback((selectedFile: File) => {
        setError('')
        setResult(null)

        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Please upload a JPEG, PNG, or WebP image.')
            return
        }
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('Image must be under 10MB.')
            return
        }

        setFile(selectedFile)
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(selectedFile)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
    }, [handleFile])

    const analyze = async () => {
        if (!file) return
        setAnalyzing(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const rawData = await apiRequest<any>('/v1/ai/analyze-image', {
                method: 'POST',
                body: formData,
            })
            
            // Map the simplified backend payload into the frontend interface
            const data: VisionResult = {
                status: rawData.status || 'error',
                confidence: rawData.confidence ? rawData.confidence / 100 : 0, 
                annotated_image: rawData.annotated_image ? rawData.annotated_image.replace('data:image/jpeg;base64,', '') : undefined,
                advisory: rawData.advisory,
                detections: []
            }

            if (rawData.class) {
                data.detections!.push({
                    class: rawData.class,
                    confidence: rawData.confidence ? rawData.confidence / 100 : 0,
                    area_percent: rawData.lesion_area_percent || 0
                })
            }

            setResult(data)
        } catch (err: unknown) {
            console.error('Vision analysis error:', err);
            const message = err instanceof Error ? err.message : 'Failed to analyze image. Please check your connection and try again.';
            setError(message);
        } finally {
            setAnalyzing(false)
        }
    }

    const reset = () => {
        setFile(null)
        setPreview(null)
        setResult(null)
        setError('')
    }

    const statusConfig = {
        healthy: { icon: CheckCircle2, label: 'Healthy', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
        infected: { icon: AlertTriangle, label: 'Disease Detected', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' },
        uncertain: { icon: AlertTriangle, label: 'Uncertain — Expert Review Needed', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
        error: { icon: AlertTriangle, label: 'Analysis Error', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' },
    }

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Plant Disease Scanner</h3>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer transition-colors" style={{ color: 'var(--muted-foreground)' }} aria-label="Close scanner">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="p-5 space-y-4">
                {/* Upload zone — shown when no file */}
                {!file && !result && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className="flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center cursor-pointer transition-all"
                        style={{
                            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                            background: dragOver ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : 'var(--surface-alt)',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="h-12 w-12" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Drop a leaf image here</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>or tap to upload • JPEG, PNG, WebP up to 10MB</p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click() }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                            >
                                <Camera className="h-4 w-4" /> Take Photo
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                                style={{ background: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                            >
                                <Upload className="h-4 w-4" /> Gallery
                            </button>
                        </div>
                    </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {/* Preview + analyze */}
                {file && !result && (
                    <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--background)' }}>
                            {preview && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={preview} alt="Plant preview" className="w-full max-h-80 object-contain" />
                            )}
                            <button onClick={reset} className="absolute top-2 right-2 p-1.5 rounded-lg cursor-pointer" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }} aria-label="Remove image">
                                <X className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                            </button>
                        </div>
                        <button
                            onClick={analyze}
                            disabled={analyzing}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-bold cursor-pointer transition-all disabled:opacity-50"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                            {analyzing ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing leaf...</>
                            ) : (
                                <><Camera className="h-5 w-5" /> Analyze for Disease</>
                            )}
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2.5 rounded-xl p-3 text-sm" style={{
                        background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                        color: 'var(--danger)'
                    }}>
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="space-y-4">
                        {/* Status badge */}
                        {(() => {
                            const cfg = statusConfig[result.status] || statusConfig.error
                            const Icon = cfg.icon
                            return (
                                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                                    <Icon className="h-5 w-5 shrink-0" style={{ color: cfg.color }} />
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
                                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                            Confidence: {(result.confidence * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Annotated image */}
                        {result.annotated_image && (
                            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`data:image/jpeg;base64,${result.annotated_image}`} alt="Annotated analysis result" className="w-full" />
                            </div>
                        )}

                        {/* Detections */}
                        {result.detections && result.detections.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Detections</h4>
                                {result.detections.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                                        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{d.class}</span>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                            <span>{(d.confidence * 100).toFixed(0)}% conf</span>
                                            {d.area_percent > 0 && <span>{d.area_percent}% area</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Advisory card */}
                        {result.advisory && (
                            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Advisory</h4>
                                {result.advisory.situation && (
                                    <div><span className="text-[11px] font-bold block mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Situation</span>
                                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{result.advisory.situation}</p></div>
                                )}
                                {result.advisory.recommendation && (
                                    <div><span className="text-[11px] font-bold block mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Recommendation</span>
                                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{result.advisory.recommendation}</p></div>
                                )}
                                {result.advisory.action && (
                                    <div><span className="text-[11px] font-bold block mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Action</span>
                                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{result.advisory.action}</p></div>
                                )}
                                {result.advisory.safety_note && (
                                    <div className="flex items-start gap-2 rounded-lg p-2.5 text-xs" style={{
                                        background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
                                        border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)',
                                        color: 'var(--warning)'
                                    }}>
                                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <span>{result.advisory.safety_note}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Model note */}
                        {result.model_metadata?.note && (
                            <p className="text-[11px] text-center" style={{ color: 'var(--muted-foreground)' }}>
                                {result.model_metadata.note}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all" style={{ background: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                                <Camera className="h-4 w-4" /> Analyze Another
                            </button>
                            <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
