import { Calendar, User, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { EventListItemDTO } from '@/types';
import { cn } from '@/lib/utils';

interface EventCardProps {
    event: EventListItemDTO;
    groupId: string;
}

export const EventCard = ({ event, groupId }: EventCardProps) => {
    const formattedDate = new Date(event.eventDate).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <a
            href={`/groups/${groupId}/events/${event.id}`}
            className="block transition-transform active:scale-[0.98]"
        >
            <Card className="overflow-hidden border-none bg-card/50 hover:bg-card/80 transition-colors rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                    {/* Event Avatar/Icon */}
                    <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                            <AvatarFallback className="bg-primary/5 text-primary">
                                {event.childName ? (
                                    event.childName.substring(0, 1).toUpperCase()
                                ) : (
                                    <Calendar className="w-5 h-5" />
                                )}
                            </AvatarFallback>
                        </Avatar>
                        {event.isOrganizer && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background">
                                <User className="w-2.5 h-2.5" />
                            </div>
                        )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-lg truncate leading-tight">
                                {event.title}
                            </h3>
                            {event.hasNewUpdates && (
                                <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 text-[10px] bg-blue-500/10 text-blue-500 border-none animate-pulse"
                                >
                                    Nowe
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{event.guestCount} gości</span>
                            </div>
                        </div>
                    </div>

                    {/* Role Indicator */}
                    <div className="flex items-center gap-2">
                        {event.isOrganizer ? (
                            <Badge
                                variant="outline"
                                className="hidden sm:flex text-[10px] border-primary/20 text-primary"
                            >
                                Organizujesz
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="hidden sm:flex text-[10px] border-muted-foreground/20 text-muted-foreground"
                            >
                                Gość
                            </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                </CardContent>
            </Card>
        </a>
    );
};
