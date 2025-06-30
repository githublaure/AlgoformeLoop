export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface ElevenLabsRequest {
  text: string;
  model_id?: string;
  voice_settings?: VoiceSettings;
}

export async function generateSpeech(
  text: string,
  voiceId: string = "21m00Tcm4TlvDq8ikWAM", // Default voice
  apiKey?: string
): Promise<ArrayBuffer> {
  const key = apiKey || import.meta.env.VITE_ELEVEN_LABS_API_KEY || "default_key";
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": key
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    } as ElevenLabsRequest)
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

export function createAudioUrl(audioBuffer: ArrayBuffer): string {
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}
