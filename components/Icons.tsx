import React from 'react';
import { Trash2, Maximize2, Loader2, Sparkles } from 'lucide-react';

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Trash2 {...props as any} />
);

export const ExpandIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Maximize2 {...props as any} />
);

export const ThinkingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Loader2 {...props as any} />
);

export const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Sparkles {...props as any} />
);
