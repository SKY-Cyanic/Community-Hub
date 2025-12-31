
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Zap, Volume2, Loader2, X } from 'lucide-react';

const VoiceNeuralLink: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const startConnection = async () => {
    setIsConnecting(true);
    setTranscription('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) {
                int16[i] = input[i] * 32768;
              }
              
              sessionPromise.then(session => {
                const base64 = encode(new Uint8Array(int16.buffer));
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64 = msg.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64);
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => (prev + ' ' + msg.serverContent!.outputTranscription!.text).trim());
            }
            if (msg.serverContent?.interrupted) {
              stopAllAudio();
            }
          },
          onerror: (e) => {
            setIsConnecting(false);
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: '당신은 AI-Hub의 실시간 가이드입니다. 짧고 친절하게 한국어로 답변하세요. 사용자가 말하는 내용을 듣고 적절한 도움을 주거나 대화를 이어가세요.',
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setIsConnecting(false);
    }
  };

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) return;
    const data = decode(base64);
    const audioBuffer = await decodeAudioData(data, audioContextRef.current, 24000, 1);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    sourcesRef.current.add(source);
    source.onended = () => sourcesRef.current.delete(source);
  };

  const stopAllAudio = () => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const disconnect = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
    stopAllAudio();
  };

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
    }
    return buffer;
  }

  return (
    <div className="fixed bottom-60 right-4 md:bottom-48 md:right-8 z-[130]">
      <div className="flex flex-col items-end gap-3">
        {isActive && transcription && (
          <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/50 p-4 rounded-3xl text-cyan-400 text-[11px] max-w-[220px] animate-fade-in shadow-2xl relative mb-2">
            <button onClick={() => setTranscription('')} className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1.5 text-gray-400 hover:text-white shadow-xl">
              <X size={12} />
            </button>
            <div className="line-clamp-4 italic font-medium">"{transcription}"</div>
          </div>
        )}
        
        <button
          onClick={isActive ? disconnect : startConnection}
          disabled={isConnecting}
          className={`group flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-2xl active:scale-90 ${
            isActive 
              ? 'bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.6)] border-none' 
              : 'bg-black/80 backdrop-blur-xl border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black'
          }`}
          title="Voice AI"
        >
          {isConnecting ? (
            <Loader2 className="animate-spin" size={24} />
          ) : isActive ? (
            <MicOff size={24} />
          ) : (
            <Mic size={24} />
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceNeuralLink;
