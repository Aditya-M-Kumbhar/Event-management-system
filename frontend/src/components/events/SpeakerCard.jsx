'use client';
import { Linkedin, Twitter, ExternalLink } from 'lucide-react';

export default function SpeakerCard({ speaker }) {
  return (
    <div className="card p-4 flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-secondary dark:bg-surface-dark-tertiary">
        {speaker.avatar
          ? <img src={speaker.avatar} alt={speaker.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-500">{speaker.name.charAt(0)}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{speaker.name}</h4>
        {speaker.designation && <p className="text-xs text-[--color-text-secondary]">{speaker.designation}</p>}
        {speaker.company      && <p className="text-xs text-brand-500">{speaker.company}</p>}
        {speaker.bio          && <p className="text-xs text-[--color-text-muted] mt-1.5 line-clamp-2">{speaker.bio}</p>}
        <div className="flex gap-2 mt-2">
          {speaker.linkedin && <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer" className="text-[--color-text-muted] hover:text-blue-600"><Linkedin className="w-3.5 h-3.5" /></a>}
          {speaker.twitter  && <a href={speaker.twitter}  target="_blank" rel="noopener noreferrer" className="text-[--color-text-muted] hover:text-sky-500"><Twitter  className="w-3.5 h-3.5" /></a>}
        </div>
      </div>
    </div>
  );
}
