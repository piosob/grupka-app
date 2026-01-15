import { useState } from 'react';
import { Send, ShieldAlert, Trash2 } from 'lucide-react';
import { useComments } from '@/lib/hooks/useComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CommentThreadProps {
    eventId: string;
    isOrganizer: boolean;
}

export const CommentThread = ({ eventId, isOrganizer }: CommentThreadProps) => {
    const [newComment, setNewComment] = useState('');
    const { comments, isLoadingComments, addComment, isAddingComment, deleteComment } =
        useComments(eventId);

    if (isOrganizer) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-500">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-semibold text-amber-500 text-sm">Jesteś organizatorem</p>
                    <p className="text-xs text-amber-500/80 leading-relaxed">
                        To jest ukryty wątek dla gości. Jako organizator nie masz do niego dostępu,
                        aby nie psuć sobie niespodzianki!
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        addComment(
            { content: newComment.trim() },
            {
                onSuccess: () => setNewComment(''),
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Wątek niespodzianka</h3>
                <Badge
                    variant="outline"
                    className="text-[10px] border-primary/20 text-primary uppercase tracking-wider px-2 py-0.5"
                >
                    Tylko dla gości
                </Badge>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {isLoadingComments ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-muted/50 animate-in fade-in duration-500">
                        <p className="text-sm text-muted-foreground">
                            Brak komentarzy. Zacznij dyskusję o prezentach!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment, idx) => (
                            <div
                                key={comment.id}
                                className="flex gap-3 group animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <Avatar className="h-8 w-8 shrink-0 border border-primary/10">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {comment.authorLabel.substring(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            {comment.authorLabel}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground/50">
                                            {new Date(comment.createdAt).toLocaleTimeString(
                                                'pl-PL',
                                                { hour: '2-digit', minute: '2-digit' }
                                            )}
                                        </span>
                                    </div>
                                    <div className="relative bg-muted/50 p-3 rounded-2xl rounded-tl-none border border-muted/30 group-hover:bg-muted/70 transition-colors">
                                        <p className="text-sm whitespace-pre-wrap">
                                            {comment.content}
                                        </p>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm hover:text-destructive"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Usunąć komentarz?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Czy na pewno chcesz usunąć ten komentarz?
                                                        Tej operacji nie można cofnąć.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-full">
                                                        Anuluj
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteComment(comment.id)}
                                                        className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Usuń
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Comment Input */}
            <form
                onSubmit={handleSubmit}
                className="relative mt-8 animate-in slide-in-from-bottom-2 duration-500"
            >
                <Textarea
                    placeholder="Napisz coś o prezencie lub organizacji..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] rounded-2xl pr-12 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                    disabled={isAddingComment}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute bottom-3 right-3 rounded-full h-8 w-8 shadow-md transition-transform active:scale-90"
                    disabled={!newComment.trim() || isAddingComment}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};
