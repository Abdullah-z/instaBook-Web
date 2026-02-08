import React, { useContext, useEffect, useRef } from "react";
import { VoiceCallContext } from "../context/VoiceCallContext";
import Draggable from "react-draggable";
import {
  Phone,
  Video,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  VideoOff,
} from "lucide-react";

const CallOverlay = () => {
  const {
    callState,
    currentCall,
    acceptCall,
    rejectCall,
    leaveCall,
    remoteUsers,
    localVideoTrack,
    localAudioTrack,
    toggleMic,
    toggleSpeaker,
    toggleVideo,
    isMicEnabled,
    isSpeakerEnabled,
    isVideoEnabled,
    isMicBoosted,
    isJoining,
    callDuration,
    playTestSound,
    resetMic,
    toggleMicBoost,
    microphones,
    selectedMicId,
    setMicrophone,
  } = useContext(VoiceCallContext);

  const nodeRef = useRef(null);
  const localVideoRef = useRef(null);

  // Format duration mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Play video tracks
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    remoteUsers.forEach((user) => {
      const el = document.getElementById(`remote-video-${user.uid}`);
      if (el && user.videoTrack) {
        user.videoTrack.play(el);
      }
    });
  }, [remoteUsers]);

  // If not in a call or incoming call, render nothing
  if (!callState?.incomingCall && (!callState?.inCall || !callState?.joined)) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Incoming Call Modal - Allow pointer events on the modal itself */}
      {callState?.incomingCall && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
          <div className="bg-zinc-800 p-8 rounded-2xl flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in duration-300 w-80 border border-zinc-700">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <img
                src={
                  callState.caller?.avatar && callState.caller.avatar !== ""
                    ? callState.caller.avatar
                    : "https://via.placeholder.com/96"
                }
                alt={callState.caller?.username || "Caller"}
                className="w-24 h-24 rounded-full border-4 border-primary relative z-10 object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/96";
                }}
              />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold text-white">
                {callState.caller?.username}
              </h3>
              <p className="text-zinc-400">
                Incoming {callState.isVideo ? "Video" : "Voice"} Call
              </p>
            </div>

            <div className="flex gap-8 w-full justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  acceptCall();
                }}
                className="bg-green-500 hover:bg-green-600 p-4 rounded-full text-white transition-all hover:scale-110 shadow-lg shadow-green-500/20"
                title="Accept"
              >
                {callState.isVideo ? <Video size={32} /> : <Phone size={32} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rejectCall();
                }}
                className="bg-red-500 hover:bg-red-600 p-4 rounded-full text-white transition-all hover:scale-110 shadow-lg shadow-red-500/20"
                title="Decline"
              >
                <Phone size={32} className="rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Draggable Window */}
      {callState?.inCall && callState.joined && (
        <div className="pointer-events-auto">
          <Draggable nodeRef={nodeRef} bounds="parent">
            <div
              ref={nodeRef}
              className="fixed top-24 right-6 w-80 bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col"
            >
              {/* Header */}
              <div className="bg-zinc-800/80 backdrop-blur p-3 flex items-center justify-between border-b border-zinc-700 cursor-move">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-zinc-300">
                    {formatDuration(callDuration || 0)}
                  </span>
                </div>
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Active Call
                </span>
              </div>

              {/* Main Video Area */}
              <div className="relative h-64 bg-black flex items-center justify-center group">
                {remoteUsers.length > 0 ? (
                  remoteUsers.map((u) => (
                    <div
                      id={`remote-video-${u.uid}`}
                      key={u.uid}
                      className="w-full h-full object-cover flex items-center justify-center bg-zinc-800"
                    >
                      {!u.videoTrack && (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center border-2 border-zinc-600">
                            <User size={48} className="text-zinc-400" />
                          </div>
                          <span className="text-zinc-400 font-medium tracking-wide">
                            Remote Participant
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-600">
                    <div className="w-20 h-20 rounded-full bg-zinc-900/50 flex items-center justify-center">
                      <User size={40} />
                    </div>
                    <span className="text-sm font-medium animate-pulse">
                      Connecting...
                    </span>
                  </div>
                )}

                {/* Local Video PIP */}
                {localVideoTrack && (
                  <div
                    ref={localVideoRef}
                    className="absolute bottom-4 right-4 w-24 h-32 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 shadow-lg"
                  />
                )}
              </div>

              {/* Caller Info */}
              {!remoteUsers.length && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {/* Overlay info if needed */}
                </div>
              )}

              {/* Controls */}
              <div className="p-4 bg-zinc-900 grid grid-cols-4 gap-2 border-t border-zinc-800">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl flex items-center justify-center transition-colors ${!isMicEnabled ? "bg-white text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                >
                  {!isMicEnabled ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl flex items-center justify-center transition-colors ${!isVideoEnabled ? "bg-white text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                >
                  {!isVideoEnabled ? (
                    <VideoOff size={20} />
                  ) : (
                    <Video size={20} />
                  )}
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`p-3 rounded-xl flex items-center justify-center transition-colors ${!isSpeakerEnabled ? "bg-white text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                >
                  {!isSpeakerEnabled ? (
                    <VolumeX size={20} />
                  ) : (
                    <Volume2 size={20} />
                  )}
                </button>

                <button
                  onClick={toggleMicBoost}
                  className={`p-3 rounded-xl flex items-center justify-center transition-colors ${isMicBoosted ? "bg-amber-500 text-white" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                  title={
                    isMicBoosted ? "Disable Mic Boost" : "Enable Mic Boost"
                  }
                >
                  <Volume2
                    size={20}
                    className={isMicBoosted ? "animate-pulse" : ""}
                  />
                </button>

                <button
                  onClick={leaveCall}
                  className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl flex items-center justify-center transition-colors col-span-1"
                >
                  <Phone className="rotate-[135deg]" size={20} />
                </button>
              </div>

              {/* Audio Recovery Tools */}
              {remoteUsers.length > 0 && (
                <div className="px-4 pb-4 space-y-2">
                  <button
                    onClick={async () => {
                      console.log("[VoiceCall] Manually recovering audio...");
                      try {
                        remoteUsers.forEach((u) => {
                          if (u.audioTrack) {
                            u.audioTrack.stop();
                            try {
                              u.audioTrack.play();
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        });
                        toast.success("Audio system reset");
                      } catch (e) {
                        console.error("[VoiceCall] Recovery failed:", e);
                      }
                    }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors border border-zinc-700/50 font-medium"
                  >
                    Can't hear? Click to fix audio
                  </button>
                  <button
                    onClick={resetMic}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors border border-zinc-700/50 font-medium"
                  >
                    Mic not working? Reset Microphone
                  </button>
                  <button
                    onClick={playTestSound}
                    className="w-full py-1 text-zinc-500 text-[10px] hover:text-zinc-400 decoration-dotted underline"
                  >
                    Click to test if browser audio works at all
                  </button>

                  {/* Microphone Selection */}
                  {microphones.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/50">
                      <label className="text-[10px] text-zinc-500 block mb-1 px-1">
                        Select Microphone Source:
                      </label>
                      <select
                        value={selectedMicId}
                        onChange={(e) => setMicrophone(e.target.value)}
                        className="w-full bg-zinc-900 text-zinc-300 text-[11px] rounded px-2 py-1 outline-none border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                      >
                        {microphones.map((mic) => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label ||
                              `Microphone ${mic.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Draggable>
        </div>
      )}

      {/* Joining Loading Overlay */}
      {isJoining && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md pointer-events-auto z-[10000]">
          <div className="flex flex-col items-center gap-6 bg-zinc-800/90 p-10 rounded-3xl border border-zinc-700 shadow-2xl animate-in zoom-in duration-300">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <span className="text-white text-xl font-bold block">
                Connecting...
              </span>
              <span className="text-zinc-400 text-sm">
                Setting up secure media channel
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
