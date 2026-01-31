import { parseAnyRPCResponse } from '@erc7824/nitrolite';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
type MessageCallback = (data: any) => void;

/**
 * Yellow Network WebSocket Client
 * Manages connection to Yellow Network ClearNode for state channel operations
 */
class YellowNetworkClient {
    private ws: WebSocket | null = null;
    private status: ConnectionStatus = 'disconnected';
    private messageCallbacks: MessageCallback[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private wsUrl: string;
    private heartbeatInterval: number | null = null;
    private messageQueue: any[] = [];

    constructor() {
        this.wsUrl = import.meta.env.VITE_YELLOW_NETWORK_WS || 'wss://clearnet-sandbox.yellow.com/ws';
    }

    /**
     * Connect to Yellow Network ClearNode
     */
    async connectToYellow(): Promise<void> {
        if (this.status === 'connected' || this.status === 'connecting') {
            console.log('Already connected or connecting to Yellow Network');
            return;
        }

        return new Promise((resolve, reject) => {
            this.status = 'connecting';
            console.log('🔌 Connecting to Yellow Network...');

            try {
                this.ws = new WebSocket(this.wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ Connected to Yellow Network!');
                    this.status = 'connected';
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;

                    // Start heartbeat to keep connection alive
                    this.startHeartbeat();

                    // Send queued messages if any
                    this.flushMessageQueue();

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = parseAnyRPCResponse(event.data);
                        console.log('📨 Received from Yellow Network:', message);

                        // Notify all registered callbacks
                        this.messageCallbacks.forEach(callback => {
                            try {
                                callback(message);
                            } catch (error) {
                                console.error('Error in message callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('Error parsing Yellow Network message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ Yellow Network connection error:', error);
                    this.status = 'disconnected';
                    reject(error);
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 Yellow Network connection closed:', event.code, event.reason);
                    this.status = 'disconnected';
                    this.stopHeartbeat();

                    // Auto-reconnect with exponential backoff
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

                        setTimeout(() => {
                            this.connectToYellow().catch(err => {
                                console.error('Reconnection failed:', err);
                            });
                        }, delay);
                    } else {
                        console.error('Max reconnection attempts reached');
                    }
                };

            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                this.status = 'disconnected';
                reject(error);
            }
        });
    }

    /**
     * Disconnect from Yellow Network
     */
    disconnectFromYellow(): void {
        if (this.ws) {
            console.log('Disconnecting from Yellow Network...');
            this.stopHeartbeat();
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
            this.ws.close();
            this.ws = null;
            this.status = 'disconnected';
            this.messageCallbacks = [];
            this.messageQueue = [];
        }
    }

    /**
     * Send a message to Yellow Network
     * If connection is lost, queue the message for later
     */
    sendMessage(message: any): void {
        if (this.status === 'connected' && this.ws) {
            try {
                const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
                console.log('📤 Sending to Yellow Network:', message);
                this.ws.send(messageStr);
            } catch (error) {
                console.error('Failed to send message:', error);
                throw error;
            }
        } else {
            console.warn('⚠️ Connection not ready, queuing message');
            this.messageQueue.push(message);
        }
    }

    /**
     * Register a callback for incoming messages
     */
    onMessage(callback: MessageCallback): () => void {
        this.messageCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.messageCallbacks.indexOf(callback);
            if (index > -1) {
                this.messageCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Get current connection status
     */
    getConnectionStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.status === 'connected';
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = window.setInterval(() => {
            if (this.status === 'connected' && this.ws) {
                // Send ping message
                this.sendMessage({ type: 'ping', timestamp: Date.now() });
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Flush queued messages
     */
    private flushMessageQueue(): void {
        if (this.messageQueue.length > 0) {
            console.log(`📤 Flushing ${this.messageQueue.length} queued messages`);
            this.messageQueue.forEach(msg => this.sendMessage(msg));
            this.messageQueue = [];
        }
    }
}

// Export singleton instance with plan-compliant name
export const yellowNetwork = new YellowNetworkClient();

// Export types
export type { ConnectionStatus, MessageCallback };
