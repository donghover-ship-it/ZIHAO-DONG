import React, { useState } from 'react';
import { Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry, parseAIError } from '../utils/aiUtils';
import { StatusBar, CountDownTimer, ReconnectGuide, useErrorInterceptor } from './ErrorSystem';

interface ImageAnalyzerProps {
  onAnalysisComplete: (result: string) => void;
}

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onAnalysisComplete }) => {
  const { error: globalError, clearError: clearGlobalError, busyCountdown } = useErrorInterceptor();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // 分析图片
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data
              }
            },
            { text: "请分析这张图片，描述其内容、风格、材质或任何值得注意的细节。" }
          ]
        }
      });

      if (response.text) {
        onAnalysisComplete(response.text);
      }
    } catch (err) {
      console.error("分析失败:", err);
      const parsedError = parseAIError(err, "图片分析失败");
      if (parsedError === "AI_BUSY_429") {
        setError("AI 正在忙碌中，请稍后再试");
      } else {
        setError(parsedError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 glass-tile-premium rounded-xl">
      <StatusBar error={globalError} onClear={clearGlobalError} />
      {globalError?.type === '429' && <CountDownTimer seconds={busyCountdown} />}
      {globalError?.type === 'CONNECTION_CLOSED' && <ReconnectGuide />}
      
      <div className="flex items-center gap-2 text-slate-400">
        <Sparkles size={18} />
        <h4 className="font-bold">AI 图片分析</h4>
      </div>
      
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-slate-500/50 transition-colors">
        {preview ? (
          <img src={preview} alt="Preview" className="h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="text-gray-500 mb-2" size={24} />
            <p className="text-xs text-gray-400">点击上传图片进行分析</p>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </label>

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="animate-spin" size={16} />
          正在深度分析中...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};
