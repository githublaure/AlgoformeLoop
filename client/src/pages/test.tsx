import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Test() {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [renderMode, setRenderMode] = useState<"canvas" | "video">("canvas");
  const [isMuted, setIsMuted] = useState(false);

  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const assets = {
    background: "/test/video1m44.mp4",
    avatar: "/pigeon_talking.mp4",
    voice: "/test/fit-attention presentation.mp3",
  };

  useEffect(() => {
    return () => {
      stopDemo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupCanvas = () => {
    const avatarVideo = avatarVideoRef.current;
    const canvas = canvasRef.current;
    if (!avatarVideo || !canvas) return;

    if (
      avatarVideo.readyState >= 1 &&
      avatarVideo.videoWidth &&
      avatarVideo.videoHeight
    ) {
      canvas.width = avatarVideo.videoWidth;
      canvas.height = avatarVideo.videoHeight;
      setRenderMode("canvas");
    } else {
      setTimeout(setupCanvas, 100);
    }
  };

  const processFrame = () => {
    const avatarVideo = avatarVideoRef.current;
    const canvas = canvasRef.current;
    if (!avatarVideo || !canvas || avatarVideo.paused || avatarVideo.ended)
      return;

    if (!avatarVideo.videoWidth || !avatarVideo.videoHeight) {
      setRenderMode("video");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setRenderMode("video");
      return;
    }

    ctx.drawImage(avatarVideo, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const shouldKeepPixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      if (r > 25 || g > 25 || b > 25) return true;

      const checkRadius = 2;
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIndex = (ny * width + nx) * 4;
            const nr = data[nIndex];
            const ng = data[nIndex + 1];
            const nb = data[nIndex + 2];
            if (nr > 40 || ng > 40 || nb > 40) return true;
          }
        }
      }
      return false;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r < 15 && g < 15 && b < 15 && !shouldKeepPixel(x, y)) {
          data[i + 3] = 0;
        } else if (r < 25 && g < 25 && b < 25) {
          data[i + 3] = Math.max(data[i + 3], 200);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startDemo = async () => {
    const avatarVideo = avatarVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    const voice = voiceRef.current;

    if (!avatarVideo || !backgroundVideo || !voice) return;

    setIsPaused(false);
    setupCanvas();

    try {
      await backgroundVideo.play();
    } catch (error) {
      console.error("Lecture vidéo de fond impossible", error);
    }

    try {
      voice.muted = isMuted;
      await voice.play();
    } catch (error) {
      console.error("Lecture audio impossible", error);
    }

    avatarVideo.currentTime = 0;
    avatarVideo.muted = true;
    try {
      await avatarVideo.play();
      setIsPlaying(true);
      setRenderMode("canvas");
      processFrame();
    } catch (error) {
      console.error("Lecture avatar impossible", error);
      setRenderMode("video");
      setIsPlaying(true);
      processFrame();
    }
  };

  const togglePause = async () => {
    const avatarVideo = avatarVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    const voice = voiceRef.current;

    if (!avatarVideo || !backgroundVideo || !voice || !isPlaying) return;

    if (isPaused) {
      try {
        await backgroundVideo.play();
      } catch (error) {
        console.error("Reprise vidéo de fond impossible", error);
      }

      try {
        await avatarVideo.play();
        processFrame();
      } catch (error) {
        console.error("Reprise avatar impossible", error);
      }

      try {
        await voice.play();
      } catch (error) {
        console.error("Reprise audio impossible", error);
      }

      setIsPaused(false);
      return;
    }

    avatarVideo.pause();
    backgroundVideo.pause();
    voice.pause();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsPaused(true);
  };

  const stopDemo = () => {
    const avatarVideo = avatarVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    const voice = voiceRef.current;

    avatarVideo?.pause();
    backgroundVideo?.pause();
    if (voice) {
      voice.pause();
      voice.currentTime = 0;
    }

    if (avatarVideo) {
      avatarVideo.currentTime = 0;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (voiceRef.current) {
        voiceRef.current.muted = next;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-visible pt-28">
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div className="relative w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 -top-14 sm:-top-16 flex justify-center z-50 pointer-events-none">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 drop-shadow-2xl">
              <div className="absolute inset-0 rounded-full bg-pink-200/90 border-4 border-pink-300 shadow-[0_20px_80px_rgba(244,114,182,0.35)]" />
              <div className="absolute inset-2 sm:inset-3 rounded-full overflow-hidden bg-pink-50/90 backdrop-blur-lg">
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full rounded-full ${renderMode === 'canvas' ? 'block' : 'hidden'}`}
                />
                <video
                  ref={avatarVideoRef}
                  src={assets.avatar}
                  className={`absolute inset-0 w-full h-full object-contain rounded-full ${renderMode === 'video' ? 'block' : 'hidden'}`}
                  loop
                  playsInline
                  muted
                  onLoadedMetadata={setupCanvas}
                />
              </div>
              <div className="absolute inset-0 pointer-events-none" />
            </div>
          </div>

          <div className="relative z-40 mt-12 sm:mt-14 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 border border-white/10 shadow-2xl px-6 sm:px-8 py-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center space-x-4 sm:space-x-5">
              <img src="/pigeongangsta.png" alt="PigeonSubcription" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white/20" />
              <div>
                <p className="text-sm sm:text-base text-white/70">Démo temps réel</p>
                <p className="text-xl sm:text-2xl font-semibold">PigeonSubscription</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Button
                onClick={() => setLocation('/')}
                className="w-full font-bold bg-white text-purple-800 shadow-2xl border border-purple-200 hover:bg-white rounded-full px-5 py-2 sm:w-auto"
              >
                <i className="fas fa-arrow-left mr-2"></i>Retour
              </Button>
              <Button
                onClick={toggleMute}
                variant="outline"
                className="w-full font-bold bg-white text-purple-800 border-purple-200 shadow-xl hover:bg-white rounded-full px-5 py-2 sm:w-auto"
              >
                {isMuted ? "🔇 Son coupé" : "🔊 Son actif"}
              </Button>
              <Button
                onClick={startDemo}
                className="w-full font-bold bg-green-400 text-green-950 shadow-xl hover:bg-green-500 rounded-full px-5 py-2 sm:w-auto"
                disabled={isPlaying}
              >
                ▶️ Démarrer
              </Button>
              <Button
                onClick={togglePause}
                variant="outline"
                className="w-full font-bold bg-white text-purple-800 border-purple-200 shadow-xl hover:bg-white rounded-full px-5 py-2 sm:w-auto"
                disabled={!isPlaying}
              >
                {isPaused ? "▶️ Reprendre" : "⏸ Pause"}
              </Button>
              <Button
                onClick={stopDemo}
                variant="outline"
                className="w-full font-bold bg-white text-red-600 border-red-200 shadow-xl hover:bg-white rounded-full px-5 py-2 sm:w-auto"
              >
                ⏹ Stop
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-6xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          <video
            ref={backgroundVideoRef}
            src={assets.background}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        </div>
      </div>

      <audio ref={voiceRef} src={assets.voice} />
    </div>
  );
}
