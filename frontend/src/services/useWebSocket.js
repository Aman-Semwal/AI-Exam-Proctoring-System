import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

/**
 * React hook that connects to the backend STOMP/WebSocket endpoint
 * and subscribes to proctoring alert topics for the given exam IDs.
 *
 * @param {Object}   opts
 * @param {number[]} opts.examIds    — active exam IDs to subscribe to
 * @param {Function} opts.onAlert    — called with (alertMessage, examId) on each push
 * @param {boolean}  [opts.enabled]  — set false to skip connection entirely (default: true)
 *
 * @returns {{ status: 'connected'|'connecting'|'disconnected' }}
 */
export default function useWebSocket({ examIds = [], onAlert, enabled = true }) {
  const [status, setStatus] = useState("disconnected");
  const clientRef = useRef(null);
  const onAlertRef = useRef(onAlert);

  // Keep callback ref fresh without re-triggering effect
  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token || !enabled) return;

    // Tear down any previous client
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }

    const wsBaseUrl =
      import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:8080";

    const client = new Client({
      // SockJS factory — matches backend's `.withSockJS()`
      webSocketFactory: () => new SockJS(`${wsBaseUrl}/ws`),

      // JWT auth on STOMP CONNECT
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      // Auto-reconnect after 5 seconds
      reconnectDelay: 5000,

      onConnect: () => {
        setStatus("connected");

        // Subscribe to each active exam's alert topic
        examIds.forEach((examId) => {
          client.subscribe(`/topic/alerts/${examId}`, (message) => {
            try {
              const alert = JSON.parse(message.body);
              onAlertRef.current?.(alert, examId);
            } catch {
              // non-JSON message — ignore
            }
          });
        });
      },

      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers?.message || frame);
        setStatus("disconnected");
      },

      onWebSocketClose: () => {
        setStatus("connecting"); // reconnecting via reconnectDelay
      },

      onDisconnect: () => {
        setStatus("disconnected");
      },
    });

    clientRef.current = client;
    setStatus("connecting");
    client.activate();
  }, [examIds.join(","), enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect/reconnect when examIds or enabled changes
  useEffect(() => {
    if (!enabled || examIds.length === 0) {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      setStatus("disconnected");
      return;
    }

    connect();

    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      setStatus("disconnected");
    };
  }, [connect]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status };
}
