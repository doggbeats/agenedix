export function requestNotificationPermission() {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    try {
      Notification.requestPermission();
    } catch {
      // alguns navegadores exigem interação do usuário
    }
  }
}

export function notify(title: string, body: string) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // sem áudio disponível
  }

  try {
    if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
  } catch {
    // dispositivo sem vibração
  }

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/barber.jpg" });
    } catch {
      // notificação falhou
    }
  }
}