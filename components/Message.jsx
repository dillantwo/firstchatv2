import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import Prism from 'prismjs'
import toast from 'react-hot-toast'

const Message = ({role, content, images, onPinMessage, isPinned = false, showPinButton = true, isInPinnedPanel = false}) => {

    const [previewModal, setPreviewModal] = useState({ isOpen: false, image: null });
    const [htmlViewMode, setHtmlViewMode] = useState('rendered'); // 'rendered' | 'code'
    const iframeRef = React.useRef(null);

    useEffect(()=>{
        Prism.highlightAll()
    }, [content])

    // Specialized processing for LaTeX mathematical formula formats
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
            
        // Debug: if content was modified, output to console
        if (processed !== text) {
            console.log('Math content processed:', { original: text, processed });
        }
            
        return processed;
    };

    const processedContent = processMathContent(content);

    const copyMessage = ()=>{
        navigator.clipboard.writeText(content)
        toast.success('Message copied to clipboard')
    }

    const handlePinMessage = () => {
        if (onPinMessage) {
            onPinMessage({
                role,
                content,
                images,
                timestamp: Date.now()
            });
            toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
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

    // Extract HTML code - optimized with useCallback
    const extractHTMLCode = useCallback((markdownContent) => {
        const htmlCodeRegex = /```html\s*\n([\s\S]*?)\n```/gi;
        const match = htmlCodeRegex.exec(markdownContent);
        return match && match[1] ? match[1].trim() : null;
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
            <thead className={isInPinnedPanel ? 'bg-gray-600' : 'bg-gray-50'}>
                {children}
            </thead>
        ),
        tbody: ({ children }) => (
            <tbody className={`divide-y ${
                isInPinnedPanel ? 'bg-gray-700 divide-gray-500' : 'bg-white divide-gray-200'
            }`}>
                {children}
            </tbody>
        ),
        tr: ({ children }) => (
            <tr className={`transition-colors duration-150 ${
                isInPinnedPanel ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
            }`}>
                {children}
            </tr>
        ),
        th: ({ children }) => (
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r last:border-r-0 break-words min-w-0 whitespace-normal ${
                isInPinnedPanel ? 'text-white border-gray-500' : 'text-gray-500 border-gray-200'
            }`}>
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className={`px-4 py-3 text-sm border-r last:border-r-0 break-words min-w-0 whitespace-normal leading-relaxed ${
                isInPinnedPanel ? 'text-white border-gray-500' : 'text-gray-900 border-gray-200'
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
    }), []);

    // Render Markdown content, handle HTML code blocks - optimized with useMemo
    const renderedContent = useMemo(() => {
        if (htmlCode) {
            // Split content to find HTML code block position
            const parts = content.split(/```html[\s\S]*?```/gi);
            const beforeHTML = parts[0];
            const afterHTML = parts[1] || '';
            
            return (
                <div className={`space-y-4 w-full ${isInPinnedPanel ? 'text-white' : ''}`}>
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
                                    <button
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
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={isInPinnedPanel ? '' : 'p-4'}>
                            {htmlViewMode === 'rendered' ? (
                                <iframe
                                    ref={iframeRef}
                                    key={`iframe-${role}-${content?.slice(0, 50)}`}
                                    srcDoc={processMathContent(htmlCode)}
                                    className="w-full border-0 rounded"
                                    title="HTML Render Preview"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
                                    style={{ 
                                        height: isInPinnedPanel ? '600px' : '250px', // Even larger height for pinned panel
                                        minHeight: isInPinnedPanel ? '500px' : '150px', // Increased minimum height for pinned panel
                                        maxHeight: isInPinnedPanel ? '600px' : '250px', // Prevent iframe from growing beyond this
                                        overflow: 'hidden', // Hide overflow to prevent expansion
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
                                            const doc = iframe.contentDocument || iframe.contentWindow.document;
                                            
                                            // Dynamic height adjustment function
                                            const adjustHeight = () => {
                                                try {` + 
                                                    (isInPinnedPanel ? `
                                                    // Don't auto-adjust height in pinned panel to prevent expansion
                                                    console.log('Height adjustment disabled in pinned panel');
                                                    return;` : `
                                                    // Get actual content height including all elements
                                                    const bodyHeight = doc.body.scrollHeight;
                                                    const documentHeight = doc.documentElement.scrollHeight;
                                                    const maxHeight = Math.max(bodyHeight, documentHeight);
                                                    
                                                    // Set iframe height to actual content height, reducing excess whitespace
                                                    const finalHeight = Math.max(200, maxHeight + 15) + 'px';
                                                    iframe.style.height = finalHeight;
                                                    iframe.style.minHeight = finalHeight;
                                                    
                                                    // Allow appropriate scrolling inside iframe in case content grows dynamically
                                                    doc.body.style.overflow = 'auto';
                                                    doc.documentElement.style.overflow = 'auto';
                                                    
                                                    console.log('Iframe height adjusted to:', finalHeight);`) + `
                                                } catch (innerError) {
                                                    console.log('Height adjustment failed:', innerError);
                                                }
                                            };
                                            
                                            // Add KaTeX CSS and JavaScript for math rendering
                                            if (!doc.querySelector('link[data-katex-css]')) {
                                                const katexCSS = doc.createElement('link');
                                                katexCSS.setAttribute('data-katex-css', 'true');
                                                katexCSS.rel = 'stylesheet';
                                                katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
                                                katexCSS.integrity = 'sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn';
                                                katexCSS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(katexCSS);
                                            }

                                            // Load KaTeX main library first
                                            if (!doc.querySelector('script[data-katex-js]')) {
                                                const katexJS = doc.createElement('script');
                                                katexJS.setAttribute('data-katex-js', 'true');
                                                katexJS.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
                                                katexJS.integrity = 'sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx';
                                                katexJS.crossOrigin = 'anonymous';
                                                
                                                // Load auto-render after main KaTeX library loads
                                                katexJS.onload = () => {
                                                    const autoRenderJS = doc.createElement('script');
                                                    autoRenderJS.setAttribute('data-katex-auto-render', 'true');
                                                    autoRenderJS.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js';
                                                    autoRenderJS.integrity = 'sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05';
                                                    autoRenderJS.crossOrigin = 'anonymous';
                                                    
                                                    autoRenderJS.onload = () => {
                                                        // Initialize KaTeX auto-render after both scripts load
                                                        setTimeout(() => {
                                                            if (doc.defaultView && doc.defaultView.renderMathInElement) {
                                                                console.log('Initializing KaTeX math rendering...');
                                                                doc.defaultView.renderMathInElement(doc.body, {
                                                                    delimiters: [
                                                                        {left: '$$', right: '$$', display: true},
                                                                        {left: '$', right: '$', display: false},
                                                                        {left: '\\(', right: '\\)', display: false},
                                                                        {left: '\\[', right: '\\]', display: true}
                                                                    ],
                                                                    throwOnError: false
                                                                });
                                                                console.log('KaTeX math rendering completed');
                                                                // Re-adjust height after math rendering
                                                                setTimeout(adjustHeight, 300);
                                                            }
                                                        }, 100);
                                                    };
                                                    
                                                    doc.head.appendChild(autoRenderJS);
                                                };
                                                
                                                doc.head.appendChild(katexJS);
                                            }

                                            // Add basic styles to ensure content displays properly
                                            if (!doc.querySelector('style[data-iframe-styles]')) {
                                                const style = doc.createElement('style');
                                                style.setAttribute('data-iframe-styles', 'true');
                                                    style.textContent = `
                                                    * { box-sizing: border-box; }
                                                    html, body { 
                                                        margin: 0; 
                                                        padding: 8px; 
                                                        font-family: Arial, sans-serif;
                                                        overflow: auto;
                                                        max-width: 100%;
                                                        max-height: 100vh;
                                                        position: relative;
                                                    }
                                                    /* Prevent draggable elements from expanding the container */
                                                    * {
                                                        max-width: 100% !important;
                                                    }
                                                    /* Constrain draggable elements */
                                                    [draggable="true"], .draggable {
                                                        position: relative !important;
                                                        max-width: 100% !important;
                                                        contain: layout style paint !important;
                                                    }
                                                    /* Prevent elements from being positioned outside the viewport */
                                                    * {
                                                        contain: layout style paint;
                                                    }
                                                    button, input, select, textarea { 
                                                        cursor: pointer; 
                                                        font-family: inherit;
                                                        pointer-events: auto;
                                                        max-width: 100%;
                                                    }
                                                    /* Prevent form submission from causing page refresh */
                                                    form { 
                                                        display: inline-block; 
                                                        max-width: 100%;
                                                    }
                                                    /* KaTeX math styling */
                                                    .katex { font-size: 1.1em; }
                                                    .katex-display { margin: 1em 0; }
                                                    /* Container constraints */
                                                    div, section, article, main {
                                                        max-width: 100%;
                                                        overflow: hidden;
                                                    }
                                                `;
                                                doc.head.appendChild(style);
                                            }
                                            
                                            // Prevent form submission and link navigation from causing page reload, but allow content changes
                                            if (!doc.querySelector('script[data-event-handler]')) {
                                                const script = doc.createElement('script');
                                                script.setAttribute('data-event-handler', 'true');
                                                script.textContent = `
                                                    // Function to render math formulas
                                                    function renderMath() {
                                                        console.log('Attempting to render math...');
                                                        // Wait for KaTeX to be available
                                                        if (window.renderMathInElement && window.katex) {
                                                            console.log('KaTeX libraries found, rendering math...');
                                                            window.renderMathInElement(document.body, {
                                                                delimiters: [
                                                                    {left: '$$', right: '$$', display: true},
                                                                    {left: '$', right: '$', display: false},
                                                                    {left: '\\\\(', right: '\\\\)', display: false},
                                                                    {left: '\\\\[', right: '\\\\]', display: true}
                                                                ],
                                                                throwOnError: false
                                                            });
                                                            console.log('Math rendering completed');
                                                        } else {
                                                            console.log('KaTeX not yet available, retrying in 200ms...');
                                                            setTimeout(renderMath, 200);
                                                        }
                                                    }

                                                    // Prevent form submission from causing page refresh
                                                    document.addEventListener('submit', function(e) {
                                                        e.preventDefault();
                                                        console.log('Form submission prevented to avoid page reload');
                                                        
                                                        // Delay height adjustment to allow content changes to recalculate
                                                        setTimeout(function() {
                                                            renderMath(); // Re-render math after content change
                                                            const event = new Event('contentChanged');
                                                            document.dispatchEvent(event);
                                                        }, 100);
                                                        return false;
                                                    });
                                                    
                                                    // Prevent link navigation
                                                    document.addEventListener('click', function(e) {
                                                        if (e.target.tagName === 'A' && e.target.href) {
                                                            e.preventDefault();
                                                            console.log('Link navigation prevented:', e.target.href);
                                                            return false;
                                                        }
                                                        
                                                        // Button clicks may change content, delay height adjustment
                                                        if (e.target.tagName === 'BUTTON') {
                                                            setTimeout(function() {
                                                                renderMath(); // Re-render math after button click
                                                                const event = new Event('contentChanged');
                                                                document.dispatchEvent(event);
                                                            }, 200);
                                                        }
                                                    });
                                                    
                                                    // Prevent drag operations from expanding the container
                                                    document.addEventListener('dragstart', function(e) {
                                                        console.log('Drag operation detected, applying constraints');
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    });
                                                    
                                                    document.addEventListener('drag', function(e) {
                                                        // Constrain drag to viewport
                                                        const rect = document.body.getBoundingClientRect();
                                                        if (e.clientX < 0 || e.clientX > rect.width || 
                                                            e.clientY < 0 || e.clientY > rect.height) {
                                                            e.preventDefault();
                                                        }
                                                    });
                                                    
                                                    document.addEventListener('dragend', function(e) {
                                                        // Ensure dragged element stays within bounds
                                                        const target = e.target;
                                                        if (target.style.position === 'absolute' || target.style.position === 'fixed') {
                                                            const rect = document.body.getBoundingClientRect();
                                                            const targetRect = target.getBoundingClientRect();
                                                            
                                                            if (targetRect.left < 0) target.style.left = '0px';
                                                            if (targetRect.top < 0) target.style.top = '0px';
                                                            if (targetRect.right > rect.width) {
                                                                target.style.left = (rect.width - targetRect.width) + 'px';
                                                            }
                                                            if (targetRect.bottom > rect.height) {
                                                                target.style.top = (rect.height - targetRect.height) + 'px';
                                                            }
                                                        }
                                                    });
                                                    
                                                    // Listen for DOM changes and auto-adjust height
                                                    const observer = new MutationObserver(function(mutations) {
                                                        let shouldResize = false;
                                                        mutations.forEach(function(mutation) {
                                                            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                                                                shouldResize = true;
                                                            }
                                                        });
                                                        if (shouldResize) {
                                                            setTimeout(function() {
                                                                renderMath(); // Re-render math after DOM changes
                                                                const event = new Event('contentChanged');
                                                                document.dispatchEvent(event);
                                                            }, 100);
                                                        }
                                                    });
                                                    
                                                    observer.observe(document.body, {
                                                        childList: true,
                                                        subtree: true,
                                                        attributes: true,
                                                        attributeFilter: ['style', 'class']
                                                    });
                                                    
                                                    // Prevent events that may cause page reload
                                                    document.addEventListener('beforeunload', function(e) {
                                                        e.preventDefault();
                                                        return false;
                                                    });
                                                    
                                                    // Initial math rendering with multiple retries
                                                    setTimeout(renderMath, 200);
                                                    setTimeout(renderMath, 500);
                                                    setTimeout(renderMath, 1000);
                                                `;
                                                doc.head.appendChild(script);
                                            }
                                            
                                            // Listen for content change events and re-adjust height
                                            doc.addEventListener('contentChanged', adjustHeight);
                                            
                                            // Initial height adjustments - delayed to allow math rendering
                                            setTimeout(adjustHeight, 500);
                                            setTimeout(adjustHeight, 1000);
                                            setTimeout(adjustHeight, 1500);
                                            
                                        } catch (error) {
                                            // Set compact default height when cross-origin restrictions apply
                                            console.log('Unable to auto-resize iframe due to cross-origin restrictions');
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
                <div className={`space-y-4 w-full ${isInPinnedPanel ? 'text-white' : ''}`}>
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
    }, [content, htmlCode, htmlViewMode, processedContent, markdownComponents]);

  return (
    <div className={`flex flex-col items-center w-full ${isInPinnedPanel ? 'max-w-full text-lg' : 'max-w-3xl text-base'}`}>
      {/* Image preview modal */}
      {previewModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closePreviewModal}
        >
          <div 
            className="relative max-w-4xl max-h-4xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreviewModal}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
            >
              ×
            </button>
            <img 
              src={previewModal.image.url} 
              alt={previewModal.image.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
              {previewModal.image.name || 'Image'}
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-col  w-full ${isInPinnedPanel ? 'mb-6' : 'mb-8'} ${role === 'user' && 'items-end'}`}>
        <div className={`group relative flex ${isInPinnedPanel ? 'max-w-full py-3 px-2' : 'max-w-2xl py-3'} rounded-xl ${role === 'user' ? (isInPinnedPanel ? 'px-3' : 'bg-[#414158] px-5') : 'gap-3'}`}>
            <div className={`opacity-0 group-hover:opacity-100 absolute ${role === 'user' ? '-left-16 top-2.5' : 'left-9 -bottom-6'} transition-all ${isInPinnedPanel ? 'hidden' : ''}`}>
                <div className='flex items-center gap-2 opacity-70'>
                    {
                        role === 'user' ? (
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt='' className='w-4 cursor-pointer'/>
                            {showPinButton && (
                                <Image 
                                    onClick={handlePinMessage} 
                                    src={assets.pin_icon} 
                                    alt={isPinned ? 'Unpin' : 'Pin'} 
                                    className={`w-4 cursor-pointer ${isPinned ? 'opacity-100' : ''}`}
                                    title={isPinned ? 'Unpin message' : 'Pin message'}
                                />
                            )}
                            </>
                        ):(
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt='' className='w-4.5 cursor-pointer'/>
                            {showPinButton && (
                                <Image 
                                    onClick={handlePinMessage} 
                                    src={assets.pin_icon} 
                                    alt={isPinned ? 'Unpin' : 'Pin'} 
                                    className={`w-4 cursor-pointer ${isPinned ? 'opacity-100' : ''}`}
                                    title={isPinned ? 'Unpin message' : 'Pin message'}
                                />
                            )}
                            </>
                        )
                    }
                </div>
            </div>
            {
                role === 'user' ? 
                (
                    <div className={isInPinnedPanel ? 'text-white' : 'text-white/90'}>
                        {/* Display images */}
                        {images && images.length > 0 && (
                            <div className='mb-3 flex flex-wrap gap-2'>
                                {images.map((image, index) => (
                                    <div key={index} className='relative group'>
                                        <img 
                                            src={image.url} 
                                            alt={image.name || `Image ${index + 1}`}
                                            className='max-w-48 max-h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity'
                                            onClick={() => openPreviewModal(image)}
                                        />
                                        <div className='absolute bottom-1 left-1 bg-black/70 text-xs px-1 py-0.5 rounded text-white/70 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            {image.name || `Image ${index + 1}`}
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
                    {!isInPinnedPanel && <Image src={assets.reshot_icon} alt='' className='h-9 w-9 p-1 border border-white/15 rounded-full'/>}
                    {renderedContent}
                    </>
                )
            }
        </div>
      </div>
    </div>
  )
}

export default Message
