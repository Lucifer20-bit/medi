import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  FileAudio, 
  Copy, 
  Check, 
  X, 
  Loader2, 
  Sparkles, 
  Volume2, 
  AlertCircle,
  Stethoscope,
  Send
} from 'lucide-react';

interface AudioTranscriberModalProps {
  onClose: () => void;
  onApplyTranscript?: (text: string) => void;
  initialContext?: string;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  onClose,
  onApplyTranscript,
  initialContext = 'Clinical Consultation Dictation'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState(
    'Transcribe this Nigerian hospital medical dictation verbatim, ensuring accurate clinical terminology (e.g., malaria, typhoid, genotype, drug dosages).'
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript('');
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting microphone recording:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone permissions in your browser.'
          : 'Could not initialize microphone. Ensure an audio input device is connected.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setTranscript('');
  };

  const transcribeAudio = async (blobToTranscribe?: Blob) => {
    const targetBlob = blobToTranscribe || audioBlob;
    if (!targetBlob) {
      setErrorMessage('No audio recorded or selected.');
      return;
    }

    setTranscribing(true);
    setErrorMessage(null);

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(targetBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: targetBlob.type || 'audio/webm',
            prompt: customPrompt,
          }),
        });

        const data = await res.json();
        if (data.success && data.transcript) {
          setTranscript(data.transcript);
        } else {
          throw new Error(data.error || 'Failed to transcribe audio with gemini-3.5-transcribe');
        }
        setTranscribing(false);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read audio data for upload.');
        setTranscribing(false);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Transcription error occurred.');
      setTranscribing(false);
    }
  };

  // Generate synthetic sample audio for demo if no microphone is handy
  const handleLoadSampleMedicalAudio = async () => {
    setTranscribing(true);
    setErrorMessage(null);

    // Provide a sample simulated audio transcription payload directly demonstrating gemini-3.5-transcribe behavior
    try {
      // Create a short WebAudio tone buffer to simulate an audio clip
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();

      const rec = new MediaRecorder(dst.stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        osc.stop();
        const sampleBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(sampleBlob);
        setAudioUrl(URL.createObjectURL(sampleBlob));
        transcribeAudio(sampleBlob);
      };
      rec.start();
      setTimeout(() => rec.stop(), 800);
    } catch (err) {
      // Fallback
      setTranscript(
        'Patient presents at General Outpatient Department with 4-day history of high fever, rigors, headache, and severe arthralgia. Genotype is Hb AS. Rapid Diagnostic Test positive for Plasmodium falciparum malaria. Vitals: BP 130/85 mmHg, Pulse 88 bpm, Temp 38.6°C. Plan: Prescribe Artemether-Lumefantrine (Coartem) 80/480mg 1 tab BD x 3 days, Tab Paracetamol 1g TDS x 3 days. Patient advised on bed rest and oral fluid hydration.'
      );
      setTranscribing(false);
    }
  };

  const copyToClipboard = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Audio Dictation & Voice Transcription</h3>
                <span className="text-[10px] font-mono bg-teal-800 text-teal-200 px-2 py-0.5 rounded font-bold">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Record doctor consultations, ward round notes, or triage audio for automatic speech-to-text.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Audio Input Controls Area */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center">
            
            {/* Live Recording Ring / Visualizer */}
            <div className="relative mb-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-lg ring-8 ring-rose-200 animate-pulse'
                  : audioBlob
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}>
                {isRecording ? (
                  <Square className="w-9 h-9 cursor-pointer" onClick={stopRecording} />
                ) : (
                  <Mic className="w-10 h-10 cursor-pointer" onClick={startRecording} />
                )}
              </div>
            </div>

            {/* Timer & Status */}
            <div className="space-y-1">
              <span className="font-mono text-xl font-black text-slate-900">
                {isRecording ? formatTime(recordingDuration) : audioBlob ? 'Recording Ready' : 'Ready to Record'}
              </span>
              <p className="text-xs text-slate-500">
                {isRecording
                  ? 'Listening via microphone... Speak clinical notes clearly.'
                  : 'Click the microphone button to start dictating, or upload an audio file below.'}
              </p>
            </div>

            {/* Recording Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Mic className="w-4 h-4" /> Start Dictation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Square className="w-4 h-4" /> Stop Recording
                </button>
              )}

              {/* Upload file button */}
              <label className="px-3.5 py-2 bg-white border border-slate-300 hover:border-teal-600 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-teal-700" />
                <span>Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Sample audio button */}
              <button
                type="button"
                onClick={handleLoadSampleMedicalAudio}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:border-teal-600 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Try Sample Dictation</span>
              </button>
            </div>

            {/* Audio Playback Element if audio available */}
            {audioUrl && (
              <div className="mt-4 w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-xl flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-teal-700 shrink-0" />
                <audio
                  ref={audioElementRef}
                  src={audioUrl}
                  controls
                  className="w-full h-8"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Transcribe Trigger Button */}
          {audioBlob && !transcript && (
            <button
              type="button"
              onClick={() => transcribeAudio()}
              disabled={transcribing}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {transcribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcribing with gemini-3.5-transcribe...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Transcribe Audio Now (gemini-3.5-transcribe)</span>
                </>
              )}
            </button>
          )}

          {/* Transcript Output Box */}
          {transcript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5 text-teal-700" />
                  <span>Generated Transcript</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  {onApplyTranscript && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyTranscript(transcript);
                        onClose();
                      }}
                      className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Insert into Note</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-52 overflow-y-auto">
                {transcript}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Model: <strong>gemini-3.5-transcribe</strong></span>
                <span>Word count: {transcript.trim().split(/\s+/).length} words</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Microphone audio processed securely via server-side Gemini API.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
