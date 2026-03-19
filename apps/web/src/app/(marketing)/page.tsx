'use client'

import Link from 'next/link'
import { ArrowRight, Activity, Leaf, ShieldCheck, Tractor, Map, Rss, Clock, CheckCircle2, Factory } from 'lucide-react'

// Internal UI Components
const Navbar = () => (
  <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Leaf className="h-4 w-4 text-emerald-500" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">KRISHi-EYE</span>
      </div>
      <nav className="hidden md:flex gap-8 text-sm font-medium text-white/70">
        <Link href="#features" className="hover:text-emerald-400 transition-colors">Features</Link>
        <Link href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</Link>
        <Link href="#telemetry" className="hover:text-emerald-400 transition-colors">Telemetry</Link>
        <Link href="/help" className="hover:text-emerald-400 transition-colors">Support</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
          Sign In
        </Link>
        <Link href="/login" className="text-sm font-semibold bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
          Get Started
        </Link>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative pt-24 pb-32 overflow-hidden flex flex-col items-center justify-center text-center">
    {/* Subtle Background Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
    
    <div className="container px-4 z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Live IoT Integration Ready
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
        Precision Agriculture<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
          Powered by Intelligence
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
        Centralized telemetry, autonomous fleet oversight, and AI-driven agronomic insights. Designed to optimize field operations and maximize yield with continuous hardware tracking.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/login">
          <button className="h-12 px-8 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 cursor-pointer">
            Access Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
        <Link href="#features">
          <button className="h-12 px-8 rounded-xl font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer">
            Explore Capabilities
          </button>
        </Link>
      </div>
    </div>
  </section>
);

const WhatItDoes = () => (
  <section id="features" className="py-24 border-t border-white/5 bg-background relative z-10">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Command Center for Modern Farms</h2>
        <p className="text-white/60 max-w-2xl mx-auto">Complete visibility from the edge of the field to the palm of your hand.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Tractor, title: 'Fleet Tracking', desc: 'Real-time telemetry ingested directly from IoT tractors. Monitor speed, boom capacity, and field traversal live.' },
          { icon: Activity, title: 'Disease Mapping', desc: 'Scan for localized fungal outbreaks. The system analyzes infection intensity logic to generate variable-rate spray heatmaps.' },
          { icon: Rss, title: 'AI Advisory', desc: 'Grounded RAG (Retrieval-Augmented Generation) trained on certified KVK records to assist with on-the-spot agronomic decisions.' }
        ].map((feat, i) => (
          <div key={i} className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-6">
              <feat.icon className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{feat.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 relative z-10">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center gap-16">
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Hardware to Intelligence Workflow</h2>
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            KRISHi-EYE relies on continuous background synchronization to ingest rich telemetry data over HTTPs JSON structures, resolving it into actionable operator insights.
          </p>
          
          <div className="space-y-6">
            {[
              { title: '1. Field Hardware Emissions', text: 'Raspberry Pi GNSS systems broadcast normalized location (WKT) and speed vectors.' },
              { title: '2. Backbone Ingestion', text: 'NestJS gateways queue, validate, and persist telemetry drops.' },
              { title: '3. Operator Visualization', text: 'Live field heatmaps reflect traversal efficiency and anomalies.' }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{step.title}</h4>
                  <p className="text-sm text-white/50">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mock Data Dashboard Graphic */}
        <div className="w-full md:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-3xl rounded-full" />
          <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-white/30 font-mono">Live Telemetry Ingestion</span>
            </div>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-white/[0.02] rounded border border-white/[0.05] text-emerald-400/80">
                POST /v1/telemetry/batch <span className="text-white/40">200 OK</span>
              </div>
              <div className="p-3 bg-white/[0.02] rounded border border-white/[0.05] text-white/70 overflow-x-auto whitespace-pre">
{`{
  "tractorId": "550e...0000",
  "points": [
    {
      "location": "POINT(77.59 12.97)",
      "speedKmph": 12.5,
      "heatWeight": 0.8
    }
  ]
}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const WhatWeTrack = () => (
  <section id="telemetry" className="py-24 bg-white/[0.01] border-y border-white/5 relative z-10">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Total Field Supervision</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Map, title: 'WKT Path Tracing', val: 'Geometry' },
          { icon: Activity, title: 'Infection Gravity', val: '0.0-1.0 Scale' },
          { icon: Clock, title: 'Job Progression', val: '% Complete' },
          { icon: Factory, title: 'Speed Vector', val: 'Kmph' },
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/[0.05]">
            <item.icon className="h-8 w-8 text-emerald-500/70 mx-auto mb-4" />
            <h4 className="text-white font-medium mb-1">{item.title}</h4>
            <span className="text-sm text-emerald-400/80 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="py-32 relative text-center">
    <div className="container px-4 relative z-10">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to scale your precision fleet?</h2>
      <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
        Join leading farm operators securing their crop yields through deterministic data and trusted AI advisories.
      </p>
      <Link href="/login">
        <button className="h-14 px-10 rounded-xl font-bold bg-white text-black hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 cursor-pointer mx-auto">
          Start Managing <ArrowRight className="h-5 w-5" />
        </button>
      </Link>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/10 py-12 relative z-10">
    <div className="container px-4 flex flex-col md:flex-row items-center justify-between">
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
        <span className="text-sm font-semibold text-white/50 tracking-wider">KRISHi-EYE</span>
      </div>
      <div className="flex gap-6 text-sm text-white/40">
        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
        <Link href="#" className="hover:text-white transition-colors">API Docs</Link>
      </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30 font-sans tracking-tight">
      <Navbar />
      <main>
        <Hero />
        <WhatItDoes />
        <HowItWorks />
        <WhatWeTrack />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
