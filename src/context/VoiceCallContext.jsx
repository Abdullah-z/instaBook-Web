import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { SocketContext } from "./SocketContext";
import { AuthContext } from "./AuthContext";
import { toast } from "react-toastify";

// Pre-configure Agora
AgoraRTC.onAutoplayFailed = () => {
  console.warn("[VoiceCall] Autoplay failed. Click for audio.");
  toast.info("Click anywhere to enable call audio", {
    toastId: "autoplay-fail",
    autoClose: 5000,
  });
};

AgoraRTC.onAudioAutoplayPaused = () => {
  console.warn("[VoiceCall] Audio autoplay paused. User interaction required.");
  toast.info("Audio paused by browser. Click to resume.", {
    toastId: "audio-paused",
    autoClose: 10000,
  });
};

export const VoiceCallContext = createContext();

export const VoiceCallProvider = ({ children }) => {
  const { socket } = useContext(SocketContext) || {};
  const { user } = useContext(AuthContext) || {};

  const [callState, setCallState] = useState({
    inCall: false,
    incomingCall: false,
    caller: null,
    recipient: null,
    isVideo: false,
    joined: false,
  });

  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);

  // Use a ref for client to persist across renders
  const client = useRef(null);
  if (!client.current) {
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }

  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isMicBoosted, setIsMicBoosted] = useState(false); // DEFAULT TO OFF to avoid clipping
  const [microphones, setMicrophones] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const audioRef = useRef(new Audio("/sounds/ringtone.mp3"));

  // --- Helpers ---

  // Generate Channel Name (Same as mobile)
  const generateChannelName = (userId1, userId2) => {
    if (!userId1 || !userId2) return "";
    const ids = [String(userId1), String(userId2)].sort();
    return `call_${ids[0]}_${ids[1]}`;
  };

  // Fetch Token (Same as mobile logic)
  // --- Device Management ---
  const updateMicDevices = useCallback(async () => {
    try {
      const devices = await AgoraRTC.getMicrophones();
      setMicrophones(devices);
      console.log(`[VoiceCall] Found ${devices.length} microphones:`, devices);
      if (devices.length > 0 && !selectedMicId) {
        setSelectedMicId(devices[0].deviceId);
      }
    } catch (err) {
      console.error("[VoiceCall] Failed to get microphones:", err);
    }
  }, [selectedMicId]);

  useEffect(() => {
    updateMicDevices();
    AgoraRTC.onMicrophoneChanged = (info) => {
      console.log("[VoiceCall] Microphone device changed:", info);
      updateMicDevices();
    };
  }, [updateMicDevices]);

  const setMicrophone = async (deviceId) => {
    console.log(`[VoiceCall] Switching to microphone: ${deviceId}`);
    setSelectedMicId(deviceId);
    if (localAudioTrack) {
      try {
        await localAudioTrack.setDevice(deviceId);
        toast.success("Microphone updated");
      } catch (err) {
        console.error("[VoiceCall] Failed to set microphone device:", err);
        toast.error("Failed to switch microphone");
      }
    }
  };

  const fetchAgoraToken = async (channelName, uid) => {
    try {
      // Direct hardcoded URL to match mobile's success
      const response = await fetch(
        `https://instabook-server-production.up.railway.app/api/agora/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelName,
            uid,
            role: "publisher",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch token");
      }

      const data = await response.json();
      console.log("✅ Token fetched successfully for channel:", channelName);
      return data; // Return full data { token, appId }
    } catch (err) {
      console.error("Failed to fetch Agora token:", err);
      return null;
    }
  };

  const cleanupResources = useCallback(async () => {
    // Stop Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }

    // Close Tracks
    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    setRemoteUsers([]);
    setCallDuration(0);
    setIsMicEnabled(true);
    setIsVideoEnabled(false);
    setIsSpeakerEnabled(true);

    // Leave Channel
    if (client.current) {
      const state = client.current.connectionState;
      console.log(`[VoiceCall] cleanupResources: connectionState is ${state}`);

      // Only call leave if we are in a state that allows it
      if (
        state === "CONNECTED" ||
        state === "CONNECTING" ||
        state === "RECONNECTING"
      ) {
        try {
          await client.current.leave();
          console.log(
            "[VoiceCall] cleanupResources: left channel successfully",
          );
        } catch (e) {
          console.log("Agora leave error", e);
        }
      } else {
        console.log(
          "[VoiceCall] cleanupResources: skipping leave as client is already",
          state,
        );
      }
    }
  }, [localAudioTrack, localVideoTrack]);

  const leaveCall = useCallback(async () => {
    await cleanupResources();

    // Notify other user if we were in a call
    if (callState.inCall && (callState.recipient || callState.caller)) {
      const otherId =
        callState.caller?._id === user?._id
          ? callState.recipient?._id
          : callState.caller?._id;

      if (otherId && socket) {
        socket.emit("voiceCallEnded", {
          callerId: otherId,
          recipientId: user?._id,
        });
      }
    }

    setCallState({
      inCall: false,
      incomingCall: false,
      caller: null,
      recipient: null,
      isVideo: false,
      joined: false,
    });
  }, [callState, user, socket, cleanupResources]);

  // --- Agora Setup (Listeners) ---
  useEffect(() => {
    // Only enable if not already active to avoid warnings
    try {
      client.current.enableAudioVolumeIndicator();
    } catch (e) {
      console.warn("[VoiceCall] Volume indicator already enabled", e);
    }

    const handleUserPublished = async (user, mediaType) => {
      console.log(
        `[VoiceCall] Event: user-published | UID: ${user.uid} | Media: ${mediaType}`,
      );
      try {
        await client.current.subscribe(user, mediaType);
        console.log(`[VoiceCall] Subscribed to ${user.uid} (${mediaType})`);

        setRemoteUsers((prev) => {
          const filtered = prev.filter((u) => u.uid !== user.uid);
          return [...filtered, user];
        });

        if (mediaType === "audio") {
          try {
            user.audioTrack?.play();
            console.log(`[VoiceCall] Success: Playing audio for ${user.uid}`);
          } catch (playbackError) {
            console.error(
              `[VoiceCall] Playback triggering error for ${user.uid}:`,
              playbackError,
            );
          }
        }
      } catch (e) {
        console.error(
          `[VoiceCall] Error in user-published loop for ${user.uid}:`,
          e,
        );
      }
    };

    const handleUserUnpublished = (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    const handleUserLeft = (user) => {
      console.log(`[VoiceCall] Event: user-left | UID: ${user.uid}`);
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    const handleUserJoined = (user) => {
      console.log(`[VoiceCall] Event: user-joined | UID: ${user.uid}`);
      setRemoteUsers((prev) => {
        if (prev.find((u) => u.uid === user.uid)) return prev;
        return [...prev, user];
      });
    };

    const handleConnectionStateChange = (curState, revState, reason) => {
      console.log(
        `[VoiceCall] Connection state changed: ${revState} -> ${curState} (${reason})`,
      );
    };

    const handleVolumeIndicator = (volumes) => {
      volumes.forEach((volume) => {
        if (volume.level > 5) {
          const isLocal =
            volume.uid === 0 || volume.uid === client.current?.uid;
          console.log(
            `[VoiceCall] ${isLocal ? "LOCAL MIC" : "REMOTE USER (" + volume.uid + ")"} Level: ${volume.level.toFixed(1)} ${isLocal && isMicBoosted ? "(BOOSTED 800%)" : ""}`,
          );
        }
      });
    };

    const handlePublished = () => {
      console.log(
        `[VoiceCall] ✅ PUBLISHED: Local tracks successfully reached the server!`,
      );
    };

    const handleUnpublished = () => {
      console.log(
        `[VoiceCall] ⚠️ UNPUBLISHED: Local tracks removed from server.`,
      );
    };

    client.current.on("user-published", handleUserPublished);
    client.current.on("user-unpublished", handleUserUnpublished);
    client.current.on("user-left", handleUserLeft);
    client.current.on("user-joined", handleUserJoined);
    client.current.on("connection-state-change", handleConnectionStateChange);
    client.current.on("volume-indicator", handleVolumeIndicator);
    client.current.on("published", handlePublished);
    client.current.on("unpublished", handleUnpublished);
    client.current.on("exception", (event) => {
      console.warn(
        `[VoiceCall] Agora SDK Exception: ${event.code} - ${event.msg}`,
      );
    });

    return () => {
      client.current.off("user-published", handleUserPublished);
      client.current.off("user-unpublished", handleUserUnpublished);
      client.current.off("user-left", handleUserLeft);
      client.current.off("user-joined", handleUserJoined);
      client.current.off(
        "connection-state-change",
        handleConnectionStateChange,
      );
      client.current.off("volume-indicator", handleVolumeIndicator);
      client.current.off("published", handlePublished);
      client.current.off("unpublished", handleUnpublished);
      client.current.off("exception");
    };
  }, []); // Run once on mount

  // --- Audio Context Resumption ---
  useEffect(() => {
    const resumeAudio = async () => {
      // Standard way to resume audio in Agora 4.x is to play tracks or simply interact
      console.log(
        "[VoiceCall] User interaction detected, attempting to resume audio tracks...",
      );
      remoteUsers.forEach((u) => {
        if (u.audioTrack && !u.audioTrack.isPlaying) {
          try {
            u.audioTrack.play();
          } catch (e) {
            console.error("[VoiceCall] Auto-resume failed:", e);
          }
        }
      });
    };

    window.addEventListener("mousedown", resumeAudio, { once: true });
    window.addEventListener("touchstart", resumeAudio, { once: true });
    return () => {
      window.removeEventListener("mousedown", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
    };
  }, [remoteUsers]);

  // --- Audio Playback Guard ---
  useEffect(() => {
    remoteUsers.forEach((u) => {
      if (u.audioTrack) {
        console.log(`[VoiceCall] Ensuring audio playback for user: ${u.uid}`);
        u.audioTrack.setVolume(100);
        try {
          u.audioTrack.play();
        } catch (e) {
          console.error(`[VoiceCall] Playback error for ${u.uid}:`, e);
        }
      }
    });
  }, [remoteUsers]);

  // --- Socket Events (Corrected & Aligned w/ Mobile) ---
  useEffect(() => {
    if (!socket || !user) return;

    // 1. Incoming Call
    const handleIncoming = (data) => {
      console.log(`[VoiceCall] Incoming from ${data.callerName}`, data);

      if (callState.inCall) {
        console.warn("[VoiceCall] Already in call, ignoring");
        return;
      }

      setCallState((prev) => ({
        ...prev,
        incomingCall: true,
        caller: {
          _id: data.callerId,
          username: data.callerName,
          avatar: data.callerAvatar,
        },
        isVideo: !!data.isVideo,
      }));

      // Play Ringing
      audioRef.current.currentTime = 0;
      audioRef.current.loop = true;
      audioRef.current.play().catch((e) => console.log("Audio play error", e));
    };

    // 2. Call Accepted
    const handleAccepted = async (data) => {
      console.log("[VoiceCall] Call accepted by recipient", data);

      // Stop ringing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.loop = false;
      }

      // Join Channel
      const channelName = generateChannelName(user?._id, data.recipientId);
      await joinAgoraChannel(channelName, user?._id, !!data.isVideo);

      setCallState((prev) => ({
        ...prev,
        inCall: true,
        joined: true,
      }));
    };

    // 3. Call Rejected
    const handleRejected = () => {
      console.log("[VoiceCall] Call rejected");
      toast.info("Call declined");
      // Stop ringing explicitly first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.loop = false;
      }
      leaveCall();
    };

    // 4. Call Ended
    const handleEnded = () => {
      console.log("[VoiceCall] Call ended event");
      toast.info("Call ended");
      leaveCall();
    };

    socket.on("voiceCallIncoming", handleIncoming);
    socket.on("voiceCallAccepted", handleAccepted);
    socket.on("voiceCallRejected", handleRejected);
    socket.on("voiceCallEnded", handleEnded);

    return () => {
      socket.off("voiceCallIncoming", handleIncoming);
      socket.off("voiceCallAccepted", handleAccepted);
      socket.off("voiceCallRejected", handleRejected);
      socket.off("voiceCallEnded", handleEnded);
    };
  }, [socket, user, callState.inCall, leaveCall]);

  // Cleanup on logout
  useEffect(() => {
    if (!user) {
      if (callState.inCall || callState.incomingCall) {
        leaveCall();
      }
    }
  }, [user, leaveCall]);

  // --- Transmission Tracing (Critical for Debugging) ---
  useEffect(() => {
    let interval;
    if (callState.joined && localAudioTrack) {
      interval = setInterval(() => {
        const stats = client.current.getLocalAudioStats();
        if (stats) {
          console.log(
            `[VoiceCall] AUDIO STATS: Sending ${(stats.sendBitrate / 1000).toFixed(1)} kbps | Delay: ${stats.sendDelay}ms`,
          );
          if (stats.sendBitrate === 0) {
            console.warn("[VoiceCall] ⚠️ SILENCE: 0 kbps being transmitted!");
          }
        }
      }, 5000); // Trace every 5 seconds
    }
    return () => clearInterval(interval);
  }, [callState.joined, localAudioTrack]);

  // --- Call Timer ---
  useEffect(() => {
    let timer;
    if (callState.joined) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState.joined]);

  // --- Actions ---

  const joinAgoraChannel = async (channelName, uid, isVideo) => {
    try {
      // Use random int UID like mobile
      const agoraUid = Math.floor(Math.random() * 100000);

      setIsJoining(true);
      const tokenData = await fetchAgoraToken(channelName, agoraUid);
      if (!tokenData) {
        toast.error("Failed to generate call token");
        setIsJoining(false);
        return;
      }

      const appId = tokenData.appId || "57f1b0fb4940493faf15457d2388d722";

      console.log(
        `[VoiceCall] Joining Agora: ${channelName}, AppID: ${appId}, UID: ${agoraUid}`,
      );

      await client.current.join(appId, channelName, tokenData.token, agoraUid);

      // Create and Publish Tracks with config aligned for mobile compatibility
      console.log(
        "[VoiceCall] Creating local tracks (with 800% gain boost)...",
      );
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicId || undefined,
        encoderConfig: "speech_standard",
        AEC: true,
        ANS: true,
        AGC: true,
      });

      audioTrack.on("track-ended", () => {
        console.warn("[VoiceCall] ❌ Local audio track ended unexpectedly!");
        toast.error("Microphone connection lost");
      });

      // Boost volume significantly (Agora supports 0-1000)
      const initialVolume = isMicBoosted ? 100 : 100; // REVERTED: 800% caused clipping
      console.log(`[VoiceCall] Setting initial volume to ${initialVolume}%`);
      audioTrack.setVolume(initialVolume);

      let videoTrack;
      if (isVideo) {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
      }

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      console.log("[VoiceCall] Attempting to publish tracks...");
      if (isVideo && videoTrack) {
        await client.current.publish([audioTrack, videoTrack]);
        setIsVideoEnabled(true);
      } else {
        await client.current.publish([audioTrack]);
        setIsVideoEnabled(false);
      }

      console.log(
        `[VoiceCall] Publish call resolved. Audio enabled: ${audioTrack.enabled}`,
      );

      // Check tracks on client
      const publishedTracks = client.current.localTracks;
      console.log(
        `[VoiceCall] Client local tracks count: ${publishedTracks.length}`,
      );

      // Explicitly enable after publication to be absolutely sure
      await audioTrack.setEnabled(true);
      if (audioTrack.setMuted) await audioTrack.setMuted(false);

      setIsMicEnabled(true);
      console.log(
        `[VoiceCall] Successfully published tracks. Current remote users:`,
        client.current.remoteUsers.length,
      );

      setRemoteUsers([...client.current.remoteUsers]);

      setLocalAudioTrack(audioTrack);
      setIsMicEnabled(true);
      setIsJoining(false);
      toast.success("Connected to call");
    } catch (err) {
      setIsJoining(false);
      // Handle the case where the join was aborted (e.g. by leaveCall)
      if (
        err.code === "OPERATION_ABORTED" ||
        err.message?.includes("cancel token")
      ) {
        console.warn(
          "[VoiceCall] joinAgoraChannel aborted:",
          err.message || err.code,
        );
        // Do NOT call leaveCall here to avoid infinite loop/redundancy
        return;
      }

      console.error("Failed to join Agora", err);
      toast.error("Connection failed");
      leaveCall();
    }
  };

  const startCall = (recipient, isVideo = false) => {
    if (!socket || !user) return;

    setCallState({
      inCall: true,
      incomingCall: false,
      caller: user,
      recipient: recipient,
      isVideo,
      joined: false,
    });

    socket.emit("voiceCallInitiate", {
      callerId: user._id,
      callerName: user.username,
      callerAvatar: user.avatar,
      recipientId: recipient._id,
      recipientName: recipient.username,
      timestamp: new Date().toISOString(),
      isVideo,
    });
  };

  const acceptCall = async () => {
    if (!socket || !callState.caller) return;

    // Stop Ringing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }

    socket.emit("voiceCallAccepted", {
      callerId: callState.caller._id,
      recipientId: user._id,
      isVideo: callState.isVideo,
    });

    const channelName = generateChannelName(callState.caller._id, user._id);
    await joinAgoraChannel(channelName, user._id, callState.isVideo);

    setCallState((prev) => ({
      ...prev,
      inCall: true,
      joined: true,
      incomingCall: false,
    }));
  };

  const rejectCall = () => {
    if (!socket || !callState.caller) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }

    socket.emit("voiceCallRejected", {
      callerId: callState.caller._id,
      recipientId: user._id,
    });

    leaveCall();
  };

  const simulateIncomingCall = () => {
    console.log("[VoiceCall] Simulating incoming call");

    // Reset audio first just in case
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.loop = true;
      audioRef.current.play().catch((e) => console.error(e));
    }

    setCallState((prev) => ({
      ...prev,
      incomingCall: true,
      caller: {
        _id: "debug_caller",
        username: "Debug Caller",
        avatar: "https://via.placeholder.com/150",
      },
      isVideo: false,
    }));
  };

  const toggleMic = async () => {
    if (localAudioTrack) {
      const newState = !isMicEnabled;
      await localAudioTrack.setEnabled(newState);
      setIsMicEnabled(newState);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      const newState = !isVideoEnabled;
      await localVideoTrack.setEnabled(newState);
      setIsVideoEnabled(newState);
    }
  };

  const toggleSpeaker = () => {
    const newState = !isSpeakerEnabled;
    remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        if (newState) {
          user.audioTrack.play();
        } else {
          user.audioTrack.stop();
        }
      }
    });
    setIsSpeakerEnabled(newState);
  };

  const toggleMicBoost = () => {
    const newState = !isMicBoosted;
    setIsMicBoosted(newState);
    if (localAudioTrack) {
      localAudioTrack.setVolume(newState ? 800 : 100);
      toast.info(`Mic boost ${newState ? "enabled (800%)" : "disabled"}`);
    }
  };

  const playTestSound = () => {
    console.log("[VoiceCall] Playing test sound...");
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.5;
    audio
      .play()
      .catch((e) => console.error("[VoiceCall] Test sound failed:", e));
  };

  const resetMic = async () => {
    console.log("[VoiceCall] Resetting/Re-publishing Microphone...");
    try {
      if (localAudioTrack) {
        console.log("[VoiceCall] Unpublishing old track...");
        await client.current.unpublish([localAudioTrack]);
        localAudioTrack.stop();
        localAudioTrack.close();
      }

      console.log("[VoiceCall] Creating new speech_standard track...");
      const newTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicId || undefined,
        encoderConfig: "speech_standard",
        AEC: true,
        ANS: true,
        AGC: true,
      });

      newTrack.on("track-ended", () => {
        console.warn("[VoiceCall] ❌ Local audio track ended unexpectedly!");
      });

      const initialVolume = isMicBoosted ? 100 : 100;
      newTrack.setVolume(initialVolume);

      console.log("[VoiceCall] Publishing new track...");
      await client.current.publish([newTrack]);

      console.log(
        `[VoiceCall] Re-publish resolved. Enabled: ${newTrack.enabled}, Published: ${newTrack._published}`,
      );

      await newTrack.setEnabled(true);
      if (newTrack.setMuted) await newTrack.setMuted(false);

      setLocalAudioTrack(newTrack);
      setIsMicEnabled(true);
      toast.success("Outgoing audio re-published");
    } catch (err) {
      console.error("[VoiceCall] Failed to reset mic:", err);
      toast.error("Microphone reset failed");
    }
  };

  return (
    <VoiceCallContext.Provider
      value={{
        callState,
        startCall,
        acceptCall,
        rejectCall,
        leaveCall,
        localAudioTrack,
        localVideoTrack,
        remoteUsers,
        simulateIncomingCall,
        toggleMic,
        toggleVideo,
        toggleSpeaker,
        isMicEnabled,
        isVideoEnabled,
        isSpeakerEnabled,
        isMicBoosted,
        isJoining,
        callDuration,
        playTestSound,
        resetMic,
        toggleMicBoost,
        microphones,
        selectedMicId,
        setMicrophone,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
};
