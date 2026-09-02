import React from 'react';

/**
 * Custom Robot Chatbot Logo based on the user's reference image:
 * Features a cute robot with an antenna, round ears, visor with looking-up eyes, 
 * smiling mouth, and a speech-bubble shaped head on a vibrant green circular badge.
 */
export const BotLogo = ({ className = "w-6 h-6", withCircle = true }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {withCircle && (
        <>
          {/* Green Background Circle */}
          <circle cx="50" cy="50" r="50" fill="#6FB724" />
          {/* Subtle diagonal shadow overlay */}
          <path
            d="M 50 11 L 100 61 L 100 100 L 59 100 L 40 81 L 59 93 L 64 80 C 74 74 81 65 81 53 C 81 48 79 43 76 39 L 50 11 Z"
            fill="black"
            fillOpacity="0.09"
          />
        </>
      )}

      {/* Robot Head Structure (White) */}
      <g fill="#FFFFFF">
        {/* Top Antenna Ball & Stem */}
        <circle cx="50" cy="13" r="7.5" />
        <rect x="46.5" y="16" width="7" height="13" rx="3.5" />
        <circle cx="50" cy="27" r="4.5" />

        {/* Left and Right Round Ears */}
        <circle cx="21" cy="52" r="10.5" />
        <circle cx="79" cy="52" r="10.5" />

        {/* Speech Bubble Robot Head */}
        <path
          d="M 50 25 
             C 67.5 25 81 37.5 81 53 
             C 81 64.5 73.5 74.5 62.5 79.5 
             L 59 93 
             L 48 83 
             C 32.5 83 19 70 19 53 
             C 19 37.5 32.5 25 50 25 Z"
        />
      </g>

      {/* Visor Screen (Green #6FB724) */}
      <path
        d="M 27 44 
           C 27 41.5 40 42.5 50 42.5 
           C 60 42.5 73 41.5 73 44 
           C 73 53.5 72 59 71 60 
           C 60 61 40 61 29 60 
           C 28 59 27 53.5 27 44 Z"
        fill="#6FB724"
      />

      {/* Left Eye (White sclera + dark green pupil looking up) */}
      <circle cx="41.5" cy="51" r="6.2" fill="#FFFFFF" />
      <circle cx="41.5" cy="48.5" r="3.6" fill="#3D700E" />

      {/* Right Eye (White sclera + dark green pupil looking up) */}
      <circle cx="58.5" cy="51" r="6.2" fill="#FFFFFF" />
      <circle cx="58.5" cy="48.5" r="3.6" fill="#3D700E" />

      {/* Smiling Mouth */}
      <path
        d="M 40 67 
           C 40 67 43 75 50 75 
           C 57 75 60 67 60 67 
           Z"
        fill="#6FB724"
      />
    </svg>
  );
};
