import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Music, 
  Play, 
  Pause, 
  Sparkles, 
  Download, 
  Volume2, 
  VolumeX, 
  Radio, 
  Disc, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { AIAccount, SunoTrack } from '../types';
import { getStoredSunoTracks, saveSunoTrack } from '../lib/storage';
import { generateSunoSong } from '../lib/ai-service';

interface SunoStudioViewProps {
  activeAccount: AIAccount;
}

const GENRE_TAGS = [
  'Cyberpunk Synthwave',
  'Lo-Fi Chillhop',
  'Future Bass / EDM',
  'Heavy Metal / Djent',
  'Acoustic Indie Pop',
  'Trap & Dark Hip-Hop',
  'Cinematic Orchestral',
  'Retro 80s Disco',
  'Ambient Soundscape'
];

export const SunoStudioView: React.FC<SunoStudioViewProps> = ({ activeAccount }) => {
  const [tracks, setTracks] = useState<SunoTrack[]>([]);
  const [prompt, setPrompt] = useState('Cyberpunk Synthwave with distorted analog basslines and vocoder vocals');
  const [selectedGenre, setSelectedGenre] = useState('Cyberpunk Synthwave');
  const [lyrics, setLyrics] = useState('');
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<SunoTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLyricsTrack, setSelectedLyricsTrack] = useState<SunoTrack | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const list = getStoredSunoTracks(activeAccount.id);
    setTracks(list);
    if (list.length > 0 && !currentTrack) {
      setCurrentTrack(list[0]);
    }
  }, [activeAccount.id]);

  const togglePlayTrack = (track: SunoTrack) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl || 'https://actions.google.com/sounds/v1/science_fiction/force_field_hum.ogg';
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const newTrack = await generateSunoSong(
        prompt, 
        selectedGenre, 
        isInstrumental ? '[Instrumental Only]' : lyrics,
        activeAccount.id
      );

      await saveSunoTrack(newTrack);
      setTracks(prev => [newTrack, ...prev]);
      setCurrentTrack(newTrack);
      setIsPlaying(true);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error('Failed to generate song', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F17]">
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl || 'https://actions.google.com/sounds/v1/science_fiction/force_field_hum.ogg'}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 180);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-indigo-950/30 border border-pink-500/30 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Disc className={`w-7 h-7 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white">Suno AI Music Studio</h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  V3.5 ENGINE
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Generate full radio-quality songs, lyrics, and stems from simple text prompts
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-400 flex items-center space-x-2 bg-gray-900/80 px-3.5 py-2 rounded-xl border border-gray-800">
            <Radio className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>Profile: <strong className="text-white">{activeAccount.name}</strong></span>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-[#0E131F] border border-gray-800 shadow-lg space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Song Prompt & Vibe Description
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Melodic Synthwave with nostalgic saxophone solo, punchy 80s drums and vocal hooks"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Style Preset Tags</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_TAGS.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => {
                    setSelectedGenre(genre);
                    setPrompt(prev => `${genre} - ${prev}`);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedGenre === genre
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 border border-pink-400'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Custom Lyrics (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="[Verse 1]&#10;Lines of neon flickering...&#10;[Chorus]&#10;Nexus rising in the dark!"
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                disabled={isInstrumental}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 font-mono disabled:opacity-40"
              />
            </div>

            <div className="flex flex-col justify-between p-3.5 rounded-xl bg-gray-950 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">Instrumental Track</span>
                  <p className="text-[11px] text-gray-400">Generate beat without vocal synthesis</p>
                </div>
                <input
                  type="checkbox"
                  checked={isInstrumental}
                  onChange={e => setIsInstrumental(e.target.checked)}
                  className="w-4 h-4 accent-pink-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-3 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Audio via Suno Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-pink-300" />
                    <span>Generate Suno Track</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Music className="w-4 h-4 text-pink-400" />
              <span>Your Suno Music Library ({tracks.length})</span>
            </h3>
            <span className="text-xs text-gray-500">Synced to {activeAccount.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tracks.map(track => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              return (
                <div
                  key={track.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    currentTrack?.id === track.id
                      ? 'bg-pink-950/20 border-pink-500/50 shadow-md'
                      : 'bg-[#0E131F] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden">
                    <button
                      onClick={() => togglePlayTrack(track)}
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${track.coverGradient} flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>

                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                      <p className="text-[11px] text-pink-400 truncate">{track.genre}</p>
                      <span className="text-[10px] text-gray-500">{formatSeconds(track.durationSeconds)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedLyricsTrack(track)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                      title="View Lyrics"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    {track.audioUrl && (
                      <a
                        href={track.audioUrl}
                        download={`${track.title}.ogg`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-pink-400 hover:bg-gray-800"
                        title="Download Audio"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {currentTrack && (
        <div className="h-20 border-t border-gray-800 bg-[#0E131F]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3 max-w-xs truncate">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentTrack.coverGradient} flex items-center justify-center shadow-md shrink-0`}>
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
              <div className="text-[10px] text-pink-400 truncate">{currentTrack.genre}</div>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-1 flex-1 max-w-md px-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => togglePlayTrack(currentTrack)}
                className="w-9 h-9 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-600/30 transition-transform hover:scale-105"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex items-center space-x-1 h-6">
                {[6, 14, 22, 10, 18, 24, 12, 16, 8, 20].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 bg-pink-400 rounded-full transition-all ${isPlaying ? 'wave-bar' : ''}`}
                    style={{ 
                      height: isPlaying ? undefined : `${h * 0.3}px`,
                      animationDelay: `${i * 0.1}s` 
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="w-full flex items-center space-x-2 text-[10px] text-gray-500 font-mono">
              <span>{formatSeconds(currentTime)}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden cursor-pointer">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="text-gray-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {selectedLyricsTrack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">{selectedLyricsTrack.title} (Lyrics)</h3>
              <button 
                onClick={() => setSelectedLyricsTrack(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap bg-gray-950 p-4 rounded-xl max-h-80 overflow-y-auto">
              {selectedLyricsTrack.lyrics || 'Instrumental Track'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
