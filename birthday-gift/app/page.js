"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  CONTENT: edit the text here, everything else updates automatically */
/* ------------------------------------------------------------------ */

const photos = Array.from({ length: 9 }, (_, i) => ({
  src: `/images/photo-${String(i + 1).padStart(2, "0")}.jpg`,
  caption: [
    "A little moment worth remembering ✨",
    "A memory to keep close 🌷",
    "Keep collecting beautiful moments 💛",
    "Life is better with good memories",
    "A little happiness captured in time",
    "Here's to more reasons to smile",
    "One for the memory book 📸",
    "Wishing you more days like these",
    "The best moments deserve to be remembered",
  ][i],
  rot: [-3, 2, -2, 3, -1, 2, -3, 1, -2][i],
}));

const videos = Array.from({ length: 10 }, (_, i) => ({
  src: `/videos/video-${String(i + 1).padStart(2, "0")}.mp4`,
  caption: `Memory ${String(i + 1).padStart(2, "0")} 🎬`,
}));

const wishes = [
  { icon: "✦", text: "May your year be full of small joys 🌼" },
  { icon: "☾", text: "Wishing you calm mornings and big smiles ☕" },
  { icon: "♥", text: "May good people always find their way to you 🤝" },
  { icon: "✿", text: "Here's to bold dreams and brave steps 🚀" },
  { icon: "★", text: "May you feel proud of how far you've come 🌟" },
  { icon: "☀", text: "More laughter than worries this year 😄" },
  { icon: "❀", text: "Health, peace, and plenty of cake 🎂" },
  { icon: "✧", text: "You deserve every good thing that's coming 💛" },
];

const LETTER = Array.from(
  "Hey, birthday girl! 🌷\n\n" +
    "I'm really glad you're in my life. I wanted to make something a little different for your birthday, just to remind you how much you're appreciated.\n\n" +
    "I hope this next chapter brings you plenty of happiness, new adventures, good health, and opportunities to do the things you love.\n\n" +
    "Keep believing in yourself, keep growing into the person you want to be, and remember to enjoy the little things along the way.\n\n" +
    "You deserve a wonderful birthday and a year filled with reasons to smile. Have an amazing one! 💛\n\n" +
    "— From your friend ✨"
);

const CHAPTERS = ["gift", "welcome", "photos", "videos", "wishes", "letter", "surprise"];
const COLORS = ["#fff7dc", "#f8c8e0", "#d8d5ff", "#f7d8bd", "#ffd166", "#9bd1ff"];
const BALLOONS = [
  { l: 6, c: "#f8a5c8", d: 14, dl: 0 },
  { l: 22, c: "#ffd166", d: 17, dl: 3 },
  { l: 38, c: "#9bd1ff", d: 15, dl: 6 },
  { l: 55, c: "#d8d5ff", d: 18, dl: 1 },
  { l: 70, c: "#f7d8bd", d: 16, dl: 4 },
  { l: 86, c: "#f8a5c8", d: 19, dl: 7 },
];

// Small vibration on phones that support it (silently ignored elsewhere)
const buzz = (ms = 12) => {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
};

export default function BirthdayPage() {
  const mainRef = useRef(null);
  const musicRef = useRef(null);
  const skyRef = useRef(null);
  const fxRef = useRef(null);
  const parts = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const lastTrail = useRef(0);
  const lastTap = useRef(0);
  const wasMusic = useRef(false);
  const holdRef = useRef(null);
  const touchX = useRef(null);
  const tiltActive = useRef(false);
  const orientHandler = useRef(null);

  const [chapter, setChapter] = useState("gift");
  const [reached, setReached] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [opened, setOpened] = useState(false);
  const [lit, setLit] = useState(true);
  const [skipHint, setSkipHint] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [slide, setSlide] = useState(false);
  const [flipped, setFlipped] = useState([]);
  const [typed, setTyped] = useState(0);
  const [hold, setHold] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [popped, setPopped] = useState([]);

  const lightboxOpen = lightbox !== null;

  /* ---------------- particle engine: confetti, sparks, hearts, rings ---------------- */
  const burst = useCallback((x, y, n = 40, kind = "confetti") => {
    if (parts.current.length > 1400) return;

    if (kind === "ring") {
      parts.current.push({ kind, x, y, r: 4, life: 1, decay: 0.035, c: "#fde2b5", vx: 0, vy: 0, g: 0, drag: 1, vr: 0, rot: 0, size: 0 });
      return;
    }

    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random();
      const base = { x, y, life: 1, rot: Math.random() * 6, kind, c: COLORS[i % COLORS.length] };
      if (kind === "spark") {
        const s = 1 + r * 2;
        parts.current.push({ ...base, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.02, drag: 0.96, decay: 0.03, size: 2 + r * 2, vr: 0 });
      } else if (kind === "heart") {
        parts.current.push({ ...base, c: ["#f8a5c8", "#ff7aa8", "#ffd1e3"][i % 3], vx: (r - 0.5) * 4, vy: -2 - Math.random() * 3, g: 0.03, drag: 0.98, decay: 0.012, size: 5 + r * 4, vr: (r - 0.5) * 0.1 });
      } else {
        const s = 3 + r * 7;
        parts.current.push({ ...base, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, g: 0.15, drag: 0.99, decay: 0.008 + r * 0.008, size: 5 + r * 5, vr: (r - 0.5) * 0.3 });
      }
    }
  }, []);

  /* ------- canvases: twinkling sky, bokeh, shooting stars + particle layer -------
     Everything is driven by elapsed time (dt), so it moves at the same speed on a
     60Hz, 90Hz or 120Hz phone and on a desktop monitor. */
  useEffect(() => {
    const sky = skyRef.current;
    const fx = fxRef.current;
    const sctx = sky.getContext("2d");
    const fctx = fx.getContext("2d");
    let raf, W, H, stars = [], bokeh = [], shoot = null;
    let sx = 0, sy = 0;
    let last = performance.now();

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      [sky, fx].forEach((c) => {
        c.width = W * dpr;
        c.height = H * dpr;
        c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      stars = Array.from({ length: Math.min(Math.round((W * H) / 8000), 220) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        t: Math.random() * 6,
        s: 0.01 + Math.random() * 0.03,
        z: Math.random(),
      }));
      bokeh = Array.from({ length: 12 }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 30 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.16,
        a: 0.04 + Math.random() * 0.05,
        c: ["#f8c8e0", "#d8d5ff", "#ffd9a8"][i % 3],
      }));
    };
    init();
    window.addEventListener("resize", init);

    const draw = (now) => {
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;

      // ----- sky
      sctx.clearRect(0, 0, W, H);
      sx += (mouse.current.x - sx) * Math.min(0.07 * dt, 1);
      sy += (mouse.current.y - sy) * Math.min(0.07 * dt, 1);

      for (const b of bokeh) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        sctx.globalAlpha = b.a;
        sctx.fillStyle = b.c;
        sctx.beginPath();
        sctx.arc(b.x + sx * 40, b.y + sy * 40, b.r, 0, 6.3);
        sctx.fill();
      }

      for (const s of stars) {
        s.t += s.s * dt;
        sctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.t));
        sctx.fillStyle = s.z > 0.8 ? "#f8dcb3" : "#fff";
        sctx.beginPath();
        sctx.arc(s.x + sx * s.z * 24, s.y + sy * s.z * 24, s.r, 0, 6.3);
        sctx.fill();
      }

      if (!shoot && Math.random() < 0.004 * dt) shoot = { x: Math.random() * W * 0.8, y: Math.random() * H * 0.3, l: 1 };
      if (shoot) {
        sctx.globalAlpha = shoot.l;
        sctx.strokeStyle = "#fff";
        sctx.lineWidth = 1.5;
        sctx.beginPath();
        sctx.moveTo(shoot.x, shoot.y);
        sctx.lineTo(shoot.x - 70, shoot.y - 35);
        sctx.stroke();
        shoot.x += 14 * dt;
        shoot.y += 7 * dt;
        shoot.l -= 0.025 * dt;
        if (shoot.l <= 0) shoot = null;
      }

      // ----- particles
      fctx.clearRect(0, 0, W, H);
      const ps = parts.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          ps.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.vx *= Math.pow(p.drag, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        fctx.save();
        fctx.fillStyle = p.c;
        fctx.translate(p.x, p.y);
        fctx.rotate(p.rot);
        if (p.kind === "ring") {
          p.r += 3 * dt;
          fctx.globalAlpha = p.life * 0.6;
          fctx.strokeStyle = p.c;
          fctx.lineWidth = 2;
          fctx.beginPath();
          fctx.arc(0, 0, p.r, 0, 6.3);
          fctx.stroke();
        } else if (p.kind === "heart") {
          fctx.globalAlpha = p.life;
          fctx.font = `${p.size * 3}px serif`;
          fctx.textAlign = "center";
          fctx.fillText("♥", 0, 0);
        } else if (p.kind === "spark") {
          // soft glow drawn as a bigger faint circle (cheap and identical on every device)
          fctx.globalAlpha = p.life * 0.22;
          fctx.beginPath();
          fctx.arc(0, 0, p.size * 1.7, 0, 6.3);
          fctx.fill();
          fctx.globalAlpha = p.life;
          fctx.beginPath();
          fctx.arc(0, 0, p.size / 2, 0, 6.3);
          fctx.fill();
        } else {
          fctx.globalAlpha = p.life;
          fctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        fctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", init);
    };
  }, []);

  /* ---------------- pointer + touch: spotlight, parallax, sparkle trail ---------------- */
  function track(e) {
    const m = mainRef.current;
    if (!m) return;
    m.style.setProperty("--cx", `${e.clientX}px`);
    m.style.setProperty("--cy", `${e.clientY}px`);
    // when the phone's tilt sensor is driving the parallax, touches only move the spotlight
    if (!(tiltActive.current && e.pointerType !== "mouse")) {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      mouse.current = { x: nx, y: ny };
      m.style.setProperty("--px", nx.toFixed(3));
      m.style.setProperty("--py", ny.toFixed(3));
    }
  }

  function trail(x, y) {
    const now = performance.now();
    if (now - lastTrail.current > 35) {
      lastTrail.current = now;
      burst(x, y, 2, "spark");
    }
  }

  function onPointerMove(e) {
    track(e);
    if (e.pointerType === "mouse") trail(e.clientX, e.clientY);
  }

  // Touch drag leaves a sparkle trail too (works while scrolling)
  function onTouchMove(e) {
    const t = e.touches[0];
    if (!t) return;
    track({ clientX: t.clientX, clientY: t.clientY, pointerType: "touch" });
    trail(t.clientX, t.clientY);
  }

  function onPointerDown(e) {
    track(e);
    burst(e.clientX, e.clientY, 1, "ring");
    burst(e.clientX, e.clientY, 12, "spark");
  }

  // Phones: tilt the device to move the stars (needs one tap for permission on iPhone)
  function enableTilt() {
    if (orientHandler.current) return;
    const handler = (e) => {
      if (e.gamma == null || e.beta == null) return;
      const x = Math.max(-0.5, Math.min(0.5, e.gamma / 60));
      const y = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60));
      tiltActive.current = true;
      mouse.current = { x, y };
      const m = mainRef.current;
      if (m) {
        m.style.setProperty("--px", x.toFixed(3));
        m.style.setProperty("--py", y.toFixed(3));
      }
    };
    orientHandler.current = handler;
    window.addEventListener("deviceorientation", handler);
  }

  useEffect(
    () => () => {
      if (orientHandler.current) window.removeEventListener("deviceorientation", orientHandler.current);
    },
    []
  );

  /* ---------------- effects ---------------- */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapter]);

  useEffect(() => {
    if (chapter !== "welcome") return;
    const t = setTimeout(() => setSkipHint(true), 8000);
    return () => clearTimeout(t);
  }, [chapter]);

  // Typewriter for the letter
  useEffect(() => {
    if (chapter !== "letter") {
      setTyped(0);
      return;
    }
    const id = setInterval(() => {
      setTyped((t) => {
        if (t >= LETTER.length) {
          clearInterval(id);
          return t;
        }
        return t + 1;
      });
    }, 34);
    return () => clearInterval(id);
  }, [chapter]);

  // Fireworks on the final reveal
  useEffect(() => {
    if (!showMessage) return;
    const ids = [];
    for (let i = 0; i < 8; i++) {
      ids.push(
        setTimeout(() => {
          const x = window.innerWidth * (0.15 + Math.random() * 0.7);
          const y = window.innerHeight * (0.12 + Math.random() * 0.4);
          burst(x, y, 70, "confetti");
          burst(x, y, 30, "spark");
          burst(x, y, 1, "ring");
        }, i * 650)
      );
    }
    return () => ids.forEach(clearTimeout);
  }, [showMessage, burst]);

  // Lightbox: keyboard, page scroll lock, slideshow
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepPhoto(1);
      if (e.key === "ArrowLeft") stepPhoto(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen || !slide) return;
    const id = setInterval(() => stepPhoto(1), 3200);
    return () => clearInterval(id);
  }, [lightboxOpen, slide]);

  function stepPhoto(dir) {
    setLightbox((i) => (i === null ? i : (i + dir + photos.length) % photos.length));
  }

  function closeLightbox() {
    setLightbox(null);
    setSlide(false);
  }

  function onPhotoTap(e) {
    e.stopPropagation();
    const now = performance.now();
    if (now - lastTap.current < 320) {
      burst(e.clientX, e.clientY, 14, "heart");
      buzz(20);
    }
    lastTap.current = now;
  }

  /* ---------------- music ---------------- */
  async function toggleMusic() {
    const audio = musicRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      setMusicError("");
      audio.volume = 0.5;
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Music playback error:", error);
      setIsPlaying(false);
      setMusicError("Couldn't play the music. Please check your browser volume and try again.");
    }
  }

  function onVideoPlay(e) {
    document.querySelectorAll(".video-media").forEach((v) => {
      if (v !== e.currentTarget) v.pause();
    });
    const audio = musicRef.current;
    if (audio && !audio.paused) {
      wasMusic.current = true;
      audio.pause();
    }
  }

  function onVideoStop() {
    setTimeout(() => {
      const any = [...document.querySelectorAll(".video-media")].some((v) => !v.paused);
      if (!any && wasMusic.current) {
        wasMusic.current = false;
        musicRef.current?.play().catch(() => {});
      }
    }, 250);
  }

  /* ---------------- navigation ---------------- */
  function goToChapter(next) {
    closeLightbox();
    setChapter(next);
    setShowMessage(false);
    setHold(0);
    if (next === "welcome") {
      setLit(true);
      setSkipHint(false);
    }
    setReached((r) => Math.max(r, CHAPTERS.indexOf(next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restartExperience() {
    goToChapter("welcome");
  }

  /* ---------------- interactions ---------------- */
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  function openGift(e) {
    if (opened) return;
    setOpened(true);
    buzz(30);
    const [x, y] = centerOf(e.currentTarget);
    burst(x, y - 30, 110, "confetti");
    burst(x, y - 30, 40, "spark");
    burst(x, y - 30, 1, "ring");

    const audio = musicRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    // Phone tilt parallax (iPhone asks permission, Android just works)
    try {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === "function") {
        D.requestPermission()
          .then((r) => r === "granted" && enableTilt())
          .catch(() => {});
      } else if (D) {
        enableTilt();
      }
    } catch {}

    setTimeout(() => goToChapter("welcome"), 1500);
  }

  function blowCandles(e) {
    if (!lit) return;
    setLit(false);
    buzz(30);
    const [x, y] = centerOf(e.currentTarget);
    burst(x, y - 40, 90, "confetti");
    burst(x, y - 40, 30, "spark");
    burst(x, y - 40, 1, "ring");
  }

  function popBalloon(e, i) {
    buzz(10);
    const [x, y] = centerOf(e.currentTarget);
    burst(x, y, 36, "confetti");
    burst(x, y, 1, "ring");
    setPopped((p) => [...p, i]);
    setTimeout(() => setPopped((p) => p.filter((n) => n !== i)), 5000);
  }

  function tilt(e) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }

  function untilt(e) {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  }

  function flipWish(e, i) {
    buzz(12);
    const [x, y] = centerOf(e.currentTarget);
    if (!flipped.includes(i)) {
      burst(x, y, 10, "heart");
      setFlipped((f) => [...f, i]);
    } else {
      setFlipped((f) => f.filter((n) => n !== i));
    }
  }

  function sendHearts(e) {
    buzz(15);
    const [x, y] = centerOf(e.currentTarget);
    burst(x, y, 16, "heart");
  }

  function revealFinal() {
    buzz(40);
    setShowMessage(true);
    setHold(0);
  }

  function startHold() {
    if (holdRef.current) return;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 1400, 1);
      setHold(p);
      if (p >= 1) {
        holdRef.current = null;
        revealFinal();
        return;
      }
      holdRef.current = requestAnimationFrame(step);
    };
    holdRef.current = requestAnimationFrame(step);
  }

  function cancelHold() {
    if (holdRef.current) {
      cancelAnimationFrame(holdRef.current);
      holdRef.current = null;
    }
    setHold((h) => (h >= 1 ? h : 0));
  }

  const showBegin = !lit || skipHint;
  const ci = CHAPTERS.indexOf(chapter);
  const photo = lightboxOpen ? photos[lightbox] : null;
  const letterDone = typed >= LETTER.length;

  return (
    <main
      ref={mainRef}
      className="birthday-bg min-h-screen text-white"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onTouchMove={onTouchMove}
    >
      <canvas ref={skyRef} className="sky" aria-hidden="true" />
      <canvas ref={fxRef} className="canvas-fx" aria-hidden="true" />
      <div className="spot" aria-hidden="true" />
      <div className="orb" style={{ top: "-10vmax", left: "-10vmax", background: "#7b4fc0" }} aria-hidden="true" />
      <div className="orb" style={{ bottom: "-12vmax", right: "-10vmax", background: "#c0507f", transitionDuration: "900ms" }} aria-hidden="true" />

      <audio
        ref={musicRef}
        src="/music/birthday.mp3"
        loop
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setMusicError("");
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          console.error("Music file failed to load:", musicRef.current?.currentSrc, musicRef.current?.error);
          setMusicError("The music file could not be loaded. Please check its location and format.");
        }}
      />

      {(chapter === "welcome" || showMessage) &&
        BALLOONS.map(
          (b, i) =>
            !popped.includes(i) && (
              <button
                key={i}
                aria-label="Pop balloon"
                className="balloon"
                onClick={(e) => popBalloon(e, i)}
                style={{ left: `${b.l}%`, "--c": b.c, "--d": `${b.d}s`, "--dl": `${b.dl}s` }}
              >
                <i className="balloon-body" />
              </button>
            )
        )}

      {/* Header: brand + music on the first row, progress dots wrap underneath on narrow screens */}
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-5 py-5 sm:px-8 sm:py-6">
        <button onClick={restartExperience} className="brand">
          ✦ A little gift
        </button>

        <nav className="dots order-3 w-full justify-center sm:order-none sm:w-auto" aria-label="Progress">
          {CHAPTERS.map((c, i) => (
            <button
              key={c}
              disabled={i > reached || chapter === "gift"}
              onClick={() => goToChapter(c)}
              aria-label={`Go to ${c}`}
              aria-current={i === ci}
              className={i === ci ? "dot now" : i <= reached ? "dot done" : "dot"}
            />
          ))}
        </nav>

        <button
          onClick={toggleMusic}
          aria-label={isPlaying ? "Pause background music" : "Play background music"}
          aria-pressed={isPlaying}
          className="music-button"
        >
          <span className={isPlaying ? "music-icon music-playing" : "music-icon"}>{isPlaying ? "♫" : "♪"}</span>
          {isPlaying ? "Pause music" : "Play music"}
        </button>
      </header>

      {musicError && (
        <p role="status" className="mx-auto max-w-5xl px-5 text-right text-sm text-amber-200">
          {musicError}
        </p>
      )}

      <div className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8">
        {/* 0. Gift box */}
        {chapter === "gift" && (
          <section key="gift" className="chapter-enter stage flex flex-col items-center justify-center text-center">
            <button className={opened ? "gift open" : "gift"} onClick={openGift} aria-label="Open your gift">
              <span className="gift-glow" />
              <span className="gift-box" />
              <span className="gift-lid" />
            </button>
            <h1 className="birthday-title mb-3 text-4xl sm:text-6xl">Something for you</h1>
            <p className="text-slate-300">{opened ? "Here it comes… ✨" : "Tap the gift to open it 🎁"}</p>
          </section>
        )}

        {/* 1. Welcome */}
        {chapter === "welcome" && (
          <section key="welcome" className="chapter-enter stage flex flex-col items-center justify-center text-center">
            <h1 className="mb-6 text-[8vw] sm:text-7xl whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }} aria-label="Happy Birthday!">
              {"Happy Birthday!".split("").map((ch, i) => (
                <span key={i} aria-hidden="true" className="title-letter" style={{ "--i": i, animationDelay: `${i * 70}ms, ${i * 120 + 1000}ms` }}>
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </h1>

            <p className="mx-auto mb-6 max-w-lg text-base leading-8 text-slate-300 sm:text-lg">
              Some people make the world a little brighter. Today, this little corner of the internet is dedicated to celebrating you.
            </p>

            <button className="cake" onClick={blowCandles} aria-label="Blow out the candles">
              <div className="candles">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="candle">
                    <i className={lit ? "flame" : "flame out"} style={{ animationDelay: `${i * 0.12}s` }} />
                  </span>
                ))}
              </div>
              <div className="tier t1" />
              <div className="tier t2" />
            </button>

            <p className="mb-8 mt-4 text-slate-300">{lit ? "Tap the candles and make a wish 🕯️" : "Your wish is on its way. 💫"}</p>

            {showBegin && (
              <button onClick={() => goToChapter("photos")} className="birthday-button pop-in">
                Begin your surprise ✨
              </button>
            )}
          </section>
        )}

        {/* 2. Photos as polaroids */}
        {chapter === "photos" && (
          <section key="photos" className="chapter-enter">
            <p className="chapter-label">CHAPTER ONE</p>
            <h2 className="birthday-title mb-4 text-center text-4xl sm:text-5xl">Little Memories</h2>
            <p className="mx-auto mb-10 max-w-lg text-center leading-7 text-slate-300">
              Nine little windows into moments worth remembering. Tap any photo to see it up close.
            </p>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-8">
              {photos.map((p, i) => (
                <button
                  key={p.src}
                  onClick={() => setLightbox(i)}
                  onPointerDown={tilt}
                  onPointerMove={tilt}
                  onPointerLeave={untilt}
                  onPointerCancel={untilt}
                  onPointerUp={(e) => e.pointerType !== "mouse" && untilt(e)}
                  className="polaroid"
                  style={{ "--rot": `${p.rot}deg`, animationDelay: `${i * 80}ms` }}
                >
                  <img src={p.src} alt={`Birthday memory ${i + 1}`} loading={i < 3 ? "eager" : "lazy"} className="photo-media" />
                  <p className="font-hand">{p.caption}</p>
                </button>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button onClick={() => goToChapter("videos")} className="birthday-button">
                Continue to video memories 🎬
              </button>
            </div>
          </section>
        )}

        {/* Lightbox: arrows, swipe, keys, slideshow, double-tap hearts */}
        {photo && (
          <div
            className="photo-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onClick={closeLightbox}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 50) stepPhoto(dx < 0 ? 1 : -1);
            }}
          >
            <button aria-label="Close photo" className="photo-close" onClick={closeLightbox}>
              ✕
            </button>
            <button aria-label="Previous photo" className="photo-nav left-3" onClick={(e) => { e.stopPropagation(); stepPhoto(-1); }}>
              ‹
            </button>
            <button aria-label="Next photo" className="photo-nav right-3" onClick={(e) => { e.stopPropagation(); stepPhoto(1); }}>
              ›
            </button>

            <img key={lightbox} src={photo.src} alt={photo.caption} className="photo-pop photo-img max-w-full rounded-xl object-contain" onClick={onPhotoTap} />

            <p className="font-hand mt-4 text-center text-xl text-slate-100">{photo.caption}</p>
            <p className="mt-1 text-xs text-slate-400">
              {lightbox + 1} / {photos.length} · double-tap the photo for a heart 💗
            </p>
            <button
              className="slide-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSlide((s) => !s);
              }}
            >
              {slide ? "❚❚ Pause slideshow" : "▶ Play slideshow"}
            </button>
          </div>
        )}

        {/* 3. Videos */}
        {chapter === "videos" && (
          <section key="videos" className="chapter-enter">
            <p className="chapter-label">CHAPTER TWO</p>
            <h2 className="birthday-title mb-4 text-center text-4xl sm:text-5xl">Moments in Motion</h2>
            <p className="mx-auto mb-10 max-w-lg text-center leading-7 text-slate-300">
              Some memories are even better when they move. Your music pauses while a clip plays, then picks back up.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {videos.map((v, i) => (
                <article key={v.src} className="memory-card" data-reveal style={{ transitionDelay: `${(i % 2) * 120}ms` }}>
                  <video src={v.src} controls playsInline preload="metadata" className="video-media" aria-label={v.caption} onPlay={onVideoPlay} onPause={onVideoStop} onEnded={onVideoStop} />
                  <p className="p-4 text-sm text-slate-200">
                    <span className="mr-2 text-amber-200">{String(i + 1).padStart(2, "0")}</span>
                    {v.caption}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button onClick={() => goToChapter("wishes")} className="birthday-button">
                Open your wishes 💫
              </button>
            </div>
          </section>
        )}

        {/* 4. Flip-card wishes */}
        {chapter === "wishes" && (
          <section key="wishes" className="chapter-enter">
            <p className="chapter-label">CHAPTER THREE</p>
            <h2 className="birthday-title mb-4 text-center text-4xl sm:text-5xl">Eight Little Wishes</h2>
            <p className="mx-auto mb-10 max-w-lg text-center leading-7 text-slate-300">
              Each card hides a wish. Tap to flip them over. ({flipped.length}/{wishes.length} opened)
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {wishes.map((w, i) => (
                <button
                  key={i}
                  className={flipped.includes(i) ? "flip is-flipped" : "flip"}
                  onClick={(e) => flipWish(e, i)}
                  aria-label={flipped.includes(i) ? w.text : `Wish card ${i + 1}, tap to reveal`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="flip-inner">
                    <span className="flip-face flip-front">{w.icon}</span>
                    <span className="flip-face flip-back font-hand">{w.text}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button onClick={() => goToChapter("letter")} className={flipped.length === wishes.length ? "birthday-button pop-in" : "birthday-button"}>
                There's a little note for you 💌
              </button>
            </div>
          </section>
        )}

        {/* 5. Typewriter letter */}
        {chapter === "letter" && (
          <section key="letter" className="chapter-enter mx-auto max-w-2xl">
            <p className="chapter-label">CHAPTER FOUR</p>
            <h2 className="birthday-title mb-8 text-center text-4xl sm:text-5xl">A Little Note for You</h2>

            <article className="letter-card">
              <p className="font-letter whitespace-pre-line text-[1.35rem] leading-9 sm:text-[1.6rem] sm:leading-10" aria-label={LETTER.join("")}>
                <span aria-hidden="true">{LETTER.slice(0, typed).join("")}</span>
                {!letterDone && <span className="caret" aria-hidden="true" />}
                <span aria-hidden="true" className="letter-rest">{LETTER.slice(typed).join("")}</span>
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                {letterDone ? (
                  <button onClick={sendHearts} className="heart-button pop-in">
                    Send some love 💗
                  </button>
                ) : (
                  <button onClick={() => setTyped(LETTER.length)} className="text-xs tracking-widest text-slate-400 underline-offset-4 hover:underline">
                    Skip typing
                  </button>
                )}
              </div>
            </article>

            <div className="mt-9 text-center">
              <button onClick={() => goToChapter("surprise")} className="birthday-button">
                One last thing... 🔒
              </button>
            </div>
          </section>
        )}

        {/* 6. Final surprise */}
        {chapter === "surprise" && (
          <section key="surprise" className="chapter-enter stage-sm flex flex-col items-center justify-center text-center">
            {!showMessage ? (
              <>
                <button
                  className="hold"
                  style={{ "--p": hold }}
                  aria-label="Press and hold to unlock your message"
                  onPointerDown={startHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  onContextMenu={(e) => e.preventDefault()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && revealFinal()}
                >
                  <span>{hold > 0.5 ? "🔓" : "🔐"}</span>
                </button>

                <p className="chapter-label">THE FINAL CHAPTER</p>
                <h2 className="birthday-title mb-6 text-4xl sm:text-6xl">A Hidden Surprise</h2>
                <p className="mx-auto mb-4 max-w-md leading-8 text-slate-300">
                  You've made it through the memories. Press and hold the lock to open your final birthday wish.
                </p>
              </>
            ) : (
              <article className="final-card reveal-message">
                <button
                  className="mb-5 text-5xl"
                  aria-label="Celebrate"
                  onClick={(e) => {
                    buzz(20);
                    const [x, y] = centerOf(e.currentTarget);
                    burst(x, y, 60, "confetti");
                    burst(x, y, 1, "ring");
                  }}
                >
                  🎉
                </button>

                <p className="chapter-label">A WISH JUST FOR YOU</p>
                <h2 className="birthday-title mb-7 text-4xl sm:text-6xl">Keep Shining</h2>

                <p className="mb-5 leading-8 text-slate-100">
                  Happy Birthday! I hope life brings you beautiful surprises, people who appreciate you, and opportunities that make you proud of yourself.
                </p>
                <p className="mb-5 leading-8 text-slate-100">
                  I genuinely wish you happiness, peace, and success in whatever you choose to pursue.
                </p>
                <p className="leading-8 text-slate-100">
                  Keep smiling, keep being yourself, and keep making the world a little brighter in your own way.
                </p>

                <div className="my-7 text-3xl">✨ 🎂 ✨</div>
                <p className="text-sm text-amber-200">Made with care, especially for your birthday.</p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button onClick={sendHearts} className="heart-button">
                    Hearts 💗
                  </button>
                  <button onClick={restartExperience} className="birthday-button">
                    Experience it again ↻
                  </button>
                </div>
              </article>
            )}
          </section>
        )}

        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-xs tracking-widest text-slate-400">
          A LITTLE BIRTHDAY GIFT · MADE WITH CARE
        </footer>
      </div>
    </main>
  );
}