
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnhanceType } from '../components/drawer/EnhancePanel';
import { GenerationSettings } from '../types';

/**
 * Reads a file and returns its base64 representation (without metadata prefix).
 * Used for uploading files to the AI model for analysis.
 * 
 * @param file The file object to read.
 * @returns A promise that resolves to the base64 encoded string.
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Split to get only the base64 data
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Helper to get MIME type from file or extension.
 * Ensures compatibility with Gemini API requirements for multimodal inputs.
 */
const getMimeType = (file: File): string => {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'md': return 'text/markdown';
        case 'csv': return 'text/csv';
        case 'json': return 'application/json';
        case 'pdf': return 'application/pdf';
        case 'txt': return 'text/plain';
        default: return 'text/plain';
    }
};

/**
 * Selects the appropriate Gemini model based on the complexity of the task.
 * Complex tasks like persona generation, file analysis, and code refactoring 
 * utilize the Pro model, while simpler tasks use Flash for speed.
 * 
 * @param type The type of enhancement requested.
 * @returns The model name string.
 */
export const getEnhancementModel = (type: EnhanceType): string => {
    const proModels: EnhanceType[] = [
        'persona', 
        'file-populate', 
        'a11y', 
        'responsive', 
        'tailwind', 
        'charts', 
        'enhance-code'
    ];
    return proModels.includes(type) ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
};

/**
 * Constructs the multimodal parts for the enhancement request.
 * Generates specific system prompts based on the enhance type.
 * 
 * @param type The specific enhancement action.
 * @param currentHtml The current HTML code of the artifact.
 * @param file Optional file input for data hydration tasks.
 * @returns An array of content parts for the Gemini API.
 */
export const buildEnhancementParts = async (
    type: EnhanceType, 
    currentHtml: string, 
    file?: File
): Promise<any[]> => {
    let enhancementPrompt = '';
    
    // File Population Strategy
    if (type === 'file-populate' && file) {
        const base64Data = await readFileAsBase64(file);
        const mimeType = getMimeType(file);
        
        enhancementPrompt = `
            You are an Expert Data Hydrator. I have provided a source document (${file.name}). 
            1. ANALYZE: Carefully read the provided document and extract all key data points: 
               - Specific metrics (numbers, percentages, dates)
               - Table rows and columns
               - Usernames, roles, or company-specific terminology
               - Recent trends or status updates
            2. INJECT: Deeply integrate this real data into the existing dashboard HTML:
               - Replace ALL "Lorem Ipsum", generic "Placeholder" strings, and static mockup numbers with values from the document.
               - Populate tables with the actual rows found in the file.
               - Update chart labels and datasets to reflect the document's statistics.
            3. CONSISTENCY: Maintain the existing visual style, CSS classes, and structural integrity of the UI.
            4. FORMAT: Return ONLY the complete, production-ready, standalone raw HTML. No markdown code blocks.
        `;

        return [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            },
            { text: enhancementPrompt },
            { text: `Existing Dashboard Code to hydrate:\n${currentHtml}` }
        ];
    }

    // Standard Enhancement Strategies
    switch (type) {
        case 'persona':
            enhancementPrompt = `
                You are a world-class Branding and UX Content Strategist. Your task is to inject high-fidelity brand identity and realistic, diverse user personas. 
                1. Brand Identity: Invent a professional company name and branding (colors, logo placeholder).
                2. User Personas: Generate realistic, professional user names, roles, and bio snippets.
                3. Images: Use specific, reliable placeholder URLs for professional portraits (e.g. https://i.pravatar.cc/300?u=[random]) or Unsplash-style placeholders (e.g. https://picsum.photos/seed/[random]/200/200).
                4. Professional Copy: Replace all placeholder text with domain-accurate professional copy.
                Return ONLY the complete updated raw HTML.
            `;
            break;
        case 'a11y':
            enhancementPrompt = `
                You are an expert Accessibility (A11y) Engineer. 
                Audit and fix this dashboard HTML to meet WCAG 2.1 AA standards:
                1. Improve ARIA labels and roles (aria-label, role="button", etc.).
                2. Ensure sufficient color contrast ratios for text (4.5:1 minimum).
                3. Fix semantic HTML tag usage (use <header>, <main>, <nav>, <section> appropriately).
                4. Add descriptive alt text to all images.
                5. Ensure all interactive elements have visible focus states.
                Return ONLY the complete fixed raw HTML.
            `;
            break;
        case 'format':
            enhancementPrompt = 'Prettify and format the code for high developer readability. Add helpful comments for sections. Return ONLY cleaned HTML.';
            break;
        case 'dummy':
            enhancementPrompt = `
                Inject high-fidelity, realistic business KPIs and at least 10 rows of varied data into tables. 
                1. DATA: Ensure trends and numbers look like live analytics with realistic formatting (currency, percentages).
                2. TEXT: Use names, descriptions, and figures relevant to the dashboard's topic. 
                3. IMAGES: Replace placeholders with reliable image URLs:
                   - Avatars: https://i.pravatar.cc/150?u=[random_string]
                   - Product/Cover Images: https://picsum.photos/seed/[random_string]/400/300
                4. INTEGRITY: Do not break the layout.
                Return ONLY updated HTML.
            `;
            break;
        case 'content':
            enhancementPrompt = 'Scan the dashboard for image placeholders and replace them with high-resolution photography placeholders from https://picsum.photos/seed/[random]/800/600. Return ONLY updated HTML.';
            break;
        case 'responsive':
            enhancementPrompt = `
                You are a Responsive Design Expert. Refine this dashboard for perfect viewing on Mobile (375px), Tablet (768px), and Desktop (1440px).
                1. Add a <meta name="viewport" content="width=device-width, initial-scale=1.0"> tag if missing.
                2. Use CSS Grid/Flexbox with flex-wrap where appropriate to prevent overflow.
                3. Adjust font sizes (clamp() or media queries) for readability on small screens.
                4. Ensure touch targets are at least 44px.
                5. Use hamburger menus or stackable navigation for mobile views.
                Return ONLY the complete updated raw HTML.
            `;
            break;
        case 'tailwind':
            enhancementPrompt = `
                You are a Senior Principal Frontend Engineer. Rewrite all custom CSS using Tailwind CSS utility classes exclusively.
                1. Parse all CSS in <style> tags and move them into Tailwind utility classes directly on HTML elements.
                2. Remove all <style> blocks. No custom CSS should remain.
                3. Add <script src="https://cdn.tailwindcss.com"></script> to the <head> if not present.
                4. Use arbitrary value syntax (e.g., bg-[#1a2b3c]) where needed to strictly preserve specific colors.
                5. Maintain exact visual parity.
                Return ONLY the complete updated raw HTML.
            `;
            break;
        case 'charts':
            enhancementPrompt = `
                You are a World-Class Data Visualization Engineer.
                Automatically identify data-heavy areas (tables, lists, numeric grids) and inject Chart.js canvas elements with live rendering scripts.
                1. Identify static data that would benefit from visualization (trends, distributions).
                2. Add Chart.js CDN (<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>) to the <head>.
                3. Inject <canvas> elements where appropriate.
                4. Add a <script> block at the end of <body> to initialize charts with the data found in the page.
                5. Ensure charts are responsive and match the dashboard's color theme.
                Return ONLY the complete updated raw HTML.
            `;
            break;
        case 'enhance-code':
            enhancementPrompt = `
                You are a Senior Principal Frontend Engineer. Perform a deep "Enhance Code" operation.
                1. Optimize layout logic and CSS performance.
                2. Inject Chart.js for data visualization where appropriate.
                3. Refine visual polish, spacing, and typography.
                4. Improve code structure and comments.
                Return ONLY the complete updated raw HTML.
            `;
            break;
        default:
            enhancementPrompt = 'Improve the code quality and visual polish of this dashboard. Return ONLY the complete updated raw HTML.';
    }

    return [{ text: `${enhancementPrompt}\n\nExisting Code:\n${currentHtml}` }];
};

/**
 * Constructs multimodal parts for initial generation (Vision-to-Code) or Text-to-Code.
 * 
 * @param prompt The user's description or request.
 * @param style The requested visual style (e.g., "Dark Futurism").
 * @param settings Generation settings (framework, auto-enhancements).
 * @param image Optional image for Vision-to-Code.
 * @returns An array of content parts for the Gemini API.
 */
export const buildGenerationParts = async (
    prompt: string, 
    style: string, 
    settings: GenerationSettings,
    image?: File
): Promise<any[]> => {
    const frameworkContext = settings.framework !== 'vanilla' 
        ? `Using ${settings.framework} for component patterns.` 
        : "Using vanilla HTML/CSS.";

    const dataContext = settings.dataContext.trim() 
        ? `Use this data context: "${settings.dataContext}".` 
        : "Use realistic industry-standard dummy data.";

    // Assemble dynamic enhancements based on user settings
    const enhancements = [];
    if (settings.autoA11y) enhancements.push("- Ensure WCAG 2.1 AA/AAA accessibility (ARIA, contrast, semantics).");
    if (settings.autoCharts) enhancements.push("- Detect numeric trends and inject interactive Chart.js visualizations.");
    if (settings.autoPersonas) enhancements.push("- Inject realistic brand personas, professional user profiles, and a cohesive brand identity.");
    
    const enhancementString = enhancements.length > 0 
        ? `\nMandatory AI Enhancements:\n${enhancements.join('\n')}` 
        : "";

    let textPrompt = '';

    if (image) {
        textPrompt = `
        You are a Senior Frontend Engineer. 
        TASK: Clone the UI structure and visual style shown in the provided image as closely as possible.
        CONTEXT: The user has also provided this description: "${prompt}".
        STYLE GUIDE: The user requested the style concept "${style}". Merge this with the image's layout.
        FRAMEWORK: ${frameworkContext}
        DATA: ${dataContext}
        ${enhancementString}
        REQUIREMENTS:
        - Analyze the image layout, spacing, colors, and typography.
        - Recreate the dashboard components (sidebar, charts, tables, cards).
        - Use placeholder data that matches the image context.
        - Ensure the code is responsive and production-ready.
        Return ONLY standalone raw HTML.
        `;
        
        const base64Data = await readFileAsBase64(image);
        return [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: image.type || 'image/png'
                }
            },
            { text: textPrompt }
        ];
    } else {
        textPrompt = `Expert Frontend Developer. Create a high-fidelity, polished dashboard for: "${prompt}". 
        Style Concept: ${style}. 
        Framework Context: ${frameworkContext}
        DATA: ${dataContext}
        ${enhancementString}
        Include: 
        - Sidebar and Top Navigation
        - KPI cards with icons
        - A professional data table
        - Realistic metrics
        Return ONLY standalone raw HTML.`;
        
        return [{ text: textPrompt }];
    }
};

/**
 * Generates the prompt for iterative refinements in the chat interface.
 * 
 * @param instruction The user's conversational refinement request.
 * @param currentHtml The current HTML state.
 * @returns The complete prompt string.
 */
export const getIterationPrompt = (instruction: string, currentHtml: string): string => {
    return `Senior Frontend Engineer. Modify the following dashboard interface.
    Existing Code:
    ${currentHtml}
    User Request: "${instruction}"
    Perform the requested changes while strictly adhering to the current design language, layout principles, and component hierarchy. Return ONLY the complete updated raw HTML.`;
};
