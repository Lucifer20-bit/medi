import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  ExternalLink, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  Sparkles, 
  BookOpen, 
  RefreshCw,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface MedicalSearchModalProps {
  onClose: () => void;
  initialQuery?: string;
}

export const MedicalSearchModal: React.FC<MedicalSearchModalProps> = ({
  onClose,
  initialQuery = 'NAFDAC recent drug recalls and fake medications warnings Nigeria',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    answer: string;
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: Array<{
        web?: {
          uri: string;
          title: string;
        };
      }>;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quickTopics = [
    { label: 'NAFDAC Drug Recalls', q: 'Recent NAFDAC drug recalls fake medications and alerts Nigeria' },
    { label: 'NCDC Outbreak Alerts', q: 'Latest NCDC disease outbreak advisory updates Cholera Lassa fever Nigeria' },
    { label: 'Malaria Treatment Guidelines', q: 'National Malaria Elimination Programme Nigeria latest ACT dosage guidelines' },
    { label: 'Maternal & Neonatal Protocols', q: 'Federal Ministry of Health Nigeria maternal health emergency guidelines' },
  ];

  const handleSearch = async (searchQ: string) => {
    if (!searchQ.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/medical-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQ }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResult({
          answer: data.answer,
          groundingMetadata: data.groundingMetadata,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch medical intelligence');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with Google Search grounding service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Real-Time Clinical & NAFDAC Intelligence</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                  Google Search Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Live fact-checking against NAFDAC, NCDC, WHO Africa & current medical news
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drug recalls, clinical protocols, NCDC outbreak advisories..."
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Searching...' : 'Search Google'}</span>
            </button>
          </form>

          {/* Quick Topics */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="text-[10px] text-slate-500 font-bold self-center mr-1">Quick Topics:</span>
            {quickTopics.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setQuery(item.q);
                  handleSearch(item.q);
                }}
                className="text-[10px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Consulting real-time Google Search results & Nigerian health databases...</p>
            </div>
          )}

          {!isLoading && searchResult && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 text-slate-700 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Clinical & Regulatory Findings</span>
                </div>
                <div className="whitespace-pre-line font-sans text-slate-800 leading-relaxed text-xs">
                  {searchResult.answer}
                </div>
              </div>

              {/* Grounding Web Sources */}
              {searchResult.groundingMetadata?.groundingChunks && searchResult.groundingMetadata.groundingChunks.length > 0 && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">
                    Verified Google Search Web Sources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.groundingMetadata.groundingChunks.map((chunk, idx) => {
                      if (!chunk.web?.uri) return null;
                      return (
                        <a
                          key={idx}
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[200px]">{chunk.web.title || chunk.web.uri}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && !searchResult && !error && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">Search for live medical alerts or clinical guidelines</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Queries are grounded with live Google Search results, allowing Nigerian hospital staff to verify recent NAFDAC warnings, drug recalls, or NCDC epidemic news.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
