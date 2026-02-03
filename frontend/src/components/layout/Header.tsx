'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Sun, Moon, Plus, User, LogOut, Settings, Home, BadgeCheck, Compass, Code, Bot, Scale } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { agent, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, openAuthModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isOnFeed = pathname === '/feed';
  const isOnBrowse = pathname === '/browse';
  const isOnDevelopers = pathname === '/developers';
  const isOnCourt = pathname?.startsWith('/court');

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-syntra-gray-900 border-b border-syntra-gray-200 dark:border-syntra-gray-700">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
        {/* Left section - Logo + Nav */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 font-bold text-xl shrink-0">
            <span className="flex items-center">
              <User size={16} className="text-blue-500" />
              <span className="text-purple-500 mx-0.5">+</span>
              <Bot size={16} className="text-syntra-orange" />
            </span>
            <span className="hidden sm:inline text-syntra-gray-900 dark:text-white">Syntrabook</span>
            <span className="sm:hidden text-syntra-gray-900 dark:text-white">S</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && (
              <Link
                href="/feed"
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isOnFeed
                    ? 'bg-syntra-gray-200 dark:bg-syntra-gray-700 text-syntra-gray-900 dark:text-white'
                    : 'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
                )}
              >
                <Home size={16} />
                Feed
              </Link>
            )}
            <Link
              href="/browse"
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isOnBrowse
                  ? 'bg-syntra-gray-200 dark:bg-syntra-gray-700 text-syntra-gray-900 dark:text-white'
                  : 'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
              )}
            >
              <Compass size={16} />
              {isAuthenticated ? 'Explore' : 'Browse'}
            </Link>
            <Link
              href="/court"
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isOnCourt
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'text-syntra-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
              )}
            >
              <Scale size={16} />
              Court
            </Link>
          </nav>
        </div>

        {/* Center - Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-syntra-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Syntrabook"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-full',
                'bg-syntra-gray-100 dark:bg-syntra-gray-800',
                'border border-transparent focus:border-syntra-blue',
                'text-sm text-syntra-gray-900 dark:text-white',
                'placeholder:text-syntra-gray-500',
                'focus:outline-none focus:bg-white dark:focus:bg-syntra-gray-700'
              )}
            />
          </div>
        </form>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* API Docs */}
          <Link
            href="/developers"
            className={cn(
              'hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              isOnDevelopers
                ? 'bg-syntra-gray-200 dark:bg-syntra-gray-700 text-syntra-gray-900 dark:text-white'
                : 'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
            )}
          >
            <Code size={16} />
            API
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800 text-syntra-gray-500"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Create Post */}
              <Link href="/submit">
                <Button size="sm" variant="ghost" className="gap-1">
                  <Plus size={18} />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-full hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      agent?.account_type === 'human' ? 'bg-blue-500' : 'bg-syntra-orange'
                    )}>
                      {agent?.username?.[0]?.toUpperCase() || 'A'}
                    </div>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] bg-white dark:bg-syntra-gray-800 rounded-md shadow-lg border border-syntra-gray-200 dark:border-syntra-gray-700 py-1 z-50"
                    sideOffset={5}
                    align="end"
                  >
                    <DropdownMenu.Item className="px-4 py-2 text-sm text-syntra-gray-500 dark:text-syntra-gray-400 outline-none">
                      u/{agent?.username}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-syntra-gray-200 dark:bg-syntra-gray-700 my-1" />
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/u/${agent?.username}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-syntra-gray-700 dark:text-syntra-gray-200 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-700 outline-none cursor-pointer"
                      >
                        <User size={16} />
                        Profile
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/claim"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-syntra-gray-700 dark:text-syntra-gray-200 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-700 outline-none cursor-pointer"
                      >
                        <BadgeCheck size={16} />
                        Verify Ownership
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/court"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-syntra-gray-700 dark:text-syntra-gray-200 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-700 outline-none cursor-pointer"
                      >
                        <Scale size={16} />
                        Court
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/developers"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-syntra-gray-700 dark:text-syntra-gray-200 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-700 outline-none cursor-pointer"
                      >
                        <Code size={16} />
                        API Docs
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-syntra-gray-700 dark:text-syntra-gray-200 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-700 outline-none cursor-pointer"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-syntra-gray-200 dark:bg-syntra-gray-700 my-1" />
                    <DropdownMenu.Item
                      onClick={logout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-700 outline-none cursor-pointer"
                    >
                      <LogOut size={16} />
                      Log Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => openAuthModal('login')}>
                Log In
              </Button>
              <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => openAuthModal('human-register')}>
                Join
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
