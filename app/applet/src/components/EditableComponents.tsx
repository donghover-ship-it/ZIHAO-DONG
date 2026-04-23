import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

export const EditableField = ({ label, value, onChange, type = 'text', className = '', editable = false }: { label: string, value: string | number, onChange: (val: string) => void, type?: 'text' | 'textarea', className?: string, editable?: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue ? tempValue.toString() : '');
    setIsEditing(false);
  };

  if (isEditing && editable) {
    return (
      <div className={`w-full p-2 -m-2 rounded-lg bg-white/5 border border-indigo-500/30 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">{label}</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-white/10 transition-colors">
              <Check size={12} />
            </button>
            <button type="button" onClick={() => { setIsEditing(false); setTempValue(value); }} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/10 transition-colors">
              <X size={12} />
            </button>
          </div>
        </div>
        {type === 'textarea' ? (
          <textarea
            value={tempValue || ''}
            onChange={(e) => setTempValue(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[80px]"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={tempValue || ''}
            onChange={(e) => setTempValue(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            autoFocus
          />
        )}
      </div>
    );
  }

  return (
    <div className={`group relative w-full p-2 -m-2 rounded-lg transition-colors ${editable ? 'hover:bg-white/5' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">{label}</p>
        {editable && (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }} 
            className="text-indigo-400/70 hover:text-indigo-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 size={10}/> 编辑
          </button>
        )}
      </div>
      <p 
        className={`text-sm text-white leading-relaxed whitespace-pre-wrap ${editable ? 'cursor-pointer hover:text-indigo-200 transition-colors' : ''}`} 
        onClick={(e) => {
          if (editable) {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
          }
        }}
      >
        {value || '-'}
      </p>
    </div>
  );
};

export const EditableTags = ({ label, tags, onChange, className = '' }: { label: string, tags: string[], onChange: (tags: string[]) => void, className?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTags, setTempTags] = useState<string[]>(tags || []);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setTempTags(tags || []);
  }, [tags]);

  const handleSave = () => {
    onChange(tempTags);
    setIsEditing(false);
  };

  const addTag = () => {
    if (inputValue.trim() && !tempTags.includes(inputValue.trim())) {
      setTempTags([...tempTags, inputValue.trim()]);
      setInputValue('');
    }
  };

  if (isEditing) {
    return (
      <div className={`w-full p-2 -m-2 rounded-lg bg-white/5 border border-indigo-500/30 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">{label}</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-white/10 transition-colors">
              <Check size={12} />
            </button>
            <button type="button" onClick={() => { setIsEditing(false); setTempTags(tags || []); }} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/10 transition-colors">
              <X size={12} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {tempTags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 rounded text-xs flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => setTempTags(tempTags.filter(t => t !== tag))} className="hover:text-red-400">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="输入标签后按回车"
            className="flex-1 bg-black/20 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
          />
          <button type="button" onClick={addTag} className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded text-xs transition-colors">
            添加
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative w-full p-2 -m-2 rounded-lg transition-colors hover:bg-white/5 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">{label}</p>
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
          }} 
          className="text-indigo-400/70 hover:text-indigo-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 size={10}/> 添加/编辑
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags && tags.length > 0 ? tags.map((tag, i) => (
          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 rounded-full text-xs flex items-center gap-1 group/tag">
            {tag}
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newTags = tags.filter(t => t !== tag);
                onChange(newTags);
              }} 
              className="opacity-50 hover:opacity-100 hover:text-red-400 transition-all"
              title="删除标签"
            >
              <X size={12} />
            </button>
          </span>
        )) : <span className="text-sm text-gray-400">暂无标签...</span>}
      </div>
    </div>
  );
};
