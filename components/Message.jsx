import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import Prism from 'prismjs'
import toast from 'react-hot-toast'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'

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
            const htmlContent = match[1].trim();
            // Only return if there's actual content
            return htmlContent.length > 0 ? htmlContent : null;
        }
        return null;
    }, []);

    // Optimize HTML code extraction with useMemo
    const htmlCode = useMemo(() => extractHTMLCode(content), [content, extractHTMLCode]);

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
                                <iframe
                                    ref={iframeRef}
                                    key={`iframe-${role}-${content?.slice(0, 50)}`}
                                    srcDoc={htmlCode}
                                    className="w-full border-0 rounded"
                                    title={t("HTML Render Preview")}
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals allow-storage-access-by-user-activation"
                                    style={{ 
                                        height: isInPinnedPanel ? '200px' : '400px', // Initial height for pinned panel, will be set to actual content height by adjustHeight
                                        minHeight: isInPinnedPanel ? '200px' : '200px', // Initial minHeight for pinned panel, will be set to actual content height by adjustHeight
                                        maxHeight: isInPinnedPanel ? 'none' : 'none', // Remove max height limit to allow full content display
                                        overflow: 'auto', // Allow scrolling if content is too large
                                        border: 'none',
                                        display: 'block',
                                        width: '100%',
                                        maxWidth: '100%', // Prevent horizontal expansion
                                        resize: 'none' // Disable manual resizing
                                    }}
                                    onLoad={(e) => {
                                        // Auto-adjust iframe height to fully fit content and monitor content changes
                                        try {
                                            const iframe = e.target;
                                            const iframeWindow = iframe.contentWindow;
                                            const doc = iframe.contentDocument || iframeWindow.document;
                                            
                                            // Trigger any initialization functions that might be waiting
                                            // This ensures scripts execute even if DOMContentLoaded already fired
                                            if (iframeWindow && doc.readyState === 'complete') {
                                                // Manually trigger DOMContentLoaded if the document is already loaded
                                                // but listeners might have been registered too late
                                                setTimeout(() => {
                                                    const event = new Event('DOMContentLoaded', {
                                                        bubbles: true,
                                                        cancelable: true
                                                    });
                                                    doc.dispatchEvent(event);
                                                }, 0);
                                            }
                                            
                                            // Fix common CSS issues in inline styles and style tags
                                            const fixCSSGradients = () => {
                                                try {
                                                    // Fix inline styles
                                                    const elementsWithStyle = doc.querySelectorAll('[style*="gradient"]');
                                                    elementsWithStyle.forEach(el => {
                                                        const style = el.getAttribute('style');
                                                        if (style) {
                                                            // Fix patterns like: #a0eaff0% -> #a0eaff 0%
                                                            // Fix patterns like: #2d8cf0100% -> #2d8cf0 100%
                                                            const fixedStyle = style
                                                                .replace(/(#[0-9a-fA-F]{6})(\d+%)/g, '$1 $2')
                                                                .replace(/(#[0-9a-fA-F]{3})(\d+%)/g, '$1 $2');
                                                            if (fixedStyle !== style) {
                                                                el.setAttribute('style', fixedStyle);
                                                            }
                                                        }
                                                    });
                                                    
                                                    // Fix style tags
                                                    const styleTags = doc.querySelectorAll('style');
                                                    styleTags.forEach(styleTag => {
                                                        const originalCSS = styleTag.textContent;
                                                        const fixedCSS = originalCSS
                                                            .replace(/(#[0-9a-fA-F]{6})(\d+%)/g, '$1 $2')
                                                            .replace(/(#[0-9a-fA-F]{3})(\d+%)/g, '$1 $2');
                                                        if (fixedCSS !== originalCSS) {
                                                            styleTag.textContent = fixedCSS;
                                                        }
                                                    });
                                                    
                                                    // Ensure SVG elements are properly sized
                                                    const svgs = doc.querySelectorAll('svg');
                                                    svgs.forEach(svg => {
                                                        // Set preserveAspectRatio if not set
                                                        if (!svg.hasAttribute('preserveAspectRatio')) {
                                                            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                                                        }
                                                        // Ensure viewBox is set for proper scaling
                                                        if (!svg.hasAttribute('viewBox') && svg.hasAttribute('width') && svg.hasAttribute('height')) {
                                                            const width = svg.getAttribute('width');
                                                            const height = svg.getAttribute('height');
                                                            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
                                                        }
                                                    });
                                                } catch (error) {
                                                    console.error('CSS gradient fix failed:', error);
                                                }
                                            };
                                            
                                            // Apply CSS fixes immediately
                                            fixCSSGradients();
                                            
                                            // Dynamic height adjustment function
                                            const adjustHeight = () => {
                                                try {
                                                    // Wait for styles to be applied
                                                    requestAnimationFrame(() => {
                                                        // Get actual content height including all elements
                                                        const bodyHeight = doc.body ? doc.body.scrollHeight : 0;
                                                        const documentHeight = doc.documentElement ? doc.documentElement.scrollHeight : 0;
                                                        
                                                        // Check for SVG elements and their bounding boxes
                                                        const svgs = doc.querySelectorAll('svg');
                                                        let maxSvgHeight = 0;
                                                        svgs.forEach(svg => {
                                                            const bbox = svg.getBoundingClientRect();
                                                            const svgBottom = bbox.bottom + (svg.offsetTop || 0);
                                                            maxSvgHeight = Math.max(maxSvgHeight, svgBottom);
                                                        });
                                                        
                                                        const contentHeight = Math.max(bodyHeight, documentHeight, maxSvgHeight);
                                                        
                                                        if (contentHeight > 0) {
                                                            if (isInPinnedPanel) {
                                                                // For pinned panel, set appropriate height with padding
                                                                const finalHeight = Math.max(200, contentHeight + 20);
                                                                iframe.style.height = finalHeight + 'px';
                                                                iframe.style.minHeight = finalHeight + 'px';
                                                            } else {
                                                                // For regular messages, set height with padding
                                                                const finalHeight = Math.max(200, contentHeight + 20);
                                                                iframe.style.height = finalHeight + 'px';
                                                                iframe.style.minHeight = finalHeight + 'px';
                                                            }
                                                        }
                                                    });
                                                } catch (innerError) {
                                                    console.error('Height adjustment failed:', innerError);
                                                }
                                            };
                                            
                                            // Only add minimal event prevention script
                                            if (!doc.querySelector('script[data-event-handler]')) {
                                                const script = doc.createElement('script');
                                                script.setAttribute('data-event-handler', 'true');
                                                script.textContent = `
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
                                                `;
                                                doc.body.appendChild(script);
                                            }
                                            
                                            // Initial height adjustments - delayed to allow rendering
                                            setTimeout(adjustHeight, 100);
                                            setTimeout(adjustHeight, 300);
                                            setTimeout(adjustHeight, 600);
                                            setTimeout(adjustHeight, 1000);
                                            setTimeout(adjustHeight, 1500);
                                        } catch (error) {
                                            // Set compact default height when cross-origin restrictions apply
                                            e.target.style.height = '300px';
                                            e.target.style.minHeight = '300px';
                                        }
                                    }}
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