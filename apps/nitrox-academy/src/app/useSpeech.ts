import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/content/localize';

/**
 * Read-aloud built on the browser's own speech synthesis.
 *
 * Deliberately uses the device's installed voices rather than generated audio files: it costs
 * nothing, ships no megabytes, and works offline. Voice quality varies by device, and some
 * devices ship no Hebrew voice at all, so `supported` reports whether a usable voice exists
 * for the current language and the UI hides the control when it does not.
 */

const LANG_TAG: Record<Locale, string> = { he: 'he-IL', en: 'en-US' };

function pickVoice(voices: SpeechSynthesisVoice[], locale: Locale): SpeechSynthesisVoice | null {
  const tag = LANG_TAG[locale];
  const prefix = tag.split('-')[0]!;
  return (
    voices.find((v) => v.lang === tag && v.localService) ??
    voices.find((v) => v.lang === tag) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

export interface Speech {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useSpeech(locale: Locale): Speech {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const voice = pickVoice(voices, locale);
      // Long passages are split: several engines truncate or stall on a single long utterance.
      const chunks = splitForSpeech(text);
      setSpeaking(true);
      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = LANG_TAG[locale];
        if (voice) u.voice = voice;
        u.rate = 0.98;
        u.pitch = 1;
        if (i === chunks.length - 1) {
          u.onend = () => setSpeaking(false);
          u.onerror = () => setSpeaking(false);
        }
        utteranceRef.current = u;
        window.speechSynthesis.speak(u);
      });
    },
    [voices, locale],
  );

  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && pickVoice(voices, locale) !== null;

  return { supported, speaking, speak, stop };
}

/** Break text into sentence-sized chunks of at most ~200 characters. */
export function splitForSpeech(text: string, max = 200): string[] {
  const sentences = text.split(/(?<=[.!?。׃])\s+|\n+/).filter((s) => s.trim());
  const out: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > max && current) {
      out.push(current.trim());
      current = s;
    } else {
      current = (current + ' ' + s).trim();
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.length ? out : [text];
}
