import React from 'react';

interface TranscriptAreaProps {
    transcript: string;
}

export const TranscriptArea: React.FC<TranscriptAreaProps> = ({ transcript }) => {
    return <div className="transcript-area">{transcript}</div>;
};
