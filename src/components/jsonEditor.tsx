import React, { useState, useCallback, useRef, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

type JSONEditorProps = {
    initialValue?: string;
    onChange?: (jsonString: string) => void;
}

const JSONEditor: React.FC<JSONEditorProps> = ({ initialValue, onChange }) => {
  const [content, setContent] = useState(
    initialValue || `{}`
  );
  const [errors, setErrors] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);

  const validateJSON = useCallback((text: string) => {
    const errorLines: number[] = [];
    try {
      JSON.parse(text);
      setErrors([]);
      return true;
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      const match = errorMsg.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        let charCount = 0;
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (charCount + lines[i].length >= position) {
            errorLines.push(i);
            break;
          }
          charCount += lines[i].length + 1;
        }
      } else {
        errorLines.push(text.split('\n').length - 1);
      }
      setErrors(errorLines);
      return false;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    validateJSON(newContent);
    onChange?.(newContent);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }
    if (lineNumberRef.current) {
      lineNumberRef.current.scrollTop = target.scrollTop;
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setErrors([]);
      onChange?.(formatted);
    } catch (e) {
      console.log(e);
      alert('Invalid JSON format');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newContent =
        content.substring(0, start) + '\t' + content.substring(end);
      setContent(newContent);
      validateJSON(newContent);
      onChange?.(newContent);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    }
  };

  const getTokenColor = useCallback((token: string): string => {
    if (token.match(/^"[^"]*":/)) return 'text-blue-500';
    if (token.match(/^"[^"]*"$/)) return 'text-green-500';
    if (token.match(/^true$|^false$/)) return 'text-purple-500';
    if (token.match(/^null$/)) return 'text-gray-500';
    if (token.match(/^\d+\.?\d*$/)) return 'text-orange-500';
    if (token.match(/^[{}\\[\]]/)) return 'text-gray-400'; // Fixed: removed extra backslash
    return 'text-gray-300';
  }, []);

  const highlightLine = useCallback((line: string, lineIndex: number): React.ReactNode[] => {
    const tokens = line.match(/("(?:[^"\\]|\\.)*":|"(?:[^"\\]|\\.)*"|true|false|null|-?\d+\.?\d*|[{}\\[\]:,])/g) || []; // Fixed: removed extra backslash
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    tokens.forEach((token, tokenIndex) => {
      const index = line.indexOf(token, lastIndex);
      if (index > lastIndex) {
        parts.push(
          <span key={`${lineIndex}-text-${lastIndex}`} className="text-gray-300">
            {line.substring(lastIndex, index)}
          </span>
        );
      }
      parts.push(
        <span key={`${lineIndex}-token-${index}-${tokenIndex}`} className={getTokenColor(token)}>
          {token}
        </span>
      );
      lastIndex = index + token.length;
    });

    if (lastIndex < line.length) {
      parts.push(
        <span key={`${lineIndex}-text-end`} className="text-gray-300">
          {line.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [getTokenColor]);

  const lines = useMemo(() => content.split('\n'), [content]);
  
  const highlightedLines = useMemo(
    () => lines.map((line, i) => highlightLine(line, i)),
    [lines, highlightLine]
  );

  const isValid = errors.length === 0;

  const LINE_HEIGHT = '1.5rem';
  const EDITOR_PADDING = '1rem';

  return (
    <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col border border-slate-700 rounded-xl">
      <div className="flex items-center justify-between py-2 px-5">
        <div className='flex items-center gap-4'>
            <h1 className="text-xl font-bold">JSON Editor</h1>
            {!isValid && (
                <div className="flex items-center gap-2" role="alert" aria-live="polite">
                    <AlertCircle size={20} className="text-red-500" aria-hidden="true" />
                    <span className='text-red-500 text-sm'>Invalid JSON structure detected</span>
                </div>
            )}
        </div>
        
        <button
          onClick={handleFormat}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
          aria-label="Format JSON"
          title="Format JSON (prettify)"
        >
          <RefreshCw size={18} aria-hidden="true" />
          Format
        </button>
      </div>

      <div className="flex-1 bg-slate-800 overflow-hidden flex border-t border-slate-700 rounded-bl-xl rounded-br-xl">
        {/* Line numbers */}
        <div
          ref={lineNumberRef}
          className="bg-slate-900 border-r border-slate-700 select-none px-3 text-right text-slate-500 font-mono text-sm overflow-hidden min-w-fit"
          style={{ lineHeight: LINE_HEIGHT, paddingTop: EDITOR_PADDING, paddingBottom: EDITOR_PADDING }}
          aria-hidden="true"
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={`${
                errors.includes(i) ? 'bg-red-900/50 text-red-400' : ''
              }`}
              style={{ lineHeight: LINE_HEIGHT, height: LINE_HEIGHT }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Editor container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlight layer */}
          <div
            ref={highlightRef}
            className="absolute inset-0 overflow-auto pointer-events-none"
            style={{ lineHeight: LINE_HEIGHT }}
            aria-hidden="true"
          >
            <pre
              className="font-mono text-sm m-0 p-4 whitespace-pre break-words text-transparent bg-transparent"
              style={{ lineHeight: LINE_HEIGHT }}
            >
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`${
                    errors.includes(i) ? 'bg-red-900/30' : ''
                  }`}
                  style={{ lineHeight: LINE_HEIGHT, height: LINE_HEIGHT }}
                >
                  {highlightedLines[i]}
                </div>
              ))}
            </pre>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            className="absolute inset-0 font-mono text-sm resize-none outline-none p-4 bg-transparent text-transparent whitespace-pre caret-white overflow-auto focus:outline-0"
            style={{
              lineHeight: LINE_HEIGHT,
            }}
            spellCheck="false"
            aria-label="JSON code editor"
            role="textbox"
            aria-multiline="true"
          />
        </div>
      </div>
    </div>
  );
};

export default JSONEditor;