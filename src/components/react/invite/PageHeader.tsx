import * as React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
    return (
        <div className="flex flex-col gap-1.5 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}
        </div>
    );
};
