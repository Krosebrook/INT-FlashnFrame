
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RepoFileTree, Citation, Task, DependencyInfo } from '../types';
import { apiCache, createCacheKey, deduplicatedFetch } from './cache';

let userProvidedGeminiKey: string | null = null;
let serverProvidedGeminiKey: string | null = null;

export function setUserGeminiKey(key: string | null) {
  userProvidedGeminiKey = key;
}

export function getUserGeminiKey(): string | null {
  return userProvidedGeminiKey;
}

async function fetchServerKey(): Promise<string | null> {
  if (serverProvidedGeminiKey) return serverProvidedGeminiKey;
  try {
    const res = await fetch('/api/ai/key', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.key) {
        serverProvidedGeminiKey = data.key;
        return data.key;
      }
    }
  } catch { }
  return null;
}

const getAiClient = () => {
  const key = userProvidedGeminiKey || serverProvidedGeminiKey;
  if (!key) {
    throw new Error('No Gemini API key configured. Please add your API key in Settings.');
  }
  return new GoogleGenAI({ apiKey: key });
};

export async function ensureAiClient(): Promise<GoogleGenAI> {
  let key = userProvidedGeminiKey || serverProvidedGeminiKey;
  if (!key) {
    key = await fetchServerKey();
  }
  if (!key) {
    throw new Error('No Gemini API key configured. Please add your API key in Settings.');
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function validateGeminiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new GoogleGenAI({ apiKey: key });
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "ok"',
    });
    return { valid: true };
  } catch (error: any) {
    const msg = (error?.message || error?.toString?.() || '').toLowerCase();
    if (msg.includes('api key not valid') || msg.includes('invalid') || msg.includes('401') || msg.includes('403')) {
      return { valid: false, error: 'This API key is invalid. Please check it and try again.' };
    }
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
      return { valid: true, error: 'Key is valid but has hit its rate limit. It will work once the limit resets.' };
    }
    return { valid: false, error: `Could not verify key: ${error?.message || 'Unknown error'}` };
  }
}

export const IMAGE_MODELS = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-preview-image'];
export const TEXT_MODELS = ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'];

function isModelNotAvailable(error: any): boolean {
  const msg = (error?.message || error?.toString?.() || '').toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('not available') ||
         msg.includes('model') && (msg.includes('does not exist') || msg.includes('invalid'));
}

export async function withModelFallback<T>(
  models: string[],
  callFn: (model: string) => Promise<T>
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const hasMoreModels = i < models.length - 1;
    try {
      return await callFn(model);
    } catch (error: any) {
      lastError = error;
      if (isModelNotAvailable(error)) {
        console.warn(`Model ${model} not available, trying fallback...`);
        continue;
      }
      if (hasMoreModels && (isRateLimitError(error) || isQuotaError(error))) {
        console.warn(`Model ${model} hit rate/quota limit, trying fallback...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('All models unavailable');
}

let globalRateLimitUntil = 0;

export function isGeminiRateLimited(): boolean {
  return Date.now() < globalRateLimitUntil;
}

export function getGeminiRateLimitRemaining(): number {
  const remaining = Math.ceil((globalRateLimitUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function setGeminiRateLimit(seconds: number = 60) {
  globalRateLimitUntil = Date.now() + seconds * 1000;
}

function isRateLimitError(error: any): boolean {
  const status = error?.status || error?.httpStatus;
  if (status === 429) return true;
  const code = (error?.code || '').toString().toLowerCase();
  if (code === '429' || code === 'resource_exhausted') return true;
  const msg = (error?.message || error?.toString?.() || '').toLowerCase();
  if (msg.includes('429') || msg.includes('too many requests')) return true;
  if (msg.includes('resource exhausted') || msg.includes('resource_exhausted')) return true;
  if (msg.includes('rate limit') && !msg.includes('404') && !msg.includes('not found')) return true;
  return false;
}

function isQuotaError(error: any): boolean {
  const msg = (error?.message || error?.toString?.() || '').toLowerCase();
  return (msg.includes('quota') && !msg.includes('429') && !msg.includes('too many requests')) ||
         (msg.includes('billing') || msg.includes('payment required') || msg.includes('402'));
}

function isApiKeyError(error: any): boolean {
  const msg = (error?.message || error?.toString?.() || '').toLowerCase();
  const status = error?.status || error?.httpStatus;
  return status === 401 || status === 403 ||
    msg.includes('api key not valid') || msg.includes('invalid api key') ||
    msg.includes('api_key_invalid') || msg.includes('permission denied') ||
    (msg.includes('401') && (msg.includes('key') || msg.includes('auth')));
}

function getApiKeyErrorMessage(error: any): string {
  const msg = (error?.message || error?.toString?.() || '').toLowerCase();
  if (msg.includes('api key not valid') || msg.includes('invalid') || msg.includes('401')) {
    return 'Your Gemini API key is invalid. Please go to Settings and enter a valid key.';
  }
  if (msg.includes('permission denied') || msg.includes('403')) {
    return 'Your Gemini API key does not have permission for this operation. Please check the key has the correct permissions.';
  }
  if (msg.includes('billing') || msg.includes('payment') || msg.includes('402')) {
    return 'Your Gemini API account needs billing enabled. Please check your Google AI Studio account.';
  }
  return 'API key error. Please verify your Gemini API key in Settings.';
}

async function withSmartRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelayMs: number = 2000
): Promise<T> {
  if (isGeminiRateLimited()) {
    throw new Error(`Rate Limit Active: Please wait ${getGeminiRateLimitRemaining()} seconds before trying again.`);
  }

  let delay = initialDelayMs;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (isApiKeyError(error)) {
        throw new Error(getApiKeyErrorMessage(error));
      }
      if (isRateLimitError(error)) {
        const retryMatch = (error.message || '').match(/retry.?after[:\s]*(\d+)/i);
        const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 60;
        setGeminiRateLimit(retryAfter);
        throw error;
      }
      if (isQuotaError(error)) {
        throw error;
      }
      if (attempt === maxRetries) throw error;
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('404') || msg.includes('safety') || msg.includes('permission')) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Max retries exceeded');
}

const CACHE_TTL = 5 * 60 * 1000;
const IMAGE_CACHE_TTL = 10 * 60 * 1000;

export interface InfographicResult {
    imageData: string | null;
    citations: Citation[];
}

/**
 * Generates an infographic representation of a repository structure.
 * 
 * @param repoName - Name of the repository (e.g., "owner/repo").
 * @param fileTree - Array of file paths representing the repo structure.
 * @param style - Visual style guideline to apply (e.g., "Neon Cyberpunk").
 * @param is3D - Whether to generate a 3D isometric/tabletop view.
 * @param language - Target language for text labels.
 * @returns Promise resolving to base64 image data string or null.
 */
export async function generateInfographic(
  repoName: string, 
  fileTree: RepoFileTree[], 
  style: string, 
  is3D: boolean = false,
  language: string = "English"
): Promise<string | null> {
  const limitedTree = fileTree.slice(0, 150).map(f => f.path).join(', ');
  
  let styleGuidelines = "";
  let dimensionPrompt = "";

  if (is3D) {
      // OVERRIDE standard styles for a specific "Tabletop Model" look
      styleGuidelines = `VISUAL STYLE: Photorealistic Miniature Diorama. The data flow should look like a complex, glowing 3D printed physical model sitting on a dark, reflective executive desk.`;
      dimensionPrompt = `PERSPECTIVE & RENDER: Isometric view with TILT-SHIFT depth of field (blurry foreground/background) to make it look like a small, tangible object on a table. Cinematic volumetric lighting. Highly detailed, 'octane render' style.`;
  } else {
      // Standard 2D styles or Custom
      switch (style) {
          case "Hand-Drawn Blueprint":
              styleGuidelines = `VISUAL STYLE: Technical architectural blueprint. Dark blue background with white/light blue hand-drawn lines. Looks like a sketch on drafting paper.`;
              break;
          case "Corporate Minimal":
              styleGuidelines = `VISUAL STYLE: Clean, corporate, minimalist. White background, lots of whitespace. Use a limited, professional color palette (greys, navy blues).`;
              break;
          case "Neon Cyberpunk":
              styleGuidelines = `VISUAL STYLE: Dark mode cyberpunk. Black background with glowing neon pink, cyan, and violet lines and nodes. High contrast, futuristic look.`;
              break;
          case "Modern Data Flow":
              styleGuidelines = `VISUAL STYLE: Replicate "Androidify Data Flow" aesthetic. Light blue (#eef8fe) solid background. Colorful, flat vector icons. Smooth, bright blue curved arrows.`;
              break;
          default:
              // Handle custom style string
              if (style && style !== "Custom") {
                  styleGuidelines = `VISUAL STYLE: ${style}.`;
              } else {
                  styleGuidelines = `VISUAL STYLE: Replicate "Androidify Data Flow" aesthetic. Light blue (#eef8fe) solid background. Colorful, flat vector icons. Smooth, bright blue curved arrows.`;
              }
              break;
      }
      dimensionPrompt = "Perspective: Clean 2D flat diagrammatic view straight-on. No 3D effects.";
  }

  const baseStylePrompt = `
  STRICT VISUAL STYLE GUIDELINES:
  ${styleGuidelines}
  - LAYOUT: Distinct Left-to-Right flow.
  - CENTRAL CONTAINER: Group core logic inside a clearly defined central area.
  - ICONS: Use relevant technical icons (databases, servers, code files, users).
  - TYPOGRAPHY: Highly readable technical font. Text MUST be in ${language}.
  `;

  const prompt = `Create a highly detailed technical logical data flow diagram infographic for GitHub repository : "${repoName}".
  
  ${baseStylePrompt}
  ${dimensionPrompt}
  
  Repository Context: ${limitedTree}...
  
  Diagram Content Requirements:
  1. Title exactly: "${repoName} Data Flow" (Translated to ${language} if not English)
  2. Visually map the likely data flow based on the provided file structure.
  3. Ensure the "Input -> Processing -> Output" structure is clear.
  4. Add short, clear text labels to connecting arrows indicating data type (e.g., "JSON", "Auth Token").
  5. IMPORTANT: All text labels and explanations in the image must be written in ${language}.
  `;

  const cacheKey = createCacheKey('infographic', repoName, style, String(is3D), language);
  const cached = apiCache.get<string>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, () => withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(IMAGE_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            apiCache.set(cacheKey, part.inlineData.data, IMAGE_CACHE_TTL);
            return part.inlineData.data;
          }
        }
      }
      return null;
    });
  })).catch((error: any) => {
    console.error("Gemini infographic generation failed:", error);
    
    const errorMsg = (error.message || error.toString()).toLowerCase();
    let userMessage = "Failed to generate visual. Please try again.";

    if (error.message?.includes("Rate Limit Active")) {
        throw error;
    } else if (errorMsg.includes("403") || errorMsg.includes("permission denied")) {
        userMessage = "Access Denied: API key permissions issue. Please check your Gemini API key in Settings.";
    } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        userMessage = "Model Not Found: The AI model is not available. Your API key may not have access to this model.";
    } else if (errorMsg.includes("429") || errorMsg.includes("too many requests") || errorMsg.includes("rate limit")) {
        userMessage = "Rate Limit Exceeded: Please wait a moment before trying again.";
    } else if (errorMsg.includes("quota") || errorMsg.includes("resource exhausted")) {
        userMessage = "API Quota Exceeded: Your Gemini API key has reached its usage limit. Please check your billing at ai.google.dev.";
    } else if (errorMsg.includes("safety")) {
        userMessage = "Safety Block: The content generation was blocked by safety filters. Please try a different repository or style.";
    } else if (errorMsg.includes("500") || errorMsg.includes("internal")) {
        userMessage = "Service Error: AI service is temporarily unavailable. Please try again later.";
    } else if (errorMsg.includes("api key") || errorMsg.includes("invalid key") || errorMsg.includes("api_key")) {
        userMessage = "Invalid API Key: Please check your Gemini API key in Settings.";
    }

    throw new Error(userMessage);
  });
}

/**
 * Generates a visual dependency graph/tree showing all project dependencies.
 * 
 * @param repoName - Name of the repository.
 * @param dependencies - Array of parsed dependencies.
 * @param ecosystem - Package ecosystem (npm, pip, cargo, go).
 * @returns Promise resolving to base64 image data string or null.
 */
export async function generateDependencyGraph(
  repoName: string,
  dependencies: DependencyInfo[],
  ecosystem: string
): Promise<string | null> {
  // Group dependencies by type
  const prodDeps = dependencies.filter(d => d.type === 'production');
  const devDeps = dependencies.filter(d => d.type === 'development');
  const peerDeps = dependencies.filter(d => d.type === 'peer');
  const criticalDeps = dependencies.filter(d => d.securityAlert?.severity === 'critical' || d.securityAlert?.severity === 'high');
  
  const formatDeps = (deps: DependencyInfo[]) => 
    deps.slice(0, 30).map(d => `${d.name}@${d.version}`).join(', ');

  const prompt = `Create a professional DEPENDENCY TREE VISUALIZATION for the "${repoName}" project.

PACKAGE ECOSYSTEM: ${ecosystem.toUpperCase()} (${ecosystem === 'npm' ? 'Node.js/JavaScript' : ecosystem === 'pip' ? 'Python' : ecosystem === 'cargo' ? 'Rust' : 'Go'})

VISUAL STYLE:
- Dark mode with deep navy/black background (#0f172a)
- Modern glassmorphism design with subtle gradients
- Use a radial tree or hierarchical layout with the project at center
- Color coding: Green for production deps, Blue for dev deps, Orange for peer deps, Red glow for security alerts
- Each node should show package name and version badge

PRODUCTION DEPENDENCIES (${prodDeps.length}):
${formatDeps(prodDeps) || 'None'}

DEVELOPMENT DEPENDENCIES (${devDeps.length}):
${formatDeps(devDeps) || 'None'}

${peerDeps.length > 0 ? `PEER DEPENDENCIES (${peerDeps.length}):
${formatDeps(peerDeps)}` : ''}

${criticalDeps.length > 0 ? `SECURITY ALERTS (${criticalDeps.length} packages with known vulnerabilities):
${criticalDeps.map(d => `${d.name} - ${d.securityAlert?.severity?.toUpperCase()}: ${d.securityAlert?.description}`).join('\n')}` : ''}

LAYOUT REQUIREMENTS:
1. Project name "${repoName}" prominently at the center or top
2. Dependencies radiate outward grouped by type
3. Version numbers displayed as small badges
4. Clear visual separation between dependency types
5. Legend showing color meanings
6. Total dependency count displayed
7. If security alerts exist, highlight those packages with warning indicators`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(IMAGE_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    });
  } catch (error: any) {
    console.error("Gemini dependency graph generation failed:", error);
    throw new Error("Failed to generate dependency visualization. Please try again.");
  }
}

/**
 * Analyzes dependencies for potential security vulnerabilities and outdated packages.
 * Uses Gemini to provide intelligent analysis based on known vulnerability patterns.
 */
export async function analyzeDependencies(
  dependencies: DependencyInfo[],
  ecosystem: string
): Promise<{ analyzed: DependencyInfo[]; summary: string }> {
  const depsString = dependencies.map(d => `${d.name}@${d.version} (${d.type})`).join('\n');
  
  const prompt = `Analyze these ${ecosystem} dependencies for potential security concerns:

${depsString}

For each dependency, provide a JSON response with this structure:
{
  "analyzed": [
    {
      "name": "package-name",
      "riskLevel": "critical|high|medium|low|safe",
      "note": "Brief note if there's a known issue, empty string if safe"
    }
  ],
  "summary": "Overall 2-3 sentence summary of the dependency health"
}

Consider:
- Known CVEs in popular packages
- Outdated versions with known issues  
- Deprecated packages
- Packages with security history

Return ONLY valid JSON, no markdown.`;

  try {
    const client = await ensureAiClient();
    const response = await withModelFallback(TEXT_MODELS, async (model) => {
      return await client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      });
    });

    const text = response.text?.trim() || '{}';
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const result = JSON.parse(jsonStr);
      
      // Merge analysis back into dependencies
      const analyzedDeps = dependencies.map(dep => {
        const analysis = result.analyzed?.find((a: any) => a.name === dep.name);
        if (analysis && analysis.riskLevel !== 'safe' && analysis.note) {
          return {
            ...dep,
            securityAlert: {
              severity: analysis.riskLevel as 'critical' | 'high' | 'medium' | 'low',
              description: analysis.note
            }
          };
        }
        return dep;
      });
      
      return {
        analyzed: analyzedDeps,
        summary: result.summary || `Analyzed ${dependencies.length} dependencies in ${ecosystem} ecosystem.`
      };
    } catch {
      return {
        analyzed: dependencies,
        summary: `Found ${dependencies.length} dependencies. Security analysis unavailable.`
      };
    }
  } catch (error) {
    console.error("Dependency analysis failed:", error);
    return {
      analyzed: dependencies,
      summary: `Found ${dependencies.length} dependencies. Security analysis unavailable.`
    };
  }
}

/**
 * Converts a raster image of an infographic into SVG code using an LLM.
 * 
 * @param base64Image - Base64 string of the image.
 * @param promptContext - Context description of what the image contains.
 * @returns Promise resolving to SVG code string.
 */
export async function vectorizeInfographic(base64Image: string, promptContext: string): Promise<string | null> {
  const prompt = `Analyze the attached infographic image. It is a technical diagram for: "${promptContext}".
  
  TASK: Recreate this infographic as a clean, high-quality, professional SVG file.
  
  REQUIREMENTS:
  1. The SVG must be responsive (use viewBox, not fixed width/height).
  2. Maintain all structural connections and text labels from the original image.
  3. Use clean vector paths and professional gradients for a modern look.
  4. Preserve the color scheme and layout.
  5. Ensure all text is rendered as <text> elements for accessibility and scaling.
  6. Output ONLY valid SVG code. No explanations, no markdown blocks.`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Image
              }
            },
            { text: prompt }
          ]
        },
        config: {
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });

      let svgText = response.text || "";
      svgText = svgText.replace(/^```svg\n/, '').replace(/^```xml\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
      return svgText.trim();
    });
  } catch (error) {
    console.error("Gemini vectorization failed:", error);
    throw error;
  }
}

/**
 * Answers questions about the repo architecture based on the visual diagram.
 */
export async function askRepoQuestion(question: string, infographicBase64: string, fileTree: RepoFileTree[]): Promise<string> {
  const limitedTree = fileTree.slice(0, 300).map(f => f.path).join('\n');
  
  const prompt = `You are a senior software architect reviewing a project.
  
  Attached is an architectural infographic of the project.
  Here is the actual file structure of the repository:
  ${limitedTree}
  
  User Question: "${question}"
  
  Using BOTH the visual infographic and the file structure as context, answer the user's question. 
  If they ask about optimization, suggest specific areas based on the likely bottlenecks visible in standard architectures like this.
  Keep answers concise, technical, and helpful.`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: infographicBase64
              }
            },
            { text: prompt }
          ]
        }
      });

      return response.text || "I couldn't generate an answer at this time.";
    });
  } catch (error) {
    console.error("Gemini Q&A failed:", error);
    throw error;
  }
}

/**
 * Answers questions about a specific node (file/component) in the dependency graph.
 * Uses persona-based system instructions.
 * 
 * @param nodeLabel - Name of the selected node.
 * @param question - User's question.
 * @param fileTree - Full file tree context.
 * @param fileContent - Optional content of the selected file.
 * @param persona - Active persona ID for response tone/focus.
 */
export async function askNodeSpecificQuestion(
  nodeLabel: string, 
  question: string, 
  fileTree: RepoFileTree[],
  fileContent?: string,
  persona: string = "Senior Software Architect"
): Promise<string> {
  const limitedTree = fileTree.slice(0, 300).map(f => f.path).join('\n');
  
  let contentContext = "";
  if (fileContent) {
      contentContext = `\n\nCONTENT OF FILE "${nodeLabel}":\n\`\`\`\n${fileContent.slice(0, 15000)}\n\`\`\`\n(Truncated if too long)`;
  }

  // Construct system instruction based on persona
  let systemInstruction = `You are an expert ${persona}. `;
  if (persona.includes("Security")) {
      systemInstruction += "Focus heavily on vulnerabilities, data validation, auth logic, and potential exploits. Be paranoid but constructive.";
  } else if (persona.includes("Product")) {
      systemInstruction += "Focus on user value, feature feasibility, and user flow. Avoid overly deep technical jargon unless necessary.";
  } else if (persona.includes("Junior")) {
      systemInstruction += "Explain concepts simply (ELI5). Use analogies. Focus on learning and growth.";
  } else if (persona.includes("Architect")) {
      systemInstruction += "Focus on scalability, maintainability, design patterns, and clean code.";
  } else {
      systemInstruction += "Focus on code quality and best practices.";
  }

  const prompt = `
  The user is asking about a specific node in the dependency graph labeled: "${nodeLabel}".
  
  Repository File Structure Context (first 300 files):
  ${limitedTree}
  ${contentContext}
  
  User Question: "${question}"
  
  Based on the node name "${nodeLabel}" ${fileContent ? "and its actual content" : "and the file structure"}, explain what this component likely does and answer the question.
  Keep the response aligned with your persona: ${persona}.`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: {
            systemInstruction: systemInstruction
        }
      });

      return response.text || "I couldn't generate an answer at this time.";
    });
  } catch (error) {
    console.error("Gemini Node Q&A failed:", error);
    throw error;
  }
}

export interface CodeReviewIssue {
  severity: 'critical' | 'warning' | 'info' | 'suggestion';
  category: string;
  line?: number;
  title: string;
  description: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  summary: string;
  overallScore: number;
  issues: CodeReviewIssue[];
  strengths: string[];
  recommendations: string[];
}

/**
 * Performs AI code review analyzing quality, security, and performance.
 */
export async function performCodeReview(
  nodeLabel: string,
  fileTree: RepoFileTree[],
  fileContent?: string
): Promise<CodeReviewResult> {
  const limitedTree = fileTree.slice(0, 200).map(f => f.path).join('\n');

  const prompt = `You are a Senior Code Reviewer conducting a comprehensive code review.

${fileContent ? `FILE: "${nodeLabel}"\n\`\`\`\n${fileContent.slice(0, 20000)}\n\`\`\`` : `Analyzing component: "${nodeLabel}" in context of project structure:\n${limitedTree}`}

Perform a thorough code review covering:
1. Code quality and readability
2. Security vulnerabilities (injection, XSS, auth issues, etc.)
3. Performance concerns
4. Best practice violations
5. Potential bugs and edge cases

Return as JSON in this exact format:
{
  "summary": "Brief overall assessment",
  "overallScore": 85,
  "issues": [
    {
      "severity": "critical|warning|info|suggestion",
      "category": "Security|Performance|Quality|Bug|Style",
      "line": 42,
      "title": "Issue title",
      "description": "Detailed explanation",
      "suggestion": "How to fix it"
    }
  ],
  "strengths": ["Good aspect 1", "Good aspect 2"],
  "recommendations": ["High-level improvement 1", "High-level improvement 2"]
}

Return ONLY the JSON, no markdown.`;

  const treeHash = fileTree.slice(0, 20).map(f => f.path).join(',');
  const cacheKey = createCacheKey('codeReview', nodeLabel, treeHash, fileContent?.slice(0, 200) || '');
  const cached = apiCache.get<CodeReviewResult>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, () => withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      });

      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

      try {
        const result = JSON.parse(text) as CodeReviewResult;
        apiCache.set(cacheKey, result, CACHE_TTL);
        return result;
      } catch {
        const fallback = {
          summary: text,
          overallScore: 0,
          issues: [],
          strengths: [],
          recommendations: []
        };
        apiCache.set(cacheKey, fallback, CACHE_TTL);
        return fallback;
      }
    });
  })).catch((e) => {
    console.error("Code review failed", e);
    throw e;
  });
}

export interface TestCase {
  name: string;
  type: 'unit' | 'integration' | 'edge';
  description: string;
  code: string;
  assertions: string[];
}

export interface TestGenerationResult {
  framework: string;
  setup: string;
  testCases: TestCase[];
  edgeCases: string[];
  coverageNotes: string;
}

/**
 * Generates test cases and edge cases for code.
 */
export async function generateTestCases(
  nodeLabel: string,
  fileTree: RepoFileTree[],
  fileContent?: string
): Promise<TestGenerationResult> {
  const limitedTree = fileTree.slice(0, 150).map(f => f.path).join('\n');

  const prompt = `You are a QA Engineer and Test Automation Expert.

${fileContent ? `FILE: "${nodeLabel}"\n\`\`\`\n${fileContent.slice(0, 15000)}\n\`\`\`` : `Analyzing component: "${nodeLabel}" in context:\n${limitedTree}`}

Generate comprehensive test cases including:
1. Unit tests for individual functions/methods
2. Integration tests for component interactions
3. Edge cases that could cause failures
4. Boundary value tests
5. Error handling tests

Return as JSON:
{
  "framework": "Jest/Vitest recommended",
  "setup": "Test setup code (imports, mocks, etc.)",
  "testCases": [
    {
      "name": "should handle valid input correctly",
      "type": "unit|integration|edge",
      "description": "What this test verifies",
      "code": "test('should...', () => { ... })",
      "assertions": ["Expected behavior 1", "Expected behavior 2"]
    }
  ],
  "edgeCases": [
    "Edge case description 1",
    "Edge case description 2"
  ],
  "coverageNotes": "Notes on achieving good coverage"
}

Return ONLY the JSON, no markdown.`;

  const treeHash = fileTree.slice(0, 20).map(f => f.path).join(',');
  const cacheKey = createCacheKey('testGen', nodeLabel, treeHash, fileContent?.slice(0, 200) || '');
  const cached = apiCache.get<TestGenerationResult>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, () => withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      });

      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

      try {
        const result = JSON.parse(text) as TestGenerationResult;
        apiCache.set(cacheKey, result, CACHE_TTL);
        return result;
      } catch {
        const fallback = {
          framework: "Unknown",
          setup: "",
          testCases: [],
          edgeCases: [],
          coverageNotes: text
        };
        apiCache.set(cacheKey, fallback, CACHE_TTL);
        return fallback;
      }
    });
  })).catch((e) => {
    console.error("Test generation failed", e);
    throw e;
  });
}

export interface DocumentationResult {
  moduleDoc: string;
  functions: Array<{
    name: string;
    jsdoc: string;
    params: Array<{ name: string; type: string; description: string }>;
    returns: { type: string; description: string };
  }>;
  usageExamples: string[];
  notes: string;
}

/**
 * Generates documentation for code files.
 */
export async function generateDocumentation(
  nodeLabel: string,
  fileTree: RepoFileTree[],
  fileContent?: string
): Promise<DocumentationResult> {

  const prompt = `You are a Technical Writer creating comprehensive documentation.

${fileContent ? `FILE: "${nodeLabel}"\n\`\`\`\n${fileContent.slice(0, 18000)}\n\`\`\`` : `Create documentation for: "${nodeLabel}"`}

Generate complete documentation including:
1. Module/file description
2. JSDoc/docstrings for each function/method
3. Parameter descriptions with types
4. Return value documentation
5. Usage examples

Return as JSON:
{
  "moduleDoc": "Module-level documentation describing purpose and usage",
  "functions": [
    {
      "name": "functionName",
      "jsdoc": "/**\n * Full JSDoc comment\n * @param {Type} param - Description\n * @returns {Type} Description\n */",
      "params": [
        { "name": "param1", "type": "string", "description": "What it does" }
      ],
      "returns": { "type": "boolean", "description": "What it returns" }
    }
  ],
  "usageExamples": [
    "// Example 1\nimport { func } from './module';\nfunc('test');",
    "// Example 2\n..."
  ],
  "notes": "Additional notes about the module"
}

Return ONLY the JSON, no markdown.`;

  const treeHash = fileTree.slice(0, 20).map(f => f.path).join(',');
  const cacheKey = createCacheKey('docs', nodeLabel, treeHash, fileContent?.slice(0, 200) || '');
  const cached = apiCache.get<DocumentationResult>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, () => withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      });

      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

      try {
        const result = JSON.parse(text) as DocumentationResult;
        apiCache.set(cacheKey, result, CACHE_TTL);
        return result;
      } catch {
        const fallback = {
          moduleDoc: text,
          functions: [],
          usageExamples: [],
          notes: ""
        };
        apiCache.set(cacheKey, fallback, CACHE_TTL);
        return fallback;
      }
    });
  })).catch((e) => {
    console.error("Documentation generation failed", e);
    throw e;
  });
}

export interface GapAnalysisResult {
  gaps: Array<{
    type: 'missing_logic' | 'error_handling' | 'edge_case' | 'validation' | 'security';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location?: string;
    recommendation: string;
  }>;
  bottlenecks: Array<{
    type: 'performance' | 'scalability' | 'resource' | 'dependency';
    title: string;
    impact: string;
    mitigation: string;
  }>;
  unknowns: Array<{
    area: string;
    concern: string;
    investigationNeeded: string;
  }>;
  overallRisk: 'low' | 'medium' | 'high';
  summary: string;
}

/**
 * Identifies gaps, bottlenecks, and unknown unknowns in code.
 */
export async function analyzeGapsAndBottlenecks(
  nodeLabel: string,
  fileTree: RepoFileTree[],
  fileContent?: string
): Promise<GapAnalysisResult> {
  const limitedTree = fileTree.slice(0, 200).map(f => f.path).join('\n');

  const prompt = `You are a Principal Engineer with expertise in identifying architectural gaps and potential issues.

${fileContent ? `FILE: "${nodeLabel}"\n\`\`\`\n${fileContent.slice(0, 18000)}\n\`\`\`` : `Analyzing: "${nodeLabel}" in context:\n${limitedTree}`}

Perform deep analysis to identify:

1. GAPS (Missing Logic):
   - Missing error handling
   - Unhandled edge cases
   - Missing input validation
   - Missing security checks
   - Incomplete implementations

2. BOTTLENECKS:
   - Performance bottlenecks (N+1 queries, expensive loops, etc.)
   - Scalability concerns
   - Resource usage issues
   - Blocking operations
   - Dependency bottlenecks

3. UNKNOWN UNKNOWNS:
   - Potential blind spots
   - Areas that need investigation
   - Assumptions that might be wrong
   - External factors not accounted for

Return as JSON:
{
  "gaps": [
    {
      "type": "missing_logic|error_handling|edge_case|validation|security",
      "severity": "high|medium|low",
      "title": "Gap title",
      "description": "What's missing",
      "location": "function name or area",
      "recommendation": "How to address"
    }
  ],
  "bottlenecks": [
    {
      "type": "performance|scalability|resource|dependency",
      "title": "Bottleneck title",
      "impact": "Potential impact",
      "mitigation": "How to fix"
    }
  ],
  "unknowns": [
    {
      "area": "Area of concern",
      "concern": "What could go wrong",
      "investigationNeeded": "What to look into"
    }
  ],
  "overallRisk": "low|medium|high",
  "summary": "Overall assessment"
}

Return ONLY the JSON, no markdown.`;

  const treeHash = fileTree.slice(0, 20).map(f => f.path).join(',');
  const cacheKey = createCacheKey('gaps', nodeLabel, treeHash, fileContent?.slice(0, 200) || '');
  const cached = apiCache.get<GapAnalysisResult>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, () => withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      });

      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

      try {
        const result = JSON.parse(text) as GapAnalysisResult;
        apiCache.set(cacheKey, result, CACHE_TTL);
        return result;
      } catch {
        const fallback: GapAnalysisResult = {
          gaps: [],
          bottlenecks: [],
          unknowns: [],
          overallRisk: 'medium',
          summary: text
        };
        apiCache.set(cacheKey, fallback, CACHE_TTL);
        return fallback;
      }
    });
  })).catch((e) => {
    console.error("Gap analysis failed", e);
    throw e;
  });
}

/**
 * Generates an infographic from a web article URL.
 */
export async function generateArticleInfographic(
  url: string, 
  style: string, 
  onProgress?: (stage: string) => void,
  language: string = "English"
): Promise<InfographicResult> {
    if (onProgress) onProgress("RESEARCHING & ANALYZING CONTENT...");
    
    let structuralSummary = "";
    let citations: Citation[] = [];

    try {
        const analysisPrompt = `You are an expert Information Designer. Your goal is to extract the essential structure from a web page to create a clear, educational infographic.

        Analyze the content at this URL: ${url}
        
        TARGET LANGUAGE: ${language}.
        
        Provide a structured breakdown specifically designed for visual representation in ${language}:
        1. INFOGRAPHIC HEADLINE: The core topic in 5 words or less (in ${language}).
        2. KEY TAKEAWAYS: The 3 to 5 most important distinct points, steps, or facts (in ${language}). THESE WILL BE THE MAIN SECTIONS OF THE IMAGE.
        3. SUPPORTING DATA: Any specific numbers, percentages, or very short quotes that add credibility.
        4. VISUAL METAPHOR IDEA: Suggest ONE simple visual concept that best fits this content (e.g., "a roadmap with milestones", "a funnel", "three contrasting pillars", "a circular flowchart").
        
        Keep the output concise and focused purely on what should be ON the infographic. Ensure all content is in ${language}.`;

        const client = await ensureAiClient();
        const analysisResponse = await withModelFallback(TEXT_MODELS, async (model) => {
            return await client.models.generateContent({
                model,
                contents: analysisPrompt,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });
        });
        structuralSummary = analysisResponse.text || "";

        const chunks = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    citations.push({
                        uri: chunk.web.uri,
                        title: chunk.web.title || ""
                    });
                }
            });
            const uniqueCitations = new Map();
            citations.forEach(c => uniqueCitations.set(c.uri, c));
            citations = Array.from(uniqueCitations.values());
        }

    } catch (e) {
        console.warn("Content analysis failed, falling back to direct URL prompt", e);
        structuralSummary = `Create an infographic about: ${url}. Translate text to ${language}.`;
    }

    if (onProgress) onProgress("DESIGNING & RENDERING INFOGRAPHIC...");

    let styleGuidelines = "";
    switch (style) {
        case "Fun & Playful":
            styleGuidelines = `STYLE: Fun, playful, vibrant 2D vector illustrations. Use bright colors, rounded shapes, and a friendly tone.`;
            break;
        case "Clean Minimalist":
            styleGuidelines = `STYLE: Ultra-minimalist. Lots of whitespace, thin lines, limited color palette (1-2 accent colors max). Very sophisticated and airy.`;
            break;
        case "Dark Mode Tech":
            styleGuidelines = `STYLE: Dark mode technical aesthetic. Dark slate/black background with bright, glowing accent colors (cyan, lime green) for data points.`;
            break;
        case "Modern Editorial":
            styleGuidelines = `STYLE: Modern, flat vector illustration style. Clean, professional, and editorial (like a high-end tech magazine). Cohesive, mature color palette.`;
            break;
        default:
             if (style && style !== "Custom") {
                styleGuidelines = `STYLE: Custom User Style: "${style}".`;
             } else {
                styleGuidelines = `STYLE: Modern, flat vector illustration style. Clean, professional, and editorial (like a high-end tech magazine). Cohesive, mature color palette.`;
             }
            break;
    }

    const imagePrompt = `Create a professional, high-quality educational infographic based strictly on this structured content plan:

    ${structuralSummary}

    VISUAL DESIGN RULES:
    - ${styleGuidelines}
    - LANGUAGE: The text within the infographic MUST be written in ${language}.
    - LAYOUT: MUST follow the "VISUAL METAPHOR IDEA" from the plan above if one was provided.
    - TYPOGRAPHY: Clean, highly readable sans-serif fonts. The "INFOGRAPHIC HEADLINE" must be prominent at the top.
    - CONTENT: Use the actual text from "KEY TAKEAWAYS" in the image. Do not use placeholder text like Lorem Ipsum.
    - GOAL: The image must be informative and readable as a standalone graphic.
    `;

    const imageData = await withSmartRetry(async () => {
        const client = await ensureAiClient();
        return withModelFallback(IMAGE_MODELS, async (model) => {
            const response = await client.models.generateContent({
                model,
                contents: {
                    parts: [{ text: imagePrompt }],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const parts = response.candidates?.[0]?.content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return part.inlineData.data;
                    }
                }
            }
            return null;
        });
    });
    return { imageData, citations };
}

/**
 * Generates a comparison infographic from multiple source URLs.
 * Highlights similarities, differences, and key insights across sources.
 */
export async function generateComparisonInfographic(
  urls: string[],
  style: string,
  onProgress?: (stage: string) => void,
  language: string = "English"
): Promise<InfographicResult> {
  if (onProgress) onProgress("ANALYZING MULTIPLE SOURCES...");
  
  let comparisonSummary = "";
  let citations: Citation[] = [];
  
  try {
    const analysisPrompt = `You are an expert Comparative Analyst. Your goal is to compare and contrast content from multiple web pages.

    Analyze the content at these URLs:
    ${urls.map((url, i) => `Source ${i + 1}: ${url}`).join('\n')}
    
    TARGET LANGUAGE: ${language}.
    
    Provide a structured comparison specifically designed for visual representation in ${language}:
    
    1. COMPARISON HEADLINE: A concise title that captures what's being compared (in ${language}).
    
    2. SOURCE SUMMARIES: For each source, provide:
       - Source name/identifier
       - 2-3 key claims or points
       - Main perspective or angle
    
    3. SIMILARITIES: 2-3 points where the sources agree or overlap.
    
    4. DIFFERENCES: 2-3 key points of disagreement or different approaches.
    
    5. KEY INSIGHTS: 2-3 unique insights that emerge from comparing these sources.
    
    6. VISUAL SUGGESTION: Best way to visualize this comparison (e.g., "side-by-side columns", "Venn diagram", "comparison table", "pros/cons layout").
    
    Keep the output concise and focused purely on what should be ON the infographic. Ensure all content is in ${language}.`;

    const client = await ensureAiClient();
    const analysisResponse = await withModelFallback(TEXT_MODELS, async (model) => {
      return await client.models.generateContent({
        model,
        contents: analysisPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
    });
    comparisonSummary = analysisResponse.text || "";

    const chunks = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          citations.push({
            uri: chunk.web.uri,
            title: chunk.web.title || ""
          });
        }
      });
      const uniqueCitations = new Map();
      citations.forEach(c => uniqueCitations.set(c.uri, c));
      citations = Array.from(uniqueCitations.values());
    }

  } catch (e) {
    console.warn("Multi-source analysis failed, falling back to direct prompt", e);
    comparisonSummary = `Create a comparison infographic for these sources: ${urls.join(' vs ')}. Translate text to ${language}.`;
  }

  if (onProgress) onProgress("DESIGNING COMPARISON VISUAL...");

  let styleGuidelines = "";
  switch (style) {
    case "Fun & Playful":
      styleGuidelines = `STYLE: Fun, playful, vibrant 2D vector illustrations. Use bright colors, rounded shapes. Use distinct colors for each source.`;
      break;
    case "Clean Minimalist":
      styleGuidelines = `STYLE: Ultra-minimalist. Lots of whitespace, thin lines, limited color palette. Clear visual separation between sources.`;
      break;
    case "Dark Mode Tech":
      styleGuidelines = `STYLE: Dark mode technical aesthetic. Dark background with bright accent colors. Neon highlights for key differences.`;
      break;
    case "Modern Editorial":
    default:
      styleGuidelines = `STYLE: Modern, flat vector illustration style. Clean, professional editorial look with distinct colors per source.`;
      break;
  }

  const imagePrompt = `Create a professional COMPARISON INFOGRAPHIC based on this analysis:

  ${comparisonSummary}

  VISUAL DESIGN RULES:
  - ${styleGuidelines}
  - LANGUAGE: All text MUST be in ${language}.
  - LAYOUT: Follow the "VISUAL SUGGESTION" from the analysis. If not provided, use a side-by-side or table comparison layout.
  - EACH SOURCE: Give each source a distinct color or section.
  - HIGHLIGHTS: Use visual emphasis (icons, colors, boxes) for SIMILARITIES and DIFFERENCES.
  - CLARITY: Make it immediately clear what's being compared and how they differ.
  - TYPOGRAPHY: Clean, highly readable sans-serif fonts.
  `;

  const imageData = await withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(IMAGE_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    });
  });
  return { imageData, citations };
}

/**
 * Extracts key statistics and numerical data from an article URL.
 * Returns structured stats for visual display and generates a stats-focused infographic.
 */
export async function extractKeyStats(
  url: string,
  style: string,
  onProgress?: (stage: string) => void,
  language: string = "English"
): Promise<{ 
  imageData: string | null; 
  citations: Citation[];
  stats: { stat: string; value: string; context: string }[];
}> {
  if (onProgress) onProgress("SCANNING FOR KEY STATISTICS...");
  
  let statsData: { stat: string; value: string; context: string }[] = [];
  let citations: Citation[] = [];
  
  try {
    const analysisPrompt = `You are a Data Analyst specializing in extracting key statistics and numbers from content.

    Analyze the content at this URL: ${url}
    
    TARGET LANGUAGE: ${language}.
    
    Extract ALL significant numbers, percentages, statistics, and quantifiable data:
    
    Return as a JSON object with this structure:
    {
      "headline": "Main topic of the data (in ${language})",
      "stats": [
        {
          "stat": "What is being measured (in ${language})",
          "value": "The numerical value with units",
          "context": "Brief explanation of significance (in ${language})"
        }
      ],
      "trend": "Overall trend or conclusion from the data (in ${language})"
    }
    
    Include at minimum 3 statistics, maximum 8. Prioritize the most impactful numbers.
    Return ONLY valid JSON, no markdown.`;

    const client = await ensureAiClient();
    const analysisResponse = await withModelFallback(TEXT_MODELS, async (model) => {
      return await client.models.generateContent({
        model,
        contents: analysisPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
    });
    
    const responseText = analysisResponse.text || "{}";
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const parsed = JSON.parse(jsonStr);
      statsData = parsed.stats || [];
    } catch {
      console.warn("Failed to parse stats JSON");
    }

    const chunks = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          citations.push({
            uri: chunk.web.uri,
            title: chunk.web.title || ""
          });
        }
      });
      const uniqueCitations = new Map();
      citations.forEach(c => uniqueCitations.set(c.uri, c));
      citations = Array.from(uniqueCitations.values());
    }

  } catch (e) {
    console.warn("Stats extraction failed", e);
  }

  if (onProgress) onProgress("GENERATING STATS VISUALIZATION...");

  const statsString = statsData.map(s => `${s.stat}: ${s.value} - ${s.context}`).join('\n');
  
  let styleGuidelines = "";
  switch (style) {
    case "Fun & Playful":
      styleGuidelines = `STYLE: Fun, colorful data visualization. Use bright colors, icons, and playful charts.`;
      break;
    case "Clean Minimalist":
      styleGuidelines = `STYLE: Clean, minimal data visualization. Focus on the numbers with ample whitespace.`;
      break;
    case "Dark Mode Tech":
      styleGuidelines = `STYLE: Dark tech dashboard aesthetic. Glowing numbers, neon accent colors, dark background.`;
      break;
    case "Modern Editorial":
    default:
      styleGuidelines = `STYLE: Modern editorial data visualization. Professional, clean, with clear data hierarchy.`;
      break;
  }

  const imagePrompt = `Create a DATA-FOCUSED INFOGRAPHIC showcasing these key statistics:

  ${statsString}

  VISUAL DESIGN RULES:
  - ${styleGuidelines}
  - LANGUAGE: All text MUST be in ${language}.
  - LAYOUT: Use a stats dashboard or data card layout.
  - NUMBERS: Make numerical values VERY LARGE and prominent - they are the stars.
  - ICONS: Use relevant icons next to each statistic.
  - HIERARCHY: Most important stat should be largest/most prominent.
  - COLORS: Use color coding to group related stats or show positive/negative trends.
  - DATA VISUALIZATION: If appropriate, include small charts, gauges, or progress bars.
  `;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(IMAGE_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      let imageData = null;
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data;
            break;
          }
        }
      }
      return { imageData, citations, stats: statsData };
    });
  } catch (error) {
    console.error("Stats infographic generation failed:", error);
    throw error;
  }
}

/**
 * Suggests tasks for the project based on repo structure.
 */
export async function suggestProjectTasks(repoName: string, fileTree: RepoFileTree[]): Promise<Task[]> {
  const limitedTree = fileTree.slice(0, 300).map(f => f.path).join('\n');

  const prompt = `You are a Technical Project Manager.
  
  Based on the file structure of the repository "${repoName}", identify 3-5 critical technical tasks, refactoring opportunities, or missing configurations that a developer should address.
  
  File Structure:
  ${limitedTree}
  
  Return the tasks as a JSON array where each object has:
  - title: string (concise task name)
  - priority: "high" | "medium" | "low"
  - dueDate: string (YYYY-MM-DD, assume today is ${new Date().toISOString().split('T')[0]} and set reasonable deadlines)
  
  Do not include markdown formatting, just the JSON array.`;

  try {
    const client = await ensureAiClient();
    const response = await withModelFallback(TEXT_MODELS, async (model) => {
      return await client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                dueDate: { type: Type.STRING }
              },
              required: ["title", "priority", "dueDate"]
            }
          }
        }
      });
    });

    const tasks = JSON.parse(response.text || "[]");
    return tasks.map((t: any, index: number) => ({
      id: `ai-gen-${Date.now()}-${index}`,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      completed: false,
      createdAt: Date.now()
    }));
  } catch (error) {
    console.error("Task suggestion failed:", error);
    return [];
  }
}

/**
 * Uses Generative AI to apply style transfer or edits to an image.
 */
export async function editImageWithGemini(base64Data: string, mimeType: string, prompt: string): Promise<string | null> {
  return withSmartRetry(async () => {
    const client = await ensureAiClient();
    return withModelFallback(IMAGE_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    });
  });
}

/**
 * Converts a UI wireframe image into React/Tailwind code.
 */
export async function generateCodeFromImage(base64Image: string, prompt: string): Promise<string | null> {
   const fullPrompt = `
   You are an expert Frontend Developer specializing in React and Tailwind CSS.
   
   Analyze the attached UI wireframe/screenshot.
   
   TASK: Write the React code to implement this UI.
   - Use Tailwind CSS for styling.
   - Use Lucide React for icons if needed (imports from 'lucide-react').
   - Component should be functional and responsive.
   - Return ONLY the code, no markdown formatting.
   
   User specific request: ${prompt}
   `;

   return withSmartRetry(async () => {
     const client = await ensureAiClient();
     return withModelFallback(TEXT_MODELS, async (model) => {
       const response = await client.models.generateContent({
         model,
         contents: {
           parts: [
             { inlineData: { mimeType: 'image/png', data: base64Image } },
             { text: fullPrompt }
           ]
         }
       });
       
       let code = response.text || "";
       code = code.replace(/^```tsx?\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
       return code;
     });
   });
}

export interface ComponentInfo {
  name: string;
  category: string;
  description: string;
  props: string[];
  code: string;
}

export interface ComponentLibraryResult {
  components: ComponentInfo[];
  summary: string;
  designTokens: {
    colors: string[];
    typography: string[];
    spacing: string[];
  };
}

/**
 * Scans a UI screenshot and extracts reusable UI component patterns.
 */
export async function scanComponentLibrary(base64Image: string): Promise<ComponentLibraryResult> {
  const prompt = `You are an expert UI/UX Engineer and React specialist.

Analyze the attached UI screenshot and identify ALL reusable UI components/patterns visible.

For each component found, provide:
1. A semantic component name (e.g., "PrimaryButton", "CardHeader", "NavItem")
2. Category (Button, Card, Input, Navigation, Layout, Typography, etc.)
3. Brief description of its purpose
4. Likely props it would accept
5. React/Tailwind code to implement it

Also extract design tokens:
- Colors (list hex codes or Tailwind classes used)
- Typography (font sizes, weights visible)
- Spacing patterns (padding/margin patterns)

Return as JSON in this exact format:
{
  "components": [
    {
      "name": "ComponentName",
      "category": "Category",
      "description": "What it does",
      "props": ["prop1", "prop2"],
      "code": "const ComponentName = () => { ... }"
    }
  ],
  "summary": "Brief overall analysis of the design system",
  "designTokens": {
    "colors": ["#hex1", "#hex2"],
    "typography": ["text-xl font-bold", "text-sm"],
    "spacing": ["p-4", "gap-2"]
  }
}

Return ONLY the JSON, no markdown formatting.`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt }
          ]
        }
      });
      
      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      
      try {
        return JSON.parse(text) as ComponentLibraryResult;
      } catch {
        return {
          components: [],
          summary: text,
          designTokens: { colors: [], typography: [], spacing: [] }
        };
      }
    });
  } catch (e) {
    console.error("Component library scan failed", e);
    throw e;
  }
}

export interface ResponsiveVariant {
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  description: string;
  code: string;
  notes: string;
}

export interface ResponsiveResult {
  variants: ResponsiveVariant[];
  sharedStyles: string;
  responsiveNotes: string;
}

/**
 * Generates responsive variants (mobile/tablet/desktop) from a UI screenshot.
 */
export async function generateResponsiveVariants(base64Image: string, componentName?: string): Promise<ResponsiveResult> {
  const prompt = `You are an expert Frontend Developer specializing in responsive web design.

Analyze the attached UI screenshot${componentName ? ` (Component: "${componentName}")` : ''}.

Generate responsive React/Tailwind code for 3 breakpoints:
1. MOBILE (< 640px) - Single column, stacked elements, touch-friendly
2. TABLET (640px - 1024px) - Two columns where appropriate, medium spacing
3. DESKTOP (> 1024px) - Full layout as shown or enhanced

For each variant provide:
- Tailwind responsive classes used
- Layout changes made
- Any component behavior changes

Return as JSON in this exact format:
{
  "variants": [
    {
      "breakpoint": "mobile",
      "description": "Stacked layout with hamburger menu",
      "code": "const MobileLayout = () => { ... }",
      "notes": "Collapse sidebar to drawer, stack cards vertically"
    },
    {
      "breakpoint": "tablet",
      "description": "Two-column grid layout",
      "code": "const TabletLayout = () => { ... }",
      "notes": "2-column grid, condensed navigation"
    },
    {
      "breakpoint": "desktop",
      "description": "Full multi-column layout",
      "code": "const DesktopLayout = () => { ... }",
      "notes": "Full sidebar, 3+ column grid"
    }
  ],
  "sharedStyles": "Tailwind classes common across all breakpoints",
  "responsiveNotes": "Overall responsive design recommendations"
}

Return ONLY the JSON, no markdown formatting.`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt }
          ]
        }
      });
      
      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      
      try {
        return JSON.parse(text) as ResponsiveResult;
      } catch {
        return {
          variants: [],
          sharedStyles: "",
          responsiveNotes: text
        };
      }
    });
  } catch (e) {
    console.error("Responsive variant generation failed", e);
    throw e;
  }
}

export interface DashboardFile {
  filename: string;
  type: 'component' | 'style' | 'hook' | 'util' | 'config' | 'doc';
  content: string;
  description: string;
}

export interface DashboardResult {
  name: string;
  description: string;
  files: DashboardFile[];
  documentation: string;
  features: string[];
  dependencies: string[];
}

/**
 * Generates a complete dashboard project from a UI screenshot.
 */
export async function generateDashboard(base64Image: string, requirements?: string): Promise<DashboardResult> {
  const prompt = `You are a Senior Full-Stack Developer creating a complete dashboard project.

Analyze the attached UI screenshot and generate a COMPLETE dashboard implementation.
${requirements ? `Additional Requirements: ${requirements}` : ''}

Generate a complete project with:
1. Multiple React component files (modular structure)
2. Custom hooks for data fetching/state
3. Utility functions
4. Type definitions
5. Documentation (README)

For a dashboard, include:
- Main Dashboard layout component
- Sidebar/Navigation component
- Card/Widget components
- Chart components (using Recharts/D3 patterns)
- Table/List components
- Header component

Return as JSON in this exact format:
{
  "name": "DashboardProjectName",
  "description": "What this dashboard does",
  "files": [
    {
      "filename": "components/Dashboard.tsx",
      "type": "component",
      "content": "import React from 'react'; ...",
      "description": "Main dashboard layout"
    },
    {
      "filename": "components/Sidebar.tsx",
      "type": "component",
      "content": "...",
      "description": "Navigation sidebar"
    },
    {
      "filename": "hooks/useDashboardData.ts",
      "type": "hook",
      "content": "...",
      "description": "Data fetching hook"
    },
    {
      "filename": "README.md",
      "type": "doc",
      "content": "# Dashboard\\n...",
      "description": "Project documentation"
    }
  ],
  "documentation": "Full usage guide and setup instructions",
  "features": ["Feature 1", "Feature 2"],
  "dependencies": ["recharts", "date-fns"]
}

Generate at least 5-8 files for a complete project structure.
Return ONLY the JSON, no markdown formatting.`;

  try {
    const client = await ensureAiClient();
    return await withModelFallback(TEXT_MODELS, async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt }
          ]
        }
      });
      
      let text = response.text || "{}";
      text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      
      try {
        return JSON.parse(text) as DashboardResult;
      } catch {
        return {
          name: "Dashboard",
          description: "Generated dashboard",
          files: [],
          documentation: text,
          features: [],
          dependencies: []
        };
      }
    });
  } catch (e) {
    console.error("Dashboard generation failed", e);
    throw e;
  }
}
