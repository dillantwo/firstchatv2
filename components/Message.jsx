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
        // More flexible regex that handles different line endings and spacing
        const htmlCodeRegex = /```html\s*([\s\S]*?)\s*```/gi;
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
                                    srcDoc={processMathContent(htmlCode)}
                                    className="w-full border-0 rounded"
                                    title={t("HTML Render Preview")}
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals allow-storage-access-by-user-activation"
                                    style={{ 
                                        height: isInPinnedPanel ? '200px' : '350px', // Initial height for pinned panel, will be set to actual content height by adjustHeight
                                        minHeight: isInPinnedPanel ? '200px' : '150px', // Initial minHeight for pinned panel, will be set to actual content height by adjustHeight
                                        maxHeight: isInPinnedPanel ? 'none' : '350px', // No max height limit for pinned panel
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
                                                try {
                                                    // Get actual content height including all elements
                                                    const bodyHeight = doc.body.scrollHeight;
                                                    const documentHeight = doc.documentElement.scrollHeight;
                                                    const maxHeight = Math.max(bodyHeight, documentHeight);
                                                    
                                                    if (isInPinnedPanel) {
                                                        // For pinned panel, set fixed height and prevent further changes
                                                        const finalHeight = Math.max(200, maxHeight + 15) + 'px';
                                                        iframe.style.height = finalHeight;
                                                        iframe.style.minHeight = finalHeight;
                                                        iframe.style.maxHeight = finalHeight; // Also set maxHeight to prevent any changes
                                                        
                                                        // Disable scrolling and fix the container size
                                                        doc.body.style.overflow = 'hidden';
                                                        doc.documentElement.style.overflow = 'hidden';
                                                        doc.body.style.height = finalHeight;
                                                        doc.documentElement.style.height = finalHeight;
                                                    } else {
                                                        // For regular messages (chatbot), add 15px buffer for better spacing
                                                        const finalHeight = Math.max(200, maxHeight + 15) + 'px';
                                                        iframe.style.height = finalHeight;
                                                        iframe.style.minHeight = finalHeight;
                                                        
                                                        // Allow appropriate scrolling inside iframe in case content grows dynamically
                                                        doc.body.style.overflow = 'auto';
                                                        doc.documentElement.style.overflow = 'auto';
                                                    }
                                                } catch (innerError) {
                                                    // Height adjustment failed
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
                                                                doc.defaultView.renderMathInElement(doc.body, {
                                                                    delimiters: [
                                                                        {left: '$$', right: '$$', display: true},
                                                                        {left: '$', right: '$', display: false},
                                                                        {left: '\\(', right: '\\)', display: false},
                                                                        {left: '\\[', right: '\\]', display: true}
                                                                    ],
                                                                    throwOnError: false
                                                                });
                                                                // Re-adjust height after math rendering
                                                                setTimeout(adjustHeight, 300);
                                                            }
                                                        }, 100);
                                                    };
                                                    
                                                    doc.head.appendChild(autoRenderJS);
                                                };
                                                
                                                doc.head.appendChild(katexJS);
                                            }
                                            
                                            // Load Chart.js for data visualization
                                            if (!doc.querySelector('script[data-chartjs]')) {
                                                const chartJS = doc.createElement('script');
                                                chartJS.setAttribute('data-chartjs', 'true');
                                                chartJS.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
                                                chartJS.integrity = 'sha384-6eDaF6RN8e6T3d7x8T8VxX9NyJ6HcEZzOo/w5K5Pk1mKb8l1pQ3lOJKN3lK7OLd';
                                                chartJS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(chartJS);
                                            }
                                            
                                            // Load D3.js for advanced visualizations
                                            if (!doc.querySelector('script[data-d3js]')) {
                                                const d3JS = doc.createElement('script');
                                                d3JS.setAttribute('data-d3js', 'true');
                                                d3JS.src = 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js';
                                                d3JS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(d3JS);
                                            }
                                            
                                            // Load Three.js for 3D graphics
                                            if (!doc.querySelector('script[data-threejs]')) {
                                                const threeJS = doc.createElement('script');
                                                threeJS.setAttribute('data-threejs', 'true');
                                                threeJS.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
                                                threeJS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(threeJS);
                                            }
                                            
                                            // Load Lodash for utility functions
                                            if (!doc.querySelector('script[data-lodash]')) {
                                                const lodashJS = doc.createElement('script');
                                                lodashJS.setAttribute('data-lodash', 'true');
                                                lodashJS.src = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js';
                                                lodashJS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(lodashJS);
                                            }
                                            
                                            // Load Moment.js for date handling
                                            if (!doc.querySelector('script[data-momentjs]')) {
                                                const momentJS = doc.createElement('script');
                                                momentJS.setAttribute('data-momentjs', 'true');
                                                momentJS.src = 'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js';
                                                momentJS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(momentJS);
                                            }
                                            
                                            // Load Bootstrap CSS for styling
                                            if (!doc.querySelector('link[data-bootstrap-css]')) {
                                                const bootstrapCSS = doc.createElement('link');
                                                bootstrapCSS.setAttribute('data-bootstrap-css', 'true');
                                                bootstrapCSS.rel = 'stylesheet';
                                                bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
                                                bootstrapCSS.integrity = 'sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN';
                                                bootstrapCSS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(bootstrapCSS);
                                            }
                                            
                                            // Load Bootstrap JS for interactive components
                                            if (!doc.querySelector('script[data-bootstrap-js]')) {
                                                const bootstrapJS = doc.createElement('script');
                                                bootstrapJS.setAttribute('data-bootstrap-js', 'true');
                                                bootstrapJS.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';
                                                bootstrapJS.integrity = 'sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL';
                                                bootstrapJS.crossOrigin = 'anonymous';
                                                doc.head.appendChild(bootstrapJS);
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
                                                    
                                                    /* Enhanced CSS support */
                                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                                                    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
                                                    
                                                    /* Element constraints for better containment */
                                                    * {
                                                        max-width: 100% !important;
                                                        -webkit-user-drag: none !important;
                                                        -khtml-user-drag: none !important;
                                                        -moz-user-drag: none !important;
                                                        -o-user-drag: none !important;
                                                        user-drag: none !important;
                                                        draggable: false !important;
                                                    }
                                                    
                                                    /* Enhanced interactive elements */
                                                    button, input, select, textarea { 
                                                        cursor: pointer; 
                                                        font-family: inherit;
                                                        pointer-events: auto;
                                                        max-width: 100%;
                                                        border-radius: 4px;
                                                        border: 1px solid #ddd;
                                                        padding: 4px 8px;
                                                        transition: all 0.2s ease;
                                                    }
                                                    
                                                    button:hover {
                                                        background-color: #f0f0f0;
                                                        border-color: #999;
                                                    }
                                                    
                                                    input:focus, textarea:focus, select:focus {
                                                        outline: 2px solid #007acc;
                                                        border-color: #007acc;
                                                    }
                                                    
                                                    /* Form styling */
                                                    form { 
                                                        display: inline-block; 
                                                        max-width: 100%;
                                                    }
                                                    
                                                    /* Enhanced table styling */
                                                    table {
                                                        border-collapse: collapse;
                                                        width: 100%;
                                                        margin: 1em 0;
                                                    }
                                                    
                                                    th, td {
                                                        border: 1px solid #ddd;
                                                        padding: 8px;
                                                        text-align: left;
                                                    }
                                                    
                                                    th {
                                                        background-color: #f5f5f5;
                                                        font-weight: bold;
                                                    }
                                                    
                                                    /* CSS Grid and Flexbox support */
                                                    .grid {
                                                        display: grid;
                                                    }
                                                    
                                                    .flex {
                                                        display: flex;
                                                    }
                                                    
                                                    /* CSS Animation support */
                                                    @keyframes fadeIn {
                                                        from { opacity: 0; }
                                                        to { opacity: 1; }
                                                    }
                                                    
                                                    @keyframes slideIn {
                                                        from { transform: translateX(-100%); }
                                                        to { transform: translateX(0); }
                                                    }
                                                    
                                                    @keyframes bounce {
                                                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                                                        40% { transform: translateY(-10px); }
                                                        60% { transform: translateY(-5px); }
                                                    }
                                                    
                                                    /* Common utility classes */
                                                    .fade-in { animation: fadeIn 0.5s ease-in; }
                                                    .slide-in { animation: slideIn 0.5s ease-out; }
                                                    .bounce { animation: bounce 2s infinite; }
                                                    
                                                    .text-center { text-align: center; }
                                                    .text-left { text-align: left; }
                                                    .text-right { text-align: right; }
                                                    
                                                    .m-1 { margin: 0.25rem; }
                                                    .m-2 { margin: 0.5rem; }
                                                    .m-4 { margin: 1rem; }
                                                    .p-1 { padding: 0.25rem; }
                                                    .p-2 { padding: 0.5rem; }
                                                    .p-4 { padding: 1rem; }
                                                    
                                                    .rounded { border-radius: 0.25rem; }
                                                    .rounded-lg { border-radius: 0.5rem; }
                                                    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
                                                    .shadow-lg { box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
                                                    
                                                    /* KaTeX math styling */
                                                    .katex { font-size: 1.1em; }
                                                    .katex-display { margin: 1em 0; }
                                                    
                                                    /* Container constraints */
                                                    div, section, article, main {
                                                        max-width: 100%;
                                                        overflow: hidden;
                                                    }
                                                    
                                                    /* Media queries for responsive design */
                                                    @media (max-width: 768px) {
                                                        body { padding: 4px; }
                                                        table { font-size: 0.8em; }
                                                    }
                                                    
                                                    /* Enhanced styling for common HTML elements */
                                                    h1, h2, h3, h4, h5, h6 {
                                                        margin: 0.5em 0;
                                                        line-height: 1.4;
                                                    }
                                                    
                                                    p {
                                                        margin: 0.5em 0;
                                                        line-height: 1.6;
                                                    }
                                                    
                                                    a {
                                                        color: #007acc;
                                                        text-decoration: none;
                                                    }
                                                    
                                                    a:hover {
                                                        text-decoration: underline;
                                                    }
                                                    
                                                    img {
                                                        max-width: 100%;
                                                        height: auto;
                                                    }
                                                    
                                                    pre, code {
                                                        background-color: #f5f5f5;
                                                        padding: 0.2em 0.4em;
                                                        border-radius: 3px;
                                                        font-family: 'Courier New', monospace;
                                                    }
                                                    
                                                    pre {
                                                        padding: 1em;
                                                        overflow-x: auto;
                                                        white-space: pre-wrap;
                                                    }
                                                `;
                                                doc.head.appendChild(style);
                                            }
                                            
                                            // Prevent form submission and link navigation from causing page reload, but allow content changes
                                            if (!doc.querySelector('script[data-event-handler]')) {
                                                const script = doc.createElement('script');
                                                script.setAttribute('data-event-handler', 'true');
                                                script.textContent = `
                                                    // Enhanced JavaScript environment for HTML rendering
                                                    
                                                    // Console polyfill for debugging
                                                    if (!window.console) {
                                                        window.console = {};
                                                    }
                                                    if (!window.console.log) {
                                                        window.console.log = function() {
                                                            // You can extend this to show logs in a dev panel if needed
                                                        };
                                                    }
                                                    
                                                    // Function to render math formulas
                                                    function renderMath() {
                                                        // Wait for KaTeX to be available
                                                        if (window.renderMathInElement && window.katex) {
                                                            window.renderMathInElement(document.body, {
                                                                delimiters: [
                                                                    {left: '$$', right: '$$', display: true},
                                                                    {left: '$', right: '$', display: false},
                                                                    {left: '\\\\(', right: '\\\\)', display: false},
                                                                    {left: '\\\\[', right: '\\\\]', display: true}
                                                                ],
                                                                throwOnError: false
                                                            });
                                                        } else {
                                                            setTimeout(renderMath, 200);
                                                        }
                                                    }
                                                    
                                                    // Enhanced DOM manipulation utilities
                                                    window.$ = function(selector) {
                                                        return document.querySelector(selector);
                                                    };
                                                    
                                                    window.$$ = function(selector) {
                                                        return document.querySelectorAll(selector);
                                                    };
                                                    
                                                    // Animation utilities
                                                    window.animate = function(element, animation, duration = 1000) {
                                                        if (typeof element === 'string') {
                                                            element = document.querySelector(element);
                                                        }
                                                        if (element) {
                                                            element.style.animation = animation + ' ' + duration + 'ms';
                                                            setTimeout(() => {
                                                                element.style.animation = '';
                                                            }, duration);
                                                        }
                                                    };
                                                    
                                                    // Simple state management
                                                    window.state = {};
                                                    window.setState = function(key, value) {
                                                        window.state[key] = value;
                                                        // Trigger custom event for state change
                                                        const event = new CustomEvent('statechange', {
                                                            detail: { key, value }
                                                        });
                                                        document.dispatchEvent(event);
                                                    };
                                                    
                                                    window.getState = function(key) {
                                                        return window.state[key];
                                                    };
                                                    
                                                    // Enhanced event handling
                                                    window.on = function(selector, event, handler) {
                                                        const elements = document.querySelectorAll(selector);
                                                        elements.forEach(el => {
                                                            el.addEventListener(event, handler);
                                                        });
                                                    };
                                                    
                                                    // AJAX utilities (fetch wrapper)
                                                    window.request = function(url, options = {}) {
                                                        return fetch(url, {
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                ...options.headers
                                                            },
                                                            ...options
                                                        }).then(response => {
                                                            if (!response.ok) {
                                                                throw new Error('Network response was not ok');
                                                            }
                                                            return response.json();
                                                        });
                                                    };
                                                    
                                                    // Storage utilities (localStorage wrapper)
                                                    window.store = {
                                                        set: function(key, value) {
                                                            try {
                                                                localStorage.setItem(key, JSON.stringify(value));
                                                            } catch (e) {
                                                                console.warn('LocalStorage not available');
                                                            }
                                                        },
                                                        get: function(key) {
                                                            try {
                                                                const item = localStorage.getItem(key);
                                                                return item ? JSON.parse(item) : null;
                                                            } catch (e) {
                                                                console.warn('LocalStorage not available');
                                                                return null;
                                                            }
                                                        },
                                                        remove: function(key) {
                                                            try {
                                                                localStorage.removeItem(key);
                                                            } catch (e) {
                                                                console.warn('LocalStorage not available');
                                                            }
                                                        }
                                                    };

                                                    // Prevent form submission from causing page refresh
                                                    document.addEventListener('submit', function(e) {
                                                        e.preventDefault();
                                                        
                                                        // Allow custom form handling
                                                        const form = e.target;
                                                        const formData = new FormData(form);
                                                        const formObject = {};
                                                        formData.forEach((value, key) => {
                                                            formObject[key] = value;
                                                        });
                                                        
                                                        // Trigger custom submit event with form data
                                                        const customEvent = new CustomEvent('formsubmit', {
                                                            detail: { form, data: formObject }
                                                        });
                                                        document.dispatchEvent(customEvent);
                                                        
                                                        // Delay height adjustment to allow content changes to recalculate (disabled for pinned panels)
                                                        if (!${isInPinnedPanel}) {
                                                            setTimeout(function() {
                                                                renderMath(); // Re-render math after content change
                                                                const event = new Event('contentChanged');
                                                                document.dispatchEvent(event);
                                                            }, 100);
                                                        }
                                                        return false;
                                                    });
                                                    
                                                    // Prevent link navigation but allow custom handling
                                                    document.addEventListener('click', function(e) {
                                                        if (e.target.tagName === 'A' && e.target.href) {
                                                            e.preventDefault();
                                                            
                                                            // Trigger custom link click event
                                                            const customEvent = new CustomEvent('linkclick', {
                                                                detail: { 
                                                                    href: e.target.href, 
                                                                    text: e.target.textContent,
                                                                    target: e.target 
                                                                }
                                                            });
                                                            document.dispatchEvent(customEvent);
                                                            return false;
                                                        }
                                                        
                                                        // Button clicks may change content, delay height adjustment
                                                        if (e.target.tagName === 'BUTTON' && !${isInPinnedPanel}) {
                                                            // Only auto-adjust height for chatbot messages, not pinned panels
                                                            setTimeout(function() {
                                                                renderMath(); // Re-render math after button click
                                                                const event = new Event('contentChanged');
                                                                document.dispatchEvent(event);
                                                            }, 200);
                                                        }
                                                    });
                                                    
                                                    // Listen for DOM changes and auto-adjust height
                                                    const observer = new MutationObserver(function(mutations) {
                                                        let shouldResize = false;
                                                        mutations.forEach(function(mutation) {
                                                            if (mutation.type === 'childList' || 
                                                                (mutation.type === 'attributes' && 
                                                                 ['style', 'class'].includes(mutation.attributeName))) {
                                                                shouldResize = true;
                                                            }
                                                        });
                                                        if (shouldResize && !${isInPinnedPanel}) {
                                                            // Only auto-adjust height for chatbot messages to preserve dynamic behavior
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
                                                    
                                                    // Initialize math rendering with multiple retries
                                                    setTimeout(renderMath, 200);
                                                    setTimeout(renderMath, 500);
                                                    setTimeout(renderMath, 1000);
                                                    
                                                    // Trigger ready event for user scripts
                                                    setTimeout(() => {
                                                        const readyEvent = new Event('iframeready');
                                                        document.dispatchEvent(readyEvent);
                                                    }, 100);
                                                `;
                                                doc.head.appendChild(script);
                                            }
                                            
                                            // Listen for content change events and re-adjust height (only for chatbot messages)
                                            if (!isInPinnedPanel) {
                                                doc.addEventListener('contentChanged', adjustHeight);
                                            }
                                            
                                            // Initial height adjustments - delayed to allow math rendering
                                            setTimeout(adjustHeight, 500);
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