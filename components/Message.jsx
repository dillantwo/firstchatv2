import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import Prism from 'prismjs'
import toast from 'react-hot-toast'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'

// Separate IframeRenderer component to handle postMessage height updates
const IframeRenderer = memo(({ iframeRef, sandboxedHtmlCode, role, content, isInPinnedPanel, t }) => {
    const [iframeHeight, setIframeHeight] = useState(isInPinnedPanel ? 200 : 400);
    const localIframeRef = useRef(null);
    const actualRef = iframeRef || localIframeRef;

    useEffect(() => {
        const handleMessage = (event) => {
            // Handle height messages from the iframe
            if (event.data && event.data.type === 'iframeHeight') {
                const newHeight = Math.max(isInPinnedPanel ? 200 : 200, event.data.height);
                setIframeHeight(newHeight);
                if (actualRef.current) {
                    actualRef.current.style.height = newHeight + 'px';
                    actualRef.current.style.minHeight = newHeight + 'px';
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isInPinnedPanel, actualRef]);

    return (
        <iframe
            ref={actualRef}
            key={`iframe-${role}-${content?.slice(0, 50)}`}
            srcDoc={sandboxedHtmlCode}
            className="w-full border-0 rounded"
            title={t("HTML Render Preview")}
            sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
            style={{ 
                height: iframeHeight + 'px',
                minHeight: (isInPinnedPanel ? 200 : 200) + 'px',
                maxHeight: 'none',
                overflow: 'auto',
                border: 'none',
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                resize: 'none'
            }}
        />
    );
});

IframeRenderer.displayName = 'IframeRenderer';

const Message = ({role, content, images, documents, onPinMessage, isPinned = false, showPinButton = true, isInPinnedPanel = false}) => {

    const [previewModal, setPreviewModal] = useState({ isOpen: false, image: null });
    const [htmlViewMode, setHtmlViewMode] = useState('rendered'); // 'rendered' | 'code'
    const iframeRef = React.useRef(null);
    const { isDark } = useTheme();
    const { t } = useLanguage();

    useEffect(()=>{
        Prism.highlightAll()
    }, [content])

    // Specialized processing for LaTeX mathematical formula formats and table formatting
    const processMathContent = (text) => {
        if (!text) return text;
        
        let processed = text
            // Handle \\( ... \\) format (inline formulas)
            .replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$')
            // Handle \\[ ... \\] format (block formulas)
            .replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$')
            // Handle single backslash format \( ... \) 
            .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
            // Handle single backslash format \[ ... \]
            .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
            // Handle escaped dollar signs that should remain as math delimiters
            .replace(/\\\$/g, '$');
        
        // Fix malformed table formatting where header and separator are merged
        // Pattern: "header1 | header2 | header3---|---|---content1 | content2 | content3"
        processed = processed.replace(
            /([^|\n]*\|[^|\n]*\|[^|\n]*?)(-{3,}\|){2,}(-{3,})([^|\n]*\|[^|\n]*\|[^|\n]*)/g,
            (match, headerPart, separatorMiddle, separatorEnd, contentPart) => {
                // Clean up the header part
                const cleanHeader = headerPart.trim();
                // Count the number of columns based on separators
                const separatorCount = (match.match(/\|/g) || []).length;
                const dashCount = (match.match(/-{3,}/g) || []).length;
                
                // Create proper separator row based on column count
                let separator = '';
                for (let i = 0; i < dashCount; i++) {
                    separator += (i > 0 ? '|' : '') + '---';
                }
                
                return `${cleanHeader}\n${separator}\n${contentPart.trim()}`;
            }
        );
        
        // Handle simpler case where just the separator is attached to header
        // Pattern: "header1 | header2---|---content"
        processed = processed.replace(
            /([^|\n-]+\|[^|\n-]+?)(-{3,}\|)(-{3,})([^|\n]*)/g,
            (match, headerPart, sep1, sep2, contentPart) => {
                const cleanHeader = headerPart.trim();
                const separator = sep1 + sep2;
                const cleanContent = contentPart.trim();
                
                if (cleanContent && cleanContent.includes('|')) {
                    return `${cleanHeader}\n${separator}\n${cleanContent}`;
                }
                return match;
            }
        );
        
        // Handle the specific case from the user's example
        // "原有表達 | 替代建議 | 範例句---|---|--- 太陽好像金黃色的大火球"
        processed = processed.replace(
            /([^|\n]+\|[^|\n]+\|[^|\n]+?)(-{3,}\|){2}(-{3,})\s+([^|\n]+\|[^|\n]+\|[^|\n]+)/g,
            (match, headerPart, sepMiddle, sepEnd, contentPart) => {
                const cleanHeader = headerPart.trim();
                const separator = '---|---|---';
                const cleanContent = contentPart.trim();
                
                return `${cleanHeader}\n${separator}\n${cleanContent}`;
            }
        );
            
        return processed;
    };

    const processedContent = processMathContent(content);

    // Check if content contains math formulas
    const hasMathFormulas = useMemo(() => {
        if (!content) return false;
        // Check for various math delimiters
        return /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\[\[\(][\s\S]*?\\[\]\)])/g.test(content);
    }, [content]);

    const copyMessage = ()=>{
        navigator.clipboard.writeText(content)
        toast.success(t('Message copied to clipboard'))
    }

    const handlePinMessage = () => {
        if (onPinMessage) {
            onPinMessage({
                role,
                content,
                images,
                timestamp: Date.now()
            });
            // Remove toast message from here since parent component will handle it
        }
    };

    // Open image preview modal
    const openPreviewModal = (image) => {
        setPreviewModal({ isOpen: true, image });
    };

    // Close image preview modal
    const closePreviewModal = () => {
        setPreviewModal({ isOpen: false, image: null });
    };

    // Extract HTML code - optimized with useCallback - Updated for better streaming compatibility
    const extractHTMLCode = useCallback((markdownContent) => {
        if (!markdownContent) return null;
        
        // More robust regex that handles different line endings and edge cases
        const htmlCodeRegex = /```html\s*\n?([\s\S]*?)\n?```/i;
        const match = htmlCodeRegex.exec(markdownContent);
        
        if (match && match[1]) {
            // Clean up the extracted HTML
            let htmlContent = match[1].trim();
            
            // Only return if there's actual content
            if (htmlContent.length === 0) return null;
            
            // Sanitize JavaScript in script tags to fix common syntax errors
            htmlContent = htmlContent.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, scriptContent) => {
                let fixedScript = scriptContent;
                
                // Skip if script is empty or just whitespace
                if (!fixedScript.trim()) {
                    return `<script${attrs}></script>`;
                }
                
                // Fix common JS syntax issues:
                // 1. Remove trailing commas before closing braces/brackets
                fixedScript = fixedScript.replace(/,\s*([}\]])/g, '$1');
                
                // 2. Fix double semicolons
                fixedScript = fixedScript.replace(/;;+/g, ';');
                
                // 3. Balance braces - count and fix
                let openBraces = (fixedScript.match(/{/g) || []).length;
                let closeBraces = (fixedScript.match(/}/g) || []).length;
                
                if (closeBraces > openBraces) {
                    // Too many closing braces - remove extras from the end
                    let excess = closeBraces - openBraces;
                    while (excess > 0) {
                        fixedScript = fixedScript.replace(/}\s*$/, '');
                        excess--;
                    }
                } else if (openBraces > closeBraces) {
                    // Too few closing braces - add them
                    fixedScript += '}'.repeat(openBraces - closeBraces);
                }
                
                // 4. Balance parentheses
                let openParens = (fixedScript.match(/\(/g) || []).length;
                let closeParens = (fixedScript.match(/\)/g) || []).length;
                
                if (closeParens > openParens) {
                    let excess = closeParens - openParens;
                    while (excess > 0) {
                        fixedScript = fixedScript.replace(/\)\s*$/, '');
                        excess--;
                    }
                } else if (openParens > closeParens) {
                    fixedScript += ')'.repeat(openParens - closeParens);
                }
                
                // 5. Ensure script doesn't end with orphan characters
                fixedScript = fixedScript.replace(/[{,;(\[]\s*$/, '');
                
                // 6. Check if already has try-catch wrapper - don't double wrap
                const hasTryCatch = /^\s*try\s*\{/.test(fixedScript.trim());
                
                if (!hasTryCatch) {
                    // Wrap in self-executing function with error handling
                    fixedScript = `(function() {
try {
${fixedScript}
} catch(e) { console.warn('Script error:', e); }
})();`;
                }
                
                return `<script${attrs}>${fixedScript}</script>`;
            });
            
            return htmlContent;
        }
        return null;
    }, []);

    // Optimize HTML code extraction with useMemo
    const htmlCode = useMemo(() => extractHTMLCode(content), [content, extractHTMLCode]);

    // Prepare sandboxed HTML with injected scripts for proper rendering
    // Since we removed allow-same-origin, we inject necessary scripts into srcDoc
    const sandboxedHtmlCode = useMemo(() => {
        if (!htmlCode) return null;
        
        // Fix common CSS syntax errors from AI-generated code
        let fixedHtmlCode = htmlCode
            // Fix linear-gradient color values missing spaces (e.g., #4caf5080% -> #4caf50 80%)
            .replace(/(#[0-9a-fA-F]{6})(\d+%)/g, '$1 $2')
            .replace(/(#[0-9a-fA-F]{3})(\d+%)/g, '$1 $2')
            // Fix rgba/rgb values missing spaces
            .replace(/rgba?\(([^)]+)\)/g, (match, inner) => {
                const fixed = inner.replace(/(\d+),(\d+)/g, '$1, $2').replace(/(\d+)%,(\d+)/g, '$1%, $2');
                return match.replace(inner, fixed);
            })
            // Fix border-radius missing spaces (e.g., 8px8px00 -> 8px 8px 0 0)
            .replace(/border-radius:\s*([^;}\n]+)/gi, (match, value) => {
                const fixedValue = value
                    .replace(/(\d+(?:px|em|rem|%))(\d)/g, '$1 $2')
                    .replace(/(\d)(\d+(?:px|em|rem|%))/g, '$1 $2')
                    .replace(/(\d+(?:px|em|rem|%))([a-zA-Z])/g, '$1 $2')
                    .replace(/00(?=\s|;|$)/g, '0 0')
                    .replace(/([0-9])([0-9]+px)/g, '$1 $2');
                return `border-radius: ${fixedValue}`;
            })
            // Fix margin/padding missing spaces
            .replace(/(margin|padding):\s*([^;}\n]+)/gi, (match, prop, value) => {
                const fixedValue = value
                    .replace(/(\d+(?:px|em|rem|%))(\d)/g, '$1 $2')
                    .replace(/00(?=\s|;|$)/g, '0 0');
                return `${prop}: ${fixedValue}`;
            })
            // Fix animation property (e.g., "growBaris" -> "growBar 1s")
            .replace(/animation:\s*([a-zA-Z]+)(\d*\.?\d*s?)?\s*(ease|linear|ease-in|ease-out|ease-in-out)?/gi, (match, name, duration, timing) => {
                const fixedDuration = duration || '1s';
                const fixedTiming = timing || 'ease-in-out';
                // Check if duration is missing 's' suffix
                const durationWithUnit = fixedDuration.match(/\d+\.?\d*s$/) ? fixedDuration : fixedDuration + 's';
                return `animation: ${name} ${durationWithUnit} ${fixedTiming}`;
            });
        
        // Script to inject for event handling and height reporting via postMessage
        const injectedScript = `
<script>
(function() {
    // Prevent form submission from page reload
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Prevent link navigation
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.href) {
            e.preventDefault();
            return false;
        }
    });
    
    // Report height to parent via postMessage
    function reportHeight() {
        try {
            var bodyHeight = document.body ? document.body.scrollHeight : 0;
            var docHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
            var height = Math.max(bodyHeight, docHeight);
            if (height > 0) {
                window.parent.postMessage({ type: 'iframeHeight', height: height + 20 }, '*');
            }
        } catch(e) {}
    }
    
    // Report height on load and periodically
    if (document.readyState === 'complete') {
        reportHeight();
    } else {
        window.addEventListener('load', reportHeight);
    }
    setTimeout(reportHeight, 100);
    setTimeout(reportHeight, 300);
    setTimeout(reportHeight, 600);
    setTimeout(reportHeight, 1000);
    
    // Also observe DOM changes to update height
    if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function() {
            setTimeout(reportHeight, 50);
        });
        observer.observe(document.body || document.documentElement, { 
            childList: true, 
            subtree: true, 
            attributes: true 
        });
    }
})();
</script>`;

        // Ensure HTML has proper structure for rendering
        const hasHtmlTag = /<html[\s>]/i.test(fixedHtmlCode);
        const hasBodyTag = /<body[\s>]/i.test(fixedHtmlCode);
        
        // Base styles to ensure proper rendering
        const baseStyle = `<style>
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 8px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif; }
        </style>`;
        
        let finalHtml;
        
        if (hasHtmlTag && hasBodyTag) {
            // Full HTML document - inject script before </body>
            if (fixedHtmlCode.includes('</body>')) {
                finalHtml = fixedHtmlCode.replace('</body>', injectedScript + '</body>');
            } else if (fixedHtmlCode.includes('</html>')) {
                finalHtml = fixedHtmlCode.replace('</html>', injectedScript + '</html>');
            } else {
                finalHtml = fixedHtmlCode + injectedScript;
            }
        } else if (hasBodyTag) {
            // Has body but no html tag - wrap properly
            finalHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head>${fixedHtmlCode.replace('</body>', injectedScript + '</body>')}</html>`;
        } else {
            // Fragment - wrap in full HTML structure
            finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${baseStyle}
</head>
<body>
${fixedHtmlCode}
${injectedScript}
</body>
</html>`;
        }
        
        return finalHtml;
    }, [htmlCode]);

    // Custom components for better table styling
    const markdownComponents = useMemo(() => ({
        table: ({ children }) => (
            <div className={`my-6 shadow-sm ${
                isInPinnedPanel ? '' : 'rounded-lg border border-gray-200'
            }`}>
                <table className="w-full divide-y table-auto">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className={isInPinnedPanel ? (isDark ? 'bg-gray-600' : 'bg-gray-200') : 'bg-gray-50'}>
                {children}
            </thead>
        ),
        tbody: ({ children }) => (
            <tbody className={`divide-y ${
                isInPinnedPanel ? (isDark ? 'bg-gray-700 divide-gray-500' : 'bg-gray-50 divide-gray-300') : 'bg-white divide-gray-200'
            }`}>
                {children}
            </tbody>
        ),
        tr: ({ children }) => (
            <tr className={`transition-colors duration-150 ${
                isInPinnedPanel ? (isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100') : 'hover:bg-gray-50'
            }`}>
                {children}
            </tr>
        ),
        th: ({ children }) => (
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r last:border-r-0 break-words min-w-0 whitespace-normal ${
                isInPinnedPanel ? (isDark ? 'text-white border-gray-500' : 'text-gray-800 border-gray-400') : 'text-gray-500 border-gray-200'
            }`}>
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className={`px-4 py-3 text-sm border-r last:border-r-0 break-words min-w-0 whitespace-normal leading-relaxed ${
                isInPinnedPanel ? (isDark ? 'text-white border-gray-500' : 'text-gray-900 border-gray-400') : 'text-gray-900 border-gray-200'
            }`}>
                {children}
            </td>
        ),
        // Prevent p tag nesting issues
        p: ({ children }) => (
            <div className={`mb-4 last:mb-0 ${isInPinnedPanel ? 'text-white' : ''}`}>
                {children}
            </div>
        ),
    }), [isInPinnedPanel, isDark]);

    // Render Markdown content, handle HTML code blocks - optimized with useMemo
    const renderedContent = useMemo(() => {
        if (htmlCode) {
            // Split content to find HTML code block position
            const parts = content.split(/```html[\s\S]*?```/gi);
            const beforeHTML = parts[0];
            const afterHTML = parts[1] || '';
            
            return (
                <div className={`space-y-4 w-full ${hasMathFormulas ? 'message-with-math' : ''} ${isInPinnedPanel ? (isDark ? 'text-white' : 'text-gray-900') : ''}`}>
                    {/* Content before HTML code block */}
                    {beforeHTML && (
                        <Markdown 
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >
                            {processMathContent(beforeHTML)}
                        </Markdown>
                    )}
                    
                    {/* HTML code/preview area */}
                    <div className={`overflow-hidden ${
                        isInPinnedPanel ? '' : 'border rounded-lg border-gray-300 bg-white'
                    }`}>
                        {!isInPinnedPanel && (
                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    {htmlViewMode === 'rendered' ? '' : 'HTML Code'}
                                </span>
                                <div className="flex gap-2">
                                    {/* <button
                                        onClick={() => setHtmlViewMode('rendered')}
                                        className={`px-3 py-1 text-xs rounded ${
                                            htmlViewMode === 'rendered' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => setHtmlViewMode('code')}
                                        className={`px-3 py-1 text-xs rounded ${
                                            htmlViewMode === 'code' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Code
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(htmlCode);
                                            toast.success('HTML code copied to clipboard');
                                        }}
                                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Copy
                                    </button> */}
                                    {showPinButton && (
                                        <button
                                            onClick={() => {
                                                if (onPinMessage) {
                                                    onPinMessage({
                                                        role,
                                                        content: `\`\`\`html\n${htmlCode}\n\`\`\``,
                                                        images: null,
                                                        timestamp: Date.now(),
                                                        isHtmlOnly: true
                                                    });
                                                    // Don't use isPinned here since it might not reflect HTML content state correctly
                                                    // Let the parent component handle the state and toast message
                                                }
                                            }}
                                            className="px-3 py-1 text-xs rounded flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
                                            title={t('Pin message')}
                                        >
                                            <Image 
                                                src={assets.pin_svgrepo_com} 
                                                alt={t('Pin message')} 
                                                className="w-4 h-4 brightness-0 invert"
                                            />
                                            {t('Pin message')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className={isInPinnedPanel ? '' : 'p-4'}>
                            {htmlViewMode === 'rendered' ? (
                                <IframeRenderer 
                                    iframeRef={iframeRef}
                                    sandboxedHtmlCode={sandboxedHtmlCode}
                                    role={role}
                                    content={content}
                                    isInPinnedPanel={isInPinnedPanel}
                                    t={t}
                                />
                            ) : (
                                <div className={`${
                                    isInPinnedPanel ? '' : 'rounded border bg-gray-50'
                                }`}>
                                    <pre className={`text-sm language-html ${
                                        isInPinnedPanel ? 'text-white' : 'p-4'
                                    }`} style={{ overflow: 'visible', whiteSpace: 'pre-wrap' }}>
                                        <code className="language-html">{htmlCode}</code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Content after HTML code block */}
                    {afterHTML && (
                        <Markdown 
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >
                            {processMathContent(afterHTML)}
                        </Markdown>
                    )}
                </div>
            );
        } else {
            // Regular Markdown rendering
            return (
                <div className={`space-y-4 w-full ${hasMathFormulas ? 'message-with-math' : ''} ${isInPinnedPanel ? (isDark ? 'text-white' : 'text-gray-900') : ''}`}>
                    <Markdown 
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                    >
                        {processedContent}
                    </Markdown>
                </div>
            );
        }
    }, [content, htmlCode, htmlViewMode, processedContent, markdownComponents, isInPinnedPanel, isDark]);

  return (
    <div className={`flex flex-col items-center w-full ${isInPinnedPanel ? 'max-w-full text-lg' : 'max-w-3xl text-base'}`}>
      {/* Image preview modal */}
      {previewModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closePreviewModal}
        >
          <div 
            className="relative max-w-lg max-h-[60vh] p-4 m-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreviewModal}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
            >
              ×
            </button>
            
            {previewModal.image.fileType === 'image' || !previewModal.image.fileType ? (
              // 圖片預覽
              <img 
                src={previewModal.image.url} 
                alt={previewModal.image.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              // 文檔內容預覽
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl max-h-[80vh] overflow-hidden`}>
                <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {previewModal.image.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {previewModal.image.documentType?.toUpperCase()} Document
                    {previewModal.image.pages && ` • ${previewModal.image.pages} pages`}
                  </p>
                </div>
                <div className={`p-4 max-h-96 overflow-y-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {previewModal.image.text || 'No text content available'}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
              {previewModal.image.name || t('Image')}
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-col w-full ${isInPinnedPanel ? 'mb-6' : 'mb-8'} ${role === 'user' && 'items-end'}`}>
        <div className={`group relative flex ${isInPinnedPanel ? 'max-w-full py-3 px-2' : 'max-w-2xl py-3'} rounded-xl ${role === 'user' ? (isInPinnedPanel ? 'px-3' : `${isDark ? 'bg-[#414158]' : 'bg-blue-100'} px-5`) : 'gap-3'}`}>
            {
                role === 'user' ? 
                (
                    <div className={
                        isInPinnedPanel ? 
                            `${isDark ? 'text-white' : 'text-gray-900'} ${isDark ? '' : 'bg-gray-50 p-3 rounded-lg border border-gray-200'}` : 
                            `${isDark ? 'text-white/90' : 'text-gray-800'}`
                    }>
                        {/* Display images and documents */}
                        {((images && images.length > 0) || (documents && documents.length > 0)) && (
                            <div className='mb-3 flex flex-wrap gap-2'>
                                {/* Display images */}
                                {images && images.map((file, index) => (
                                    <div key={`image-${index}`} className='relative group'>
                                        {file.fileType === 'image' || !file.fileType ? (
                                            // 顯示圖片
                                            <img 
                                                src={file.url} 
                                                alt={file.name || `${t('Image')} ${index + 1}`}
                                                className={`max-w-48 max-h-48 object-cover rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-300'} cursor-pointer hover:opacity-90 transition-opacity`}
                                                onClick={() => openPreviewModal(file)}
                                            />
                                        ) : (
                                            // 顯示文檔圖標
                                            <div 
                                                className={`w-32 h-24 flex flex-col items-center justify-center rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} cursor-pointer hover:opacity-80 transition-opacity overflow-hidden`}
                                                onClick={() => openPreviewModal(file)}
                                            >
                                                <div className="text-2xl mb-1">
                                                    {file.documentType === 'pdf' ? '📄' : '📝'}
                                                </div>
                                                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center px-1`}>
                                                    {file.documentType?.toUpperCase()}
                                                </div>
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center px-0.5 truncate max-w-[80px] w-full overflow-hidden`}>
                                                    {file.name}
                                                </div>
                                            </div>
                                        )}
                                        <div className='absolute bottom-1 left-1 bg-black/70 text-xs px-1 py-0.5 rounded text-white/70 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            {file.name || `${file.fileType === 'image' ? t('Image') : 'Document'} ${index + 1}`}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Display documents */}
                                {documents && documents.map((doc, index) => (
                                    <div key={`doc-${index}`} className='relative group'>
                                        <div 
                                            className={`w-32 h-24 flex flex-col items-center justify-center rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} cursor-pointer hover:opacity-80 transition-opacity overflow-hidden`}
                                            onClick={() => openPreviewModal({...doc, fileType: 'document', documentType: doc.type})}
                                        >
                                            <div className="text-2xl mb-1">
                                                {doc.type === 'pdf' ? '📄' : '📝'}
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center px-1`}>
                                                {doc.type?.toUpperCase()}
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center px-0.5 truncate max-w-[80px] w-full overflow-hidden`}>
                                                {doc.name}
                                            </div>
                                        </div>
                                        <div className='absolute bottom-1 left-1 bg-black/70 text-xs px-1 py-0.5 rounded text-white/70 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            {doc.name || `Document ${index + 1}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Display text content */}
                        <span>{content}</span>
                    </div>
                )
                :
                (
                    <>
                    {!isInPinnedPanel && <Image src={assets.reshot_icon} alt='' className={`h-9 w-9 p-1 border ${isDark ? 'border-white/15' : 'border-gray-300'} rounded-full`}/>}
                    {renderedContent}
                    </>
                )
            }
        </div>
        
        {/* 统一的按钮区域 - 放在消息下方 */}
        {!isInPinnedPanel && (
          <div className={`mt-1 flex items-center gap-2 ${role === 'user' ? 'justify-end' : 'justify-start pl-9'}`}>
            <button
              onClick={copyMessage}
              className={`opacity-70 hover:opacity-100 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isDark ? 'hover:bg-gray-600/30' : 'hover:bg-gray-100/50'
              }`}
              title={t("Copy message")}
            >
              <Image 
                src={assets.copy_icon} 
                alt={t('Copy')} 
                className={`w-4 transition-all ${isDark ? 'brightness-0 invert' : ''}`}
                style={isDark ? {} : { filter: 'hue-rotate(220deg) saturate(2) brightness(0.4)' }}
              />
            </button>
            {showPinButton && (
              <button
                onClick={handlePinMessage}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isDark ? 'hover:bg-gray-600/30' : 'hover:bg-gray-100/50'
                } opacity-70 hover:opacity-100`}
                title={t('Pin message')}
              >
                <Image 
                  src={assets.pin_svgrepo_com} 
                  alt={t('Pin message')} 
                  className={`w-5 transition-all ${isDark ? 'brightness-0 invert' : ''}`}
                  style={isDark ? {} : { filter: 'hue-rotate(220deg) saturate(2) brightness(0.4)' }}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(Message)