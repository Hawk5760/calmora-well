import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Moon, Play, Pause, RotateCcw, Timer, Waves, Wind } from "lucide-react";

const useSEO = (title: string, description: string, canonicalPath = "/sleep") => {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + canonicalPath;
  }, [title, description, canonicalPath]);
};

interface SleepSession {
  id: string;
  durationMinutes: number;
  startedAt: number;
  endedAt?: number;
}

export const SleepZonePage = () => {
  useSEO("Sleep Zone | Calmora", "Wind down with a gentle sleep timer and soothing ambient sounds.");

  const [duration, setDuration] = useState(30); // minutes
  const [remaining, setRemaining] = useState(30 * 60); // seconds
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef<SleepSession | null>(null);

  // Simple ambient generators
  const audioCtxRef = useRef<AudioContext | null>(null);
  const waveOscRef = useRef<OscillatorNode | null>(null);
  const waveGainRef = useRef<GainNode | null>(null);
  const windOscRef = useRef<OscillatorNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const [wavesOn, setWavesOn] = useState(false);
  const [windOn, setWindOn] = useState(false);
  const [volume, setVolume] = useState(30);

  useEffect(() => {
    setRemaining(duration * 60);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopAllAudio();
    };
  }, []);

  const start = () => {
    if (running) return;
    setRunning(true);
    if (!sessionRef.current) {
      sessionRef.current = {
        id: crypto.randomUUID(),
        durationMinutes: duration,
        startedAt: Date.now(),
      };
    }
    timerRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          stop();
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
  };

  const stop = () => {
    pause();
  };

  const reset = () => {
    pause();
    setRemaining(duration * 60);
    sessionRef.current = null;
  };

  const completeSession = () => {
    if (!sessionRef.current) return;
    sessionRef.current.endedAt = Date.now();
    const existing: SleepSession[] = JSON.parse(localStorage.getItem("sleepSessions") || "[]");
    existing.push(sessionRef.current);
    localStorage.setItem("sleepSessions", JSON.stringify(existing));
    sessionRef.current = null;
  };

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const setMasterVolume = (v: number) => {
    setVolume(v);
    const gain = (node: GainNode | null) => node && node.gain.setValueAtTime(v / 100 * 0.3, audioCtxRef.current!.currentTime);
    if (waveGainRef.current) gain(waveGainRef.current);
    if (windGainRef.current) gain(windGainRef.current);
  };

  const toggleWaves = () => {
    ensureAudio();
    if (wavesOn) {
      waveOscRef.current?.stop();
      waveOscRef.current = null;
      setWavesOn(false);
      return;
    }
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    gain.gain.setValueAtTime(volume / 100 * 0.25, ctx.currentTime);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    waveOscRef.current = osc;
    waveGainRef.current = gain;
    setWavesOn(true);
  };

  const toggleWind = () => {
    ensureAudio();
    if (windOn) {
      windOscRef.current?.stop();
      windOscRef.current = null;
      setWindOn(false);
      return;
    }
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    gain.gain.setValueAtTime(volume / 100 * 0.15, ctx.currentTime);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    windOscRef.current = osc;
    windGainRef.current = gain;
    setWindOn(true);
  };

  const stopAllAudio = () => {
    try { waveOscRef.current?.stop(); } catch {}
    try { windOscRef.current?.stop(); } catch {}
    waveOscRef.current = null; windOscRef.current = null;
    setWavesOn(false); setWindOn(false);
  };

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = Math.floor(remaining % 60).toString().padStart(2, "0");

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-soul">Sleep Zone</h1>
          <p className="text-muted-foreground mt-2">A gentle place to wind down with a sleep timer and soothing ambience</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Sleep Timer</h2>
            </div>

            <div className="text-center mb-4">
              <div className="text-5xl font-bold tracking-wider">{mm}:{ss}</div>
              <p className="text-sm text-muted-foreground">Duration: {duration} min</p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[15, 30, 45, 60].map(d => (
                <Button key={d} variant={duration===d?"soul":"outline"} onClick={() => { setDuration(d); setRemaining(d*60); }}>
                  {d}m
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {running ? (
                <Button onClick={pause} className="flex-1">
                  <Pause className="w-4 h-4 mr-2"/> Pause
                </Button>
              ) : (
                <Button onClick={start} className="flex-1">
                  <Play className="w-4 h-4 mr-2"/> Start
                </Button>
              )}
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="w-4 h-4"/>
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Sleep Ambience</h2>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2"><Waves className="w-4 h-4"/> Soft Waves</div>
                <Button variant={wavesOn?"soul":"outline"} size="sm" onClick={toggleWaves}>{wavesOn?"Stop":"Play"}</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2"><Wind className="w-4 h-4"/> Gentle Wind</div>
                <Button variant={windOn?"soul":"outline"} size="sm" onClick={toggleWind}>{windOn?"Stop":"Play"}</Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Volume: {volume}%</div>
              <Slider value={[volume]} max={100} step={1} onValueChange={v => setMasterVolume(v[0])} />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default SleepZonePage;
