export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private inputContext: AudioContext | null = null;
  public mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private activeAudioChunks = 0;

  private onMessageCallback: (text: string) => void = () => {};
  private onAudioLevelCallback: (level: number) => void = () => {};
  private onAiAudioLevelCallback: (level: number) => void = () => {};
  private onErrorCallback: (error: string) => void = () => {};
  private onStatusChangeCallback: (status: 'connected' | 'disconnected' | 'connecting') => void = () => {};
  private onAiTalkingCallback: (isTalking: boolean) => void = () => {};
  private onToolCallCallback: (toolCall: any) => Promise<any> = async () => ({});

  constructor(
    private apiKey: string,
    private model: string = "gemini-3.1-flash-live-preview"
  ) {}

  public setCallbacks(callbacks: {
    onMessage?: (text: string) => void;
    onAudioLevel?: (level: number) => void;
    onAiAudioLevel?: (level: number) => void;
    onError?: (error: string) => void;
    onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void;
    onAiTalking?: (isTalking: boolean) => void;
    onToolCall?: (toolCall: any) => Promise<any>;
  }) {
    if (callbacks.onMessage) this.onMessageCallback = callbacks.onMessage;
    if (callbacks.onAudioLevel) this.onAudioLevelCallback = callbacks.onAudioLevel;
    if (callbacks.onAiAudioLevel) this.onAiAudioLevelCallback = callbacks.onAiAudioLevel;
    if (callbacks.onError) this.onErrorCallback = callbacks.onError;
    if (callbacks.onStatusChange) this.onStatusChangeCallback = callbacks.onStatusChange;
    if (callbacks.onAiTalking) this.onAiTalkingCallback = callbacks.onAiTalking;
    if (callbacks.onToolCall) this.onToolCallCallback = callbacks.onToolCall;
  }

  public async connect(systemInstruction?: string) {
    if (!this.apiKey) {
      this.onErrorCallback("API Key is required for Gemini Live");
      this.onStatusChangeCallback('disconnected');
      return;
    }

    this.onStatusChangeCallback('connecting');
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

    try {
      console.log("[GeminiLive] Connecting to WebSocket...");
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[GeminiLive] WebSocket connected!");
        this.onStatusChangeCallback('connected');
        this.sendSetup(systemInstruction);
      };

      this.ws.onmessage = async (event) => {
        try {
          let text: string;
          if (event.data instanceof Blob) {
            text = await event.data.text();
          } else if (typeof event.data === 'string') {
            text = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            text = new TextDecoder().decode(event.data);
          } else {
            text = String(event.data);
          }
          if (!text || text === "[object Blob]" || text === "[object ArrayBuffer]") return;
          const data = JSON.parse(text);
          this.handleResponse(data);
        } catch (e) {
          // skip parse errors
        }
      };

      this.ws.onerror = (e) => {
        console.error("[GeminiLive] WebSocket error:", e);
        this.onErrorCallback("WebSocket connection error. Ensure your API key is valid.");
        this.onStatusChangeCallback('disconnected');
      };

      this.ws.onclose = (event) => {
        console.log("[GeminiLive] WebSocket closed:", event.code, event.reason);
        this.onStatusChangeCallback('disconnected');
        this.stop();
      };
    } catch (e) {
      console.error("[GeminiLive] Connection error:", e);
      this.onErrorCallback("Failed to establish WebSocket connection");
      this.onStatusChangeCallback('disconnected');
    }
  }

  private sendSetup(systemInstruction?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const modelPath = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    const setup = {
      setup: {
        model: modelPath,
        system_instruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Puck" } } },
          thinking_config: { thinking_level: "minimal" }
        },
        // TEMPLATE NOTE: the example IDs in these tool descriptions are a MASSIVE signal to
        // Gemini Live about what valid IDs look like. When you transform for a new brand you
        // MUST replace the example IDs below with real ids from your brand's cards.ts and
        // solutions.ts. Leaving the default "chase-sapphire-preferred" example on a luxury or
        // SaaS brand causes Gemini to either refuse to call the tool, or call it with made-up
        // card IDs that don't exist in productItems — the left panel stays empty during the
        // voice call. See SKILL.md "Known template residues".
        tools: [{
          function_declarations: [
            {
              name: "show_card",
              description: "Display a specific product on the user's screen. Call this IMMEDIATELY when the user asks to see/show/browse/compare anything in the catalog. The id must be one of the AVAILABLE PRODUCTS listed in the system instruction.",
              parameters: {
                type: "OBJECT",
                properties: {
                  card_id: { type: "STRING", description: "The product id from the AVAILABLE PRODUCTS list. TEMPLATE: replace this example with a real id from your brand's cards.ts (e.g., 'jadore-edp' for Dior, 'chase-sapphire-preferred' for Visa, 'stripe-payments' for Stripe)." }
                },
                required: ["card_id"]
              }
            },
            {
              name: "show_solution",
              description: "Display a collection or solution on the user's screen. Call this when the user asks about a category, line, or broader product family.",
              parameters: {
                type: "OBJECT",
                properties: {
                  solution_id: { type: "STRING", description: "The solution/collection id from the AVAILABLE COLLECTIONS list. TEMPLATE: replace this example with a real id from your brand's solutions.ts (e.g., 'cruise-2026' for Dior, 'tap-to-pay' for Visa, 'payments' for Stripe)." }
                },
                required: ["solution_id"]
              }
            }
          ]
        }]
      }
    };

    this.ws.send(JSON.stringify(setup));
  }

  private async handleResponse(response: any) {
    if (response.serverContent) {
      const modelTurn = response.serverContent.modelTurn;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.inlineData) {
            this.playAudioChunk(this.base64ToUint8Array(part.inlineData.data));
          }
          if (part.text) {
            this.onMessageCallback(part.text);
          }
          if (part.functionCall) {
            const result = await this.onToolCallCallback(part.functionCall);
            this.sendToolResponse(part.functionCall.name, part.functionCall.call_id || part.functionCall.id, result);
          }
        }
      }
      if (response.serverContent.interrupted) {
        this.stopAudioPlayback();
        this.onAiTalkingCallback(false);
      }
    }
    if (response.setupComplete) {
      this.startMedia('audio');
    }
  }

  private sendToolResponse(name: string, id: string, result: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      tool_response: { function_responses: [{ name, id, response: { result } }] }
    }));
  }

  private base64ToUint8Array(base64: string) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  private stopAudioPlayback() {
    this.nextStartTime = 0;
    this.activeAudioChunks = 0;
  }

  private async playAudioChunk(audioData: Uint8Array) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();

      const int16Data = new Int16Array(audioData.buffer, audioData.byteOffset, Math.floor(audioData.byteLength / 2));
      const float32Data = new Float32Array(int16Data.length);
      let sum = 0;
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
        sum += Math.abs(float32Data[i]);
      }
      this.onAiAudioLevelCallback(sum / int16Data.length);

      const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
      this.activeAudioChunks++;
      this.onAiTalkingCallback(true);

      source.onended = () => {
        this.activeAudioChunks--;
        if (this.activeAudioChunks <= 0) {
          this.activeAudioChunks = 0;
          this.onAiTalkingCallback(false);
          this.onAiAudioLevelCallback(0);
        }
      };
    } catch (e) {
      console.error("Error playing audio:", e);
    }
  }

  public async startMedia(mode: 'camera' | 'screen' | 'audio' = 'audio') {
    try {
      if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());

      if (mode === 'camera') {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
      } else if (mode === 'screen') {
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      } else {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      await this.startAudioProcessing();
      if (mode !== 'audio') this.startVideoProcessing();
    } catch {
      this.onErrorCallback("Could not access camera/microphone. Please check permissions.");
    }
  }

  private async startAudioProcessing() {
    if (!this.mediaStream || !this.mediaStream.getAudioTracks().length) return;
    try {
      if (this.processor) this.processor.disconnect();
      if (this.source) this.source.disconnect();
      if (this.inputContext) await this.inputContext.close();

      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (this.inputContext.state === 'suspended') await this.inputContext.resume();

      this.source = this.inputContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        this.onAudioLevelCallback(Math.sqrt(sum / inputData.length));

        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        this.sendAudio(int16Data);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.inputContext.destination);
    } catch (e) {
      console.error("Error starting audio:", e);
    }
  }

  private sendAudio(data: Int16Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const bytes = new Uint8Array(data.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    this.ws.send(JSON.stringify({
      realtime_input: { audio: { data: btoa(binary), mime_type: "audio/pcm;rate=16000" } }
    }));
  }

  private videoInterval: any = null;

  private startVideoProcessing() {
    if (!this.mediaStream || !this.mediaStream.getVideoTracks().length) return;
    const video = document.createElement('video');
    video.srcObject = this.mediaStream;
    video.muted = true;
    video.play();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (this.videoInterval) clearInterval(this.videoInterval);
    this.videoInterval = setInterval(() => {
      if (!ctx || !this.ws || this.ws.readyState !== WebSocket.OPEN || video.videoWidth === 0) return;
      const scale = Math.min(640 / video.videoWidth, 640 / video.videoHeight, 1);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.ws.send(JSON.stringify({
        realtime_input: { video: { data: canvas.toDataURL('image/jpeg', 0.5).split(',')[1], mime_type: "image/jpeg" } }
      }));
    }, 1000);
  }

  public stop() {
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    if (this.videoInterval) { clearInterval(this.videoInterval); this.videoInterval = null; }
    if (this.audioContext) { this.audioContext.close().catch(() => {}); this.audioContext = null; }
    if (this.inputContext) { this.inputContext.close().catch(() => {}); this.inputContext = null; }
    this.onStatusChangeCallback('disconnected');
  }
}
