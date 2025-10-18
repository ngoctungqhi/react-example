import React, { useState, useCallback, useRef } from 'react';
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

  const lines = content.split('\n');

  const getTokenColor = (token: string): string => {
    if (token.match(/^"[^"]*":/)) return 'text-blue-500';
    if (token.match(/^"[^"]*"$/)) return 'text-green-500';
    if (token.match(/^true$|^false$/)) return 'text-purple-500';
    if (token.match(/^null$/)) return 'text-gray-500';
    if (token.match(/^\d+\.?\d*$/)) return 'text-orange-500';
    if (token.match(/^[{}\\[\]]/)) return 'text-gray-400';
    return 'text-gray-300';
  };

  const highlightLine = (line: string): React.ReactNode[] => {
    const tokens = line.match(/("(?:[^"\\]|\\.)*":|"(?:[^"\\]|\\.)*"|true|false|null|-?\d+\.?\d*|[{}\\[\]:,])/g) || [];
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    tokens.forEach((token) => {
      const index = line.indexOf(token, lastIndex);
      if (index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="text-gray-300">
            {line.substring(lastIndex, index)}
          </span>
        );
      }
      parts.push(
        <span key={`token-${index}`} className={getTokenColor(token)}>
          {token}
        </span>
      );
      lastIndex = index + token.length;
    });

    if (lastIndex < line.length) {
      parts.push(
        <span key={`text-end`} className="text-gray-300">
          {line.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const isValid = errors.length === 0;

  return (
    <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col border border-slate-700 rounded-xl">
      <div className="flex items-center justify-between py-2 px-5">
        <div className='flex items-center gap-4'>
            <h1 className="text-xl font-bold">JSON Editor</h1>
            {!isValid && (
                <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" />
                    <span className='text-red-500 text-sm'>Invalid JSON structure detected</span>
                </div>
            )}
        </div>
        
        <button
          onClick={handleFormat}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
        >
          <RefreshCw size={18} />
          Format
        </button>
      </div>

      <div className="flex-1 bg-slate-800 overflow-hidden flex border-t border-slate-700 rounded-bl-xl rounded-br-xl">
        {/* Line numbers */}
        <div
          ref={lineNumberRef}
          className="bg-slate-900 border-r border-slate-700 select-none px-3 text-right text-slate-500 font-mono text-sm overflow-hidden min-w-fit"
          style={{ lineHeight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={`${
                errors.includes(i) ? 'bg-red-900/50 text-red-400' : ''
              }`}
              style={{ lineHeight: '1.5rem', height: '1.5rem' }}
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
            style={{ lineHeight: '1.5rem' }}
          >
            <pre
              className="font-mono text-sm m-0 p-4 whitespace-pre break-words text-transparent bg-transparent"
              style={{ lineHeight: '1.5rem' }}
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={`${
                    errors.includes(i) ? 'bg-red-900/30' : ''
                  }`}
                  style={{ lineHeight: '1.5rem', height: '1.5rem' }}
                >
                  {highlightLine(line)}
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
              lineHeight: '1.5rem',
            }}
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};

export default JSONEditor;