import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket-client';
import { TelemetryEvents } from '@farmer-platform/types';
import type { LiveTelemetryPayload } from '@farmer-platform/types';

export function useTelemetry(jobId: string) {
    const [latestPoint, setLatestPoint] = useState<LiveTelemetryPayload | null>(null);
    const [history, setHistory] = useState<LiveTelemetryPayload[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = socketClient.getSocket();

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        const onUpdate = (payload: LiveTelemetryPayload) => {
            if (payload.jobId === jobId) {
                setLatestPoint(payload);
                setHistory((prev) => [...prev.slice(-100), payload]);
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on(TelemetryEvents.LIVE_UPDATE, onUpdate);

        socketClient.connect();

        // Subscribe to job updates
        socket.emit(TelemetryEvents.SUBSCRIBE, { jobId });

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off(TelemetryEvents.LIVE_UPDATE, onUpdate);
            socket.emit(TelemetryEvents.UNSUBSCRIBE, { jobId });
        };
    }, [jobId]);

    const startSimulation = useCallback((tractorId: string) => {
        const socket = socketClient.getSocket();
        socket.emit('telemetry:simulate:start', { jobId, tractorId });
    }, [jobId]);

    const stopSimulation = useCallback(() => {
        const socket = socketClient.getSocket();
        socket.emit('telemetry:simulate:stop', { jobId });
    }, [jobId]);

    return {
        latestPoint,
        history,
        isConnected,
        startSimulation,
        stopSimulation
    };
}
