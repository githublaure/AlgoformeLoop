import React, { useState, useRef } from "react";
import { useAuth } from "./auth-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useLocation } from "wouter";

interface LoginGuardProps {
  children: React.ReactNode;
}

export function LoginGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login, register, forgotPassword, error } =
    useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "hsl(210, 17%, 98%)" }}
      >
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "hsl(258, 71%, 65%)" }}
          >
            <img
              src="/pigeongangsta.png"
              alt="PigeonSub mascot"
              className="w-16 h-16 object-contain"
            />
          </div>
          <i
            className="fas fa-spinner fa-spin text-2xl mb-4"
            style={{ color: "hsl(258, 71%, 65%)" }}
          ></i>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showForgotPassword) {
      await forgotPassword(formData.email);
    } else if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(formData.name, formData.email, formData.password);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const setupVideoProcessing = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dessiner la frame vidéo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Obtenir les données d'image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Fonction améliorée pour détecter les contours et éléments importants
    const shouldKeepPixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      // Garder tous les pixels qui ne sont pas du fond noir pur
      if (r > 25 || g > 25 || b > 25) {
        return true;
      }

      // Pour les pixels sombres, vérifier s'ils sont près d'éléments colorés
      const checkRadius = 2; // Rayon de vérification élargi
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

            // Si un voisin proche a de la couleur, garder le pixel (contour)
            if (nr > 40 || ng > 40 || nb > 40) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Rendre transparent uniquement le fond noir pur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Si le pixel est très noir ET qu'il n'est pas un contour
        if (r < 15 && g < 15 && b < 15 && !shouldKeepPixel(x, y)) {
          data[i + 3] = 0; // Rendre transparent
        } else if (r < 25 && g < 25 && b < 25) {
          // Pour les pixels légèrement sombres, les garder mais avec plus d'opacité
          data[i + 3] = Math.max(data[i + 3], 200);
        }
      }
    }

    // Remettre les données modifiées
    ctx.putImageData(imageData, 0, 0);

    // Programmer la prochaine frame
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startTalkingPigeon = () => {
    if (videoRef.current && !isTalking) {
      // set state immediately so UI reflects play
      setIsTalking(true);
      // Enlever le mode muet pour activer le son
      videoRef.current.muted = false;
      videoRef.current.volume = 0.7; // Volume à 70%

      // play() may not return a promise in some environments; wrap in Promise.resolve
      try {
        const res = videoRef.current.play();
        Promise.resolve(res)
          .then(() => {
            processFrame();
          })
          .catch((error) => {
            // fallback: try playing muted
            console.log("Erreur de lecture audio:", error);
            videoRef.current!.muted = true;
            Promise.resolve(videoRef.current!.play())
              .then(() => {
                processFrame();
              })
              .catch(() => {});
          });
      } catch (error) {
        // synchronous throw - fallback
        videoRef.current.muted = true;
        try {
          Promise.resolve(videoRef.current.play())
            .then(() => {
              processFrame();
            })
            .catch(() => {});
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const stopTalkingPigeon = () => {
    if (videoRef.current && isTalking) {
      // stop playback and processing
      try {
        videoRef.current.pause();
      } catch (e) {
        // ignore in tests
      }
      try {
        videoRef.current.currentTime = 0;
      } catch (e) {}
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsTalking(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "hsl(210, 17%, 98%)" }}
      >
        <div className="w-full max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "hsl(258, 71%, 65%)" }}
            >
              <img
                src="/pigeongangsta.png"
                alt="PigeonSub mascot"
                className={`w-20 h-20 object-contain transition-opacity duration-300 ${isTalking ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              />
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "hsl(258, 71%, 65%)" }}
            >
              PigeonSub
            </h1>
            <p className="text-gray-600">
              "Comment être un pigeon... et s'en sortir"
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setLocation("/test")}
                className="text-sm text-purple-600 hover:text-purple-800 underline transition-colors block"
              >
                🎬 Voir la démo IA (test)
              </button>
              <button
                onClick={() =>
                  window.open("/test", "_blank", "width=1200,height=800")
                }
                className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors block"
              >
                🔗 test
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              <Card>
              <CardHeader>
                <CardTitle>{isLogin ? "Connexion" : "Inscription"}</CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Connectez-vous pour gérer vos abonnements"
                    : "Créez votre compte pour commencer"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && !showForgotPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={handleInputChange}
                        required={!isLogin}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {!showForgotPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <div className="text-red-600 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full pigeon-button-primary"
                  >
                    {isLoading
                      ? "Chargement..."
                      : showForgotPassword
                        ? "Envoyer le lien"
                        : isLogin
                          ? "Se connecter"
                          : "S'inscrire"}
                  </Button>

                  <div className="text-center space-y-2">
                    {!showForgotPassword && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsLogin(!isLogin)}
                          className="text-sm underline block mx-auto"
                          style={{ color: "hsl(258, 71%, 65%)" }}
                        >
                          {isLogin
                            ? "Créer un compte"
                            : "Déjà un compte ? Se connecter"}
                        </button>

                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm underline block mx-auto"
                            style={{ color: "hsl(258, 71%, 65%)" }}
                          >
                            Mot de passe oublié ?
                          </button>
                        )}
                      </>
                    )}

                    {showForgotPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setFormData({ name: "", email: "", password: "" });
                        }}
                        className="text-sm underline"
                        style={{ color: "hsl(258, 71%, 65%)" }}
                      >
                        Retour à la connexion
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/demo")}
                      className="text-sm w-full"
                    >
                      Voir la démo
                    </Button>
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <img
                      src="/pigeon1.png"
                      alt="Pigeon 1"
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => setLocation("/demo")}
                    />
                    <img
                      src="/pigeon2.png"
                      alt="Pigeon 2"
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => setLocation("/demo")}
                    />
                    <img
                      src="/pigeon3.png"
                      alt="Pigeon 3"
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => setLocation("/demo")}
                    />
                    <img
                      src="/pigeon4.png"
                      alt="Pigeon 4"
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => setLocation("/demo")}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Cliquez sur un pigeon pour voir la démo
                  </p>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Pigeon interactive area placed next to card */}
            <div className="relative flex-shrink-0 login-pigeon md:w-72 self-start mt-4 md:mt-0 md:border-l md:border-gray-200 md:border-opacity-20 md:pl-6">
              <canvas
                ref={canvasRef}
                className={`object-contain transition-all duration-300 pointer-events-none ${isTalking ? "opacity-100 pigeon-talk w-96 h-96" : "opacity-0 w-64 h-64"}`}
                style={{
                  display: "block",
                  borderRadius: "16px",
                }}
              />

              <video
                ref={videoRef}
                className="hidden"
                loop
                onEnded={() => setIsTalking(false)}
                onLoadedData={setupVideoProcessing}
              >
                <source src="/pigeon_talking.mp4" type="video/mp4" />
              </video>

              <img
                src="/pigeongangsta.png"
                alt="PigeonSub mascot"
                className={`object-contain transition-all duration-300 ${isTalking ? "opacity-0 pointer-events-none w-96 h-96" : "opacity-100 w-64 h-64"}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button
                  type="button"
                  aria-label="play-pigeon"
                  className={`w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg pointer-events-auto ${isTalking ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  onClick={startTalkingPigeon}
                >
                  <i className="fas fa-play text-white text-xl ml-1"></i>
                </button>
              </div>

              <div
                className={`absolute bottom-6 right-3 ${isTalking ? "" : "pointer-events-none opacity-0"}`}
              >
                <button
                  type="button"
                  aria-label="stop-pigeon"
                  title="Stop"
                  className={`bg-red-500 rounded-full flex items-center gap-2 text-white px-2 py-1 shadow-lg ${isTalking ? "opacity-100" : ""}`}
                  onClick={stopTalkingPigeon}
                >
                  <i className="fas fa-stop"></i>
                  <span className="text-sm font-medium">Stop</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
