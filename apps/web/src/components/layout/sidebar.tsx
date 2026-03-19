'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map as MapIcon, BarChart3, HelpCircle, MessageSquare, Tractor, ClipboardList, Tent, User, LayoutDashboard, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useTheme } from '@/components/theme/theme-provider'

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Tent, label: 'My Farms', href: '/farms' },
    { href: '/tractors', label: 'Boom Sprayer Fleet', icon: Tractor },
    { href: '/jobs', label: 'Spraying Operations', icon: ClipboardList },
    { href: '/map', label: 'Field Map', icon: MapIcon },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/ask', label: 'Ask AI', icon: MessageSquare },
    { href: '/help', label: 'Help & Support', icon: HelpCircle },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const { theme, setTheme } = useTheme()

    const themeOptions: { value: 'dark' | 'light' | 'system'; icon: typeof Sun; label: string }[] = [
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'system', icon: Monitor, label: 'System' },
    ]

    return (
        <aside className="hidden h-full w-64 flex-col md:flex theme-transition" style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)'
        }}>
            <div className="flex h-16 items-center px-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>KRISHI-EYE</h1>
            </div>
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors cursor-pointer"
                            style={{
                                background: isActive ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                                fontWeight: isActive ? 600 : 400,
                            }}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Theme switcher */}
            <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex rounded-xl p-1" style={{ background: 'var(--surface-alt)' }}>
                    {themeOptions.map(opt => {
                        const Icon = opt.icon
                        const isActive = theme === opt.value
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setTheme(opt.value)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all cursor-pointer"
                                style={{
                                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                                    color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                                }}
                                aria-label={`Switch to ${opt.label} theme`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {opt.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* User card */}
            <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--surface-alt)' }}>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                        <User className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 overflow-hidden text-left min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {user?.phone || 'Farmer'}
                        </p>
                        <button
                            onClick={logout}
                            className="text-xs font-medium transition-colors cursor-pointer hover:underline"
                            style={{ color: 'var(--primary)' }}
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}
