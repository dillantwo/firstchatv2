'use client';
import { useEffect } from 'react';

export default function ViewportHandler() {
  useEffect(() => {
    // 检测iPad设备
    const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIPad) {
      // 动态调整视口高度，特别适应iPad Chrome
      const adjustViewport = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // iPad Chrome特殊处理
        if (isChrome) {
          // 确保底部内容可见
          const mainContainer = document.querySelector('.main-container');
          if (mainContainer) {
            mainContainer.style.paddingBottom = '40px';
          }
          
          // 调整prompt容器位置
          const promptContainer = document.querySelector('.prompt-container');
          if (promptContainer) {
            promptContainer.style.marginBottom = '40px';
            promptContainer.style.position = 'relative';
            promptContainer.style.zIndex = '10';
          }
          
          // 为聊天区域添加额外的底部空间
          const chatContainer = document.querySelector('.chat-container');
          if (chatContainer) {
            chatContainer.style.paddingBottom = '140px';
          }
        }
        
        // iPad Safari特殊处理
        if (isSafari) {
          document.body.style.height = '-webkit-fill-available';
        }
      };
      
      // 立即执行一次
      adjustViewport();
      
      // 监听窗口变化
      window.addEventListener('resize', adjustViewport);
      window.addEventListener('orientationchange', () => {
        // 延迟执行以确保方向变化完成
        setTimeout(adjustViewport, 200);
      });
      
      // 监听虚拟键盘的显示/隐藏（iPad Chrome特有问题）
      if (isChrome) {
        const initialHeight = window.innerHeight;
        const handleResize = () => {
          const currentHeight = window.innerHeight;
          const heightDiff = initialHeight - currentHeight;
          
          // 如果高度减少超过150px，可能是虚拟键盘出现
          if (heightDiff > 150) {
            const promptContainer = document.querySelector('.prompt-container');
            if (promptContainer) {
              promptContainer.style.marginBottom = '20px';
            }
          } else {
            // 键盘隐藏，恢复原始边距
            const promptContainer = document.querySelector('.prompt-container');
            if (promptContainer) {
              promptContainer.style.marginBottom = '40px';
            }
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', adjustViewport);
          window.removeEventListener('orientationchange', adjustViewport);
          window.removeEventListener('resize', handleResize);
        };
      }
      
      return () => {
        window.removeEventListener('resize', adjustViewport);
        window.removeEventListener('orientationchange', adjustViewport);
      };
    }
  }, []);

  return null; // 这个组件不渲染任何UI
}
