'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sprout, AlertCircle, RefreshCw, Loader2, MessageSquare, BookOpen, Camera } from 'lucide-react'
import { apiRequest } from '@/lib/api-client'
import { ImageAnalyzer } from '@/components/ai/image-analyzer'

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface AiMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
    sources?: { title: string; url?: string }[];
    confidence?: string;
}

export default function AskAIPage() {
    const [messages, setMessages] = useState<AiMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [showScanner, setShowScanner] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await apiRequest<any[]>('/v1/ai/history');
                const formattedHistory: AiMessage[] = data.flatMap(log => [
                    {
                        id: `${log.id}-user`,
                        role: 'user' as const,
                        content: log.prompt,
                        timestamp: log.createdAt
                    },
                    {
                        id: `${log.id}-ai`,
                        role: 'ai' as const,
                        content: log.response,
                        timestamp: log.createdAt,
                        sources: log.sources,
                        confidence: log.confidence
                    }
                ]);
                setMessages(formattedHistory);
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, sending]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || sending) return

        const userText = input.trim();
        const optimisticId = Date.now().toString();
        
        const newMsg: AiMessage = { 
            id: optimisticId, 
            role: 'user', 
            content: userText,
            timestamp: new Date().toISOString()
        };
        
        setMessages((prev) => [...prev, newMsg])
        setInput('')
        setSending(true)
        setError('')

        try {
            const params = new URLSearchParams({ q: userText, crop: 'cotton' });
            const aiResponse = await apiRequest<any>(`/v1/rag/query?${params}`);

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: aiResponse.answer,
                    timestamp: new Date().toISOString(),
                    sources: aiResponse.sources?.map((s: any) => ({ title: s.crop, snippet: s.snippet })) || [],
                    confidence: 'Grounded'
                }
            ]);
        } catch (err) {
            console.error('RAG Request failed:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: 'I apologize, but I am currently unable to reach the local advisory database. Please ensure Ollama is running.',
                    timestamp: new Date().toISOString()
                }
            ]);
        } finally {
            setSending(false);
        }
    }

    const resetHistory = () => {
        if (confirm('Clear chat history?')) {
            setMessages([]);
        }
    }

    return (
        <div className="flex flex-col flex-1 w-full mx-auto transition-all duration-300" style={{ background: 'var(--background)' }}>
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between px-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                        <Sprout className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Agri Advisory AI</h2>
                        <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Online & Ready</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowScanner(!showScanner)}
                        className="flex items-center text-xs gap-1.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer touch-target"
                        style={{
                            color: showScanner ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                            background: showScanner ? 'var(--primary)' : 'var(--surface-alt)'
                        }}
                    >
                        <Camera className="h-4 w-4" /> Scan Leaf
                    </button>
                    <button
                        onClick={resetHistory}
                        className="flex items-center text-xs gap-1.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer touch-target"
                        style={{ color: 'var(--muted-foreground)', background: 'var(--surface-alt)' }}
                    >
                        <RefreshCw className="h-4 w-4" /> Reset
                    </button>
                </div>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-elegant">
                <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full space-y-8">
                {/* Image Scanner */}
                {showScanner && (
                    <ImageAnalyzer onClose={() => setShowScanner(false)} />
                )}

                {/* Disclaimer */}
                <div className="rounded-xl p-4 text-sm flex items-start gap-3" style={{
                    background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)',
                    color: 'var(--muted-foreground)'
                }}>
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                    <p>Responses are generated by AI for agronomic decision support. This tool does not control vehicle hardware or boom sprayer outputs. Always verify with an agronomist for severe crop issues.</p>
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading advisory history...</span>
                    </div>
                ) : messages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 gap-4 text-center">
                        <MessageSquare className="h-12 w-12 md:h-16 md:w-16" style={{ color: 'var(--muted-foreground)', opacity: 0.3 }} />
                        <div className="max-w-md">
                            <p className="text-base md:text-lg font-bold" style={{ color: 'var(--foreground)' }}>Agri Advisory Intelligence</p>
                            <p className="text-sm mt-1.5" style={{ color: 'var(--muted-foreground)', opacity: 0.8 }}>Ask about crops, pests, fertilizers, or spraying operations. Your questions are grounded in Indian agronomic databanks.</p>
                        </div>
                    </div>
                ) : null}

                {/* Messages */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col max-w-[90%] md:max-w-[80%] lg:max-w-[75%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                        <div
                            className="rounded-2xl px-5 py-3"
                            style={msg.role === 'user' ? {
                                background: 'var(--primary)',
                                color: 'white',
                                borderBottomRightRadius: '4px'
                            } : {
                                background: 'var(--card)',
                                border: '1px solid var(--border)',
                                color: 'var(--foreground)',
                                borderBottomLeftRadius: '4px'
                            }}
                        >
                            <div className="whitespace-pre-wrap text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: (msg.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            
                            {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                                    <span className="text-xs w-full block mb-1 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                                        <BookOpen className="h-3 w-3" /> Sources:
                                    </span>
                                    {msg.sources.map((src, i) => (
                                        <div key={i} className="text-xs px-2.5 py-1 rounded-lg inline-flex items-center font-medium" style={{
                                            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                            color: 'var(--primary)'
                                        }}>
                                            {src.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-1.5 px-1">
                            {msg.role === 'ai' && (
                                <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} /> Grounded
                                    {msg.confidence && ` • ${msg.confidence}`}
                                </span>
                            )}
                            {msg.timestamp && (
                                <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* Typing indicator */}
                {sending && (
                    <div className="flex flex-col max-w-[85%] mr-auto items-start">
                        <div className="rounded-2xl px-5 py-3 flex items-center gap-2" style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderBottomLeftRadius: '4px'
                        }}>
                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--primary)' }} />
                            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Analyzing agronomic databanks...</span>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* Input bar — sticky at bottom, keyboard-safe */}
            <div className="shrink-0 p-4 md:p-6 lg:p-8 keyboard-safe" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                <form onSubmit={handleSend} className="relative max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about crops, pests, fertilizers, spraying..."
                        className="w-full rounded-2xl py-5 pl-7 pr-16 bg-transparent focus:ring-2 focus:ring-[var(--primary)] transition-all text-base md:text-lg"
                        style={{
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                            color: 'var(--foreground)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-lg)' }}
                        aria-label="Send message"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
