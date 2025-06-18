export class SpeechToText {
  private ws: WebSocket | null = null;
  private onData: (data: any) => void;
  private onError: (error: string) => void;
  private isRecording: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: number = 1000; // 1 second

  constructor(
    onData: (data: any) => void,
    onError: (error: string) => void
  ) {
    this.onData = onData;
    this.onError = onError;
  }

  async connect() {
    try {
      this.ws = new WebSocket('ws://localhost:5000/ws/transcribe');
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onData(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.onError('Error parsing server response');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError('Connection error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.ws = null;
        this.isRecording = false;
      };

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket not initialized'));
          return;
        }

        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          this.isRecording = true;
          resolve(true);
        };

        // Set a timeout for the connection
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.onError('Failed to connect to server');
      throw error;
    }
  }

  async stopRecording() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        // Don't send stop_recording message here anymore
        // this.ws.send(JSON.stringify({ type: 'stop_recording' }));
        this.isRecording = false;
      } catch (error) {
        console.error('Error stopping recording:', error);
        this.onError('Failed to stop recording');
      }
    }
  }

  async sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
        this.onError('Failed to send message');
      }
    }
  }

  async stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isRecording = false;
    }
  }

  isActive() {
    return this.isRecording;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }
} 