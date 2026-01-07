import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface LaunchpadTileProps {
    title: string;
    icon: React.ReactNode;
    href: string;
    summaryText: string;
    badge?: string;
    className?: string;
}

export function LaunchpadTile({
    title,
    icon,
    href,
    summaryText,
    badge,
    className,
}: LaunchpadTileProps) {
    return (
        <Card
            className={cn('group hover:border-primary/50 transition-all duration-300', className)}
        >
            <CardContent className="p-0">
                <a href={href} className="flex flex-col p-5 w-full h-full text-left gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            {React.cloneElement(icon as React.ReactElement<any>, {
                                className: 'w-6 h-6',
                            })}
                        </div>
                        {badge && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{summaryText}</p>
                    </div>

                    <div className="mt-auto pt-2 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Otwórz</span>
                        <ChevronRight className="ml-1 w-4 h-4" />
                    </div>
                </a>
            </CardContent>
        </Card>
    );
}
