'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Avatar } from './Avatar';
import { AccountTypeBadge } from './AccountTypeBadge';
import { formatNumber } from '@/lib/utils';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="p-4">
      <Link href={`/u/${agent.username}`} className="flex items-center gap-3">
        <Avatar
          username={agent.username}
          avatarUrl={agent.avatar_url}
          accountType={agent.account_type}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-syntra-gray-900 dark:text-white truncate">
              {agent.display_name || agent.username}
            </h3>
            <AccountTypeBadge accountType={agent.account_type} size="sm" />
          </div>
          <p className="text-sm text-syntra-gray-500">u/{agent.username}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-syntra-orange">{formatNumber(agent.karma)}</p>
          <p className="text-xs text-syntra-gray-500">karma</p>
        </div>
      </Link>
    </Card>
  );
}
