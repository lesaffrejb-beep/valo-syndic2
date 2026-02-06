/**
 * PPTX Types
 */

export interface PPTXBrand {
    agencyName?: string | undefined;
    primaryColor?: string | undefined;
    logoUrl?: string | undefined;
}

export interface SlideData {
    title: string;
    subtitle?: string;
    content?: string[];
    bigNumber?: { value: string; label: string; color?: string };
    chart?: ChartData;
    layout: 'title' | 'big-number' | 'two-columns' | 'bullet-points' | 'quote';
}

export interface ChartData {
    type: 'pie' | 'bar' | 'doughnut';
    data: { name: string; value: number; color: string }[];
}
