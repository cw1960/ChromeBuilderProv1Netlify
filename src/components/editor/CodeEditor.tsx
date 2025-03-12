import React, { useState, useEffect } from 'react';
import Editor, { loader, Monaco } from '@monaco-editor/react';
import { Resizable } from 'react-resizable-panels';

// Define supported languages and theme mapping
export type SupportedLanguage = 'javascript' | 'typescript' | 'json' | 'html' | 'css';

interface CodeEditorProps {
  value: string;
  language: SupportedLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string | number;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  className?: string;
}

export default function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = '500px',
  showLineNumbers = true,
  showMinimap = false,
  className = '',
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [editorOptions, setEditorOptions] = useState({});

  // Configure the Monaco editor
  const beforeMount = (monaco: Monaco) => {
    // Register themes
    monaco.editor.defineTheme('chromebuilder-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#313244',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#cdd6f4',
        'editorIndentGuide.background': '#313244',
      },
    });

    monaco.editor.defineTheme('chromebuilder-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#f8f9fa',
        'editor.foreground': '#24292e',
        'editor.lineHighlightBackground': '#f1f3f5',
        'editorLineNumber.foreground': '#6e7781',
        'editorLineNumber.activeForeground': '#24292e',
        'editorIndentGuide.background': '#e1e4e8',
      },
    });
  };

  // Configure editor when mounted
  const onMount = (_editor: any, monaco: Monaco) => {
    setMounted(true);
    
    // Apply the theme based on system/user preference
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    monaco.editor.setTheme(isDarkMode ? 'chromebuilder-dark' : 'chromebuilder-light');
    
    // Set up listeners for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      monaco.editor.setTheme(e.matches ? 'chromebuilder-dark' : 'chromebuilder-light');
    });
  };

  // Update editor options
  useEffect(() => {
    setEditorOptions({
      readOnly,
      minimap: { enabled: showMinimap },
      lineNumbers: showLineNumbers ? 'on' : 'off',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      tabSize: 2,
    });
  }, [readOnly, showMinimap, showLineNumbers]);

  return (
    <div className={`border border-border rounded-md overflow-hidden ${className}`}>
      <Editor
        height={height}
        language={language}
        value={value}
        beforeMount={beforeMount}
        onMount={onMount}
        onChange={(value) => onChange && onChange(value || '')}
        options={editorOptions}
        loading={<div className="h-full w-full flex items-center justify-center">Loading editor...</div>}
      />
    </div>
  );
}