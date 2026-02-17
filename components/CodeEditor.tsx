
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface CodeEditorProps {
    initialValue: string;
    onSave: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue, onSave }) => {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    // Sync local state if prop changes (e.g. switching artifacts)
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;

            // Insert 2 spaces for tab
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            setValue(newValue);

            // Move cursor
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
            }, 0);
        } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            onSave(value);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
    };

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineCount = value.split('\n').length;
    const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className="code-editor-container">
            <div className="code-editor-toolbar">
                <span className="editor-lang">HTML/CSS</span>
                <button className="editor-save-btn" onClick={() => onSave(value)}>
                    Apply Changes (Cmd+S)
                </button>
            </div>
            <div className="code-editor-wrapper">
                <div className="line-numbers" ref={lineNumbersRef}>
                    {lines.map((line) => (
                        <div key={line} className="line-number">{line}</div>
                    ))}
                </div>
                <textarea
                    ref={textareaRef}
                    className="code-textarea"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                />
            </div>
        </div>
    );
};

export default CodeEditor;
