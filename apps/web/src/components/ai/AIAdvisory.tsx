'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sprout, AlertCircle, RefreshCw, Loader2, MessageSquare, BookOpen, ChevronRight } from 'lucide-react'
import { apiRequest } from '@/lib/api-client'

interface Source {
  crop: string;
  snippet: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  sources?: Source[];
  pwa?: {
    cache: string;
    cachedAt?: string;
  };
}

export function AIAdvisory() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [cropFilter, setCropFilter] = useState('cotton')
  const scrollRef = useRef<HTMLDivElement>(null)

  const CROPS = ['cotton', 'rice', 'wheat', 'maize', 'general']

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userText = input.trim()
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMsg])
    setInput('')
    setSending(true)

    try {
      const params = new URLSearchParams({ q: userText })
      if (cropFilter && cropFilter !== 'general') params.append('crop', cropFilter)
      
      const res = await apiRequest<any>(`/rag/query?${params}`)
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: res.answer,
        timestamp: new Date().toISOString(),
        sources: res.sources,
        pwa: res._pwa
      }])
    } catch (err) {
      console.error('RAG Query failed:', err)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm having trouble connecting to the local Advisory engine. Please check your network or try again in a few moments.",
        timestamp: new Date().toISOString()
      }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl" 
         style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-green-500/10">
            <Sprout className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Grounded AI Advisor</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Local Knowledge Bank</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}
          >
            {CROPS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <button 
            onClick={() => setMessages([])}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Clear Chat"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-elegant">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Ask about Indian Agriculture</p>
            <p className="text-sm">Grounded in KCC & Sarthi Datasets</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-green-600 text-white rounded-br-none' 
                : 'bg-white/5 border border-white/10 text-foreground rounded-bl-none'
            }`}>
              <div className="flex flex-col gap-1">
                {msg.pwa?.cache === 'HIT' && (
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                    <span>Cached Results {msg.pwa.cachedAt ? `• ${new Date(msg.pwa.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                  </div>
                )}
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <BookOpen className="h-3 w-3" /> Grounded Sources
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s, i) => (
                      <div key={i} className="group relative">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-green-400 font-medium">
                          {s.crop} data
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-xl bg-black/90 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl border border-white/10">
                          {s.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {sending && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 rounded-bl-none">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                <span className="text-sm font-medium text-muted-foreground">Scanning local knowledge bank...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6" style={{ background: 'var(--background)', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${cropFilter}...`}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-green-500 transition-all outline-none"
          />
          <button 
            type="submit"
            disabled={!input.trim() || sending}
            className="absolute right-2 p-2.5 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-all disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <div className="mt-4 flex items-center gap-3 justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <AlertCircle className="h-3 w-3 text-green-500" />
            <span className="text-[10px] font-bold text-green-500 uppercase">Privacy Policy: Offline Only</span>
          </div>
          <p className="text-[10px] text-muted-foreground italic">Your data remains on this device.</p>
        </div>
      </div>
    </div>
  )
}
