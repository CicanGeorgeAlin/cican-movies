export function isVoiceSearchSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createVoiceSearch({ onResult, onStart, onEnd, onError } = {}) {
  if (!isVoiceSearchSupported()) return null;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();

  recognition.lang = document.documentElement.lang || "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("start", () => onStart?.());
  recognition.addEventListener("end", () => onEnd?.());
  recognition.addEventListener("error", event => onError?.(event.error || "unknown"));

  recognition.addEventListener("result", event => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map(result => result[0]?.transcript || "")
      .join(" ")
      .trim();

    if (transcript) onResult?.(transcript);
  });

  return recognition;
}
