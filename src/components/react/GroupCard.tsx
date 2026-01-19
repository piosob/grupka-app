import React from 'react';
import { Users, Crown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { GroupListItemDTO } from '../../types';

interface GroupCardProps {
    group: GroupListItemDTO;
}

export function GroupCard({ group }: GroupCardProps) {
    return (
        <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardContent className="p-0">
                <a
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between p-5 w-full text-left gap-4"
                >
                    <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors truncate sm:whitespace-normal sm:overflow-visible">
                                {group.name}
                            </h3>
                            {group.role === 'admin' && (
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 border-none shrink-0"
                                >
                                    <Crown className="w-3 h-3" />
                                    Admin
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Users className="w-4 h-4" />
                                <span>{group.memberCount} członków</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="shrink-0">
                                Od {new Date(group.joinedAt).toLocaleDateString('pl-PL')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors shrink-0">
                        <ChevronRight className="w-5 h-5 text-primary" />
                    </div>
                </a>
            </CardContent>
        </Card>
    );
}
