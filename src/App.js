import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "@studio-freight/lenis";
import SoundManager from "./sound_manager.js";

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Create the same custom ease used in your original code
CustomEase.create("customEase", "M0,0 C0.86,0 0.07,1 1,1");

const artistsList = [
  "Silence",
  "Meditation",
  "Intuition",
  "Authenticity",
  "Presence",
  "Listening",
  "Curiosity",
  "Patience",
  "Surrender",
  "Simplicity"
];

const featuredList = [
  "Creative Elements",
  "Inner Stillness",
  "Deep Knowing",
  "True Expression",
  "Now Moment",
  "Deep Attention",
  "Open Exploration",
  "Calm Waiting",
  "Let Go Control",
  "Pure Essence"
];

const categoriesList = [
  "Reduction",
  "Essence",
  "Space",
  "Resonance",
  "Truth",
  "Feeling",
  "Clarity",
  "Emptiness",
  "Awareness",
  "Minimalism"
];

const backgrounds = [
  "https://assets.codepen.io/7558/flame-glow-blur-001.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-002.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-003.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-004.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-005.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-006.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-007.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-008.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-009.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-010.jpg"
];

export default function App() {
  const lenisRef = useRef(null);
  const splitTextsRef = useRef({});
  const cleanupFnsRef = useRef([]);
  const soundManagerRef = useRef(null);

  // Helper: Split h3 text into words and wrap each in .word-mask and .split-word (SplitText replacement)
  const splitH3IntoWords = (h3, index) => {
    if (!h3) return [];
    const text = h3.textContent || "";
    const words = text.trim().split(/\s+/);
    // Clear existing children
    h3.textContent = "";
    const wordSpans = [];

    words.forEach((w, i) => {
      const mask = document.createElement("div");
      mask.className = "word-mask";
      const span = document.createElement("span");
      span.className = "split-word";
      span.textContent = w;
      mask.appendChild(span);
      h3.appendChild(mask);
      // Add back the space as text node to keep spacing
      if (i < words.length - 1) {
        h3.appendChild(document.createTextNode(" "));
      }
      wordSpans.push(span);
    });

    // Initial positions: section 0 visible; others hidden
    if (index !== 0) {
      gsap.set(wordSpans, { yPercent: 100, opacity: 0 });
    } else {
      gsap.set(wordSpans, { yPercent: 0, opacity: 1 });
    }
    return wordSpans;
  };

  useEffect(() => {
    const soundManager = new SoundManager();
    soundManagerRef.current = soundManager;

    let lenis;
    let mainScrollTrigger;
    let progressBarTrigger;
    let endSectionTrigger;
    let counterInterval;
    let isAnimating = false;
    let isSnapping = false;
    let lastProgress = 0;
    let scrollDirection = 0;
    let currentSection = 0;
    let sectionPositions = [];
    const duration = 0.64;
    const parallaxAmount = 5;
    let globalProgress = 0;

    const cleanupFns = [];

    const initLenis = () => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        gestureDirection: "vertical",
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = lenis;
      cleanupFns.push(() => {
        gsap.ticker.remove((time) => lenis.raf(time * 1000));
        lenis.destroy();
      });
    };

    const initPage = () => {
      const loadingOverlay = document.getElementById("loading-overlay");
      const loadingCounter = document.getElementById("loading-counter");
      const debugInfo = document.getElementById("debug-info");
      const fixedContainer = document.getElementById("fixed-container");
      const fixedSectionElement = document.querySelector(".fixed-section");
      const header = document.querySelector(".header");
      const content = document.querySelector(".content");
      const footer = document.getElementById("footer");
      const leftColumn = document.getElementById("left-column");
      const rightColumn = document.getElementById("right-column");
      const featured = document.getElementById("featured");
      const bgImgs = document.querySelectorAll(".background-image");
      const artists = document.querySelectorAll(".artist");
      const categories = document.querySelectorAll(".category");
      const featuredContents = document.querySelectorAll(".featured-content");
      const progressFill = document.getElementById("progress-fill");
      const currentSectionDisplay = document.getElementById("current-section");

      // Loading counter animation
      let counter = 0;
      counterInterval = setInterval(() => {
        counter += Math.random() * 3 + 1;
        if (counter >= 100) {
          counter = 100;
          clearInterval(counterInterval);
          setTimeout(() => {
            gsap.to(loadingOverlay.querySelector(".loading-counter"), {
              opacity: 0,
              y: -20,
              duration: 0.6,
              ease: "power2.inOut"
            });
            // Fade out "Loading" word (first child text node)
            gsap.to(loadingOverlay.childNodes[0], {
              opacity: 0,
              y: -20,
              duration: 0.6,
              ease: "power2.inOut",
              onComplete: () => {
                gsap.to(loadingOverlay, {
                  y: "-100%",
                  duration: 1.2,
                  ease: "power3.inOut",
                  delay: 0.3,
                  onComplete: () => {
                    loadingOverlay.style.display = "none";
                    animateColumns();
                  }
                });
              }
            });
          }, 200);
        }
        loadingCounter.textContent = `[${counter.toFixed(0).padStart(2, "0")}]`;
      }, 30);
      cleanupFns.push(() => clearInterval(counterInterval));

      const updateProgressNumbers = () => {
        currentSectionDisplay.textContent = (currentSection + 1)
          .toString()
          .padStart(2, "0");
      };

      const animateColumns = () => {
        const artistItems = document.querySelectorAll(".artist");
        const categoryItems = document.querySelectorAll(".category");
        artistItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add("loaded");
          }, index * 60);
        });
        categoryItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add("loaded");
          }, index * 60 + 200);
        });
      };

      // Split featured h3 texts into words, mask them, and set initial state
      try {
        featuredContents.forEach((fc, index) => {
          const h3 = fc.querySelector("h3");
          if (h3) {
            const words = splitH3IntoWords(h3, index);
            splitTextsRef.current[`featured-${index}`] = { words };
          }
        });
      } catch (error) {
        console.error("Split words error:", error);
      }

      gsap.set(fixedContainer, { height: "100vh" });

      // Calculate exact scroll positions for each section
      const fixedSectionTop = fixedSectionElement.offsetTop;
      const fixedSectionHeight = fixedSectionElement.offsetHeight;
      sectionPositions = [];
      for (let i = 0; i < 10; i++) {
        sectionPositions.push(fixedSectionTop + (fixedSectionHeight * i) / 10);
      }
       const changeSection = (newSection) => {
        if (newSection === currentSection || isAnimating) return;
        isAnimating = true;
        const isScrollingDown = newSection > currentSection;
        const previousSection = currentSection;
        currentSection = newSection;

        // Update numbers and progress fill
        updateProgressNumbers();
        const sectionProgress = currentSection / 9;
        progressFill.style.width = `${sectionProgress * 100}%`;

        debugInfo.textContent = `Changing to Section: ${newSection} (${
          isScrollingDown ? "Down" : "Up"
        })`;

        // Hide all other featured contents
        featuredContents.forEach((content, i) => {
          if (i !== newSection && i !== previousSection) {
            content.classList.remove("active");
            gsap.set(content, { visibility: "hidden", opacity: 0 });
          }
        });

        // Animate previous words out
        if (previousSection !== null) {
          const prevWords = splitTextsRef.current[`featured-${previousSection}`]
            ?.words;
          if (prevWords && prevWords.length) {
            gsap.to(prevWords, {
              yPercent: isScrollingDown ? -100 : 100,
              opacity: 0,
              duration: duration * 0.6,
              stagger: isScrollingDown ? 0.03 : -0.03,
              ease: "customEase",
              onComplete: () => {
                featuredContents[previousSection].classList.remove("active");
                gsap.set(featuredContents[previousSection], {
                  visibility: "hidden"
                });
              }
            });
          }
        }

        // Animate new words in
        const newWords =
          splitTextsRef.current[`featured-${newSection}`]?.words || [];
        if (newWords.length) {
          // Play text change sound slightly after click
          soundManager.play("textChange", 250);

          featuredContents[newSection].classList.add("active");
          gsap.set(featuredContents[newSection], {
            visibility: "visible",
            opacity: 1
          });
          gsap.set(newWords, {
            yPercent: isScrollingDown ? 100 : -100,
            opacity: 0
          });
          gsap.to(newWords, {
            yPercent: 0,
            opacity: 1,
            duration: duration,
            stagger: isScrollingDown ? 0.05 : -0.05,
            ease: "customEase"
          });
        }

        // Background transitions
        bgImgs.forEach((bg, i) => {
          bg.classList.remove("previous", "active");

          if (i === newSection) {
            if (isScrollingDown) {
              gsap.set(bg, { opacity: 1, y: 0, clipPath: "inset(100% 0 0 0)" });
              gsap.to(bg, {
                clipPath: "inset(0% 0 0 0)",
                duration: duration,
                ease: "customEase"
              });
            } else {
              gsap.set(bg, { opacity: 1, y: 0, clipPath: "inset(0 0 100% 0)" });
              gsap.to(bg, {
                clipPath: "inset(0 0 0% 0)",
                duration: duration,
                ease: "customEase"
              });
            }
            bg.classList.add("active");
          } else if (i === previousSection) {
            bg.classList.add("previous");
            gsap.to(bg, {
              y: isScrollingDown ? `${parallaxAmount}%` : `-${parallaxAmount}%`,
              duration: duration,
              ease: "customEase"
            });
            gsap.to(bg, {
              opacity: 0,
              delay: duration * 0.5,
              duration: duration * 0.5,
              ease: "customEase",
              onComplete: () => {
                bg.classList.remove("previous");
                gsap.set(bg, { y: 0 });
                isAnimating = false;
              }
            });
          } else {
            gsap.to(bg, {
              opacity: 0,
              duration: duration * 0.3,
              ease: "customEase"
            });
          }
        });

        // Left column artists
        artists.forEach((artist, i) => {
          if (i === newSection) {
            artist.classList.add("active");
            gsap.to(artist, { opacity: 1, duration: 0.3, ease: "power2.out" });
          } else {
            artist.classList.remove("active");
            gsap.to(artist, { opacity: 0.3, duration: 0.3, ease: "power2.out" });
          }
        });

        // Right column categories
        categories.forEach((category, i) => {
          if (i === newSection) {
            category.classList.add("active");
            gsap.to(category, {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            category.classList.remove("active");
            gsap.to(category, {
              opacity: 0.3,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      };

      const navigateToSection = (index) => {
        if (index === currentSection || isAnimating || isSnapping) return;

        // Enable audio on first interaction and play click
        soundManager.enableAudio();
        soundManager.play("click");

        isSnapping = true;
        const targetPosition = sectionPositions[index];
        changeSection(index);
        lenis.scrollTo(targetPosition, {
          duration: 0.8,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          lock: true,
          onComplete: () => {
            isSnapping = false;
          }
        });
      };

      // Attach click/hover handlers (and clean them up later)
      const artistClickHandlers = [];
      const artistEnterHandlers = [];
      artists.forEach((artist, index) => {
        const clickHandler = (e) => {
          e.preventDefault();
          navigateToSection(index);
        };
        const enterHandler = () => {
          soundManager.enableAudio();
          soundManager.play("hover");
        };
        artist.addEventListener("click", clickHandler);
        artist.addEventListener("mouseenter", enterHandler);
        artistClickHandlers.push({ el: artist, fn: clickHandler });
        artistEnterHandlers.push({ el: artist, fn: enterHandler });
      });
      cleanupFns.push(() => {
        artistClickHandlers.forEach(({ el, fn }) =>
          el.removeEventListener("click", fn)
        );
        artistEnterHandlers.forEach(({ el, fn }) =>
          el.removeEventListener("mouseenter", fn)
        );
      });

      const categoryClickHandlers = [];
      const categoryEnterHandlers = [];
      categories.forEach((category, index) => {
        const clickHandler = (e) => {
          e.preventDefault();
          navigateToSection(index);
        };
        const enterHandler = () => {
          soundManager.enableAudio();
          soundManager.play("hover");
        };
        category.addEventListener("click", clickHandler);
        category.addEventListener("mouseenter", enterHandler);
        categoryClickHandlers.push({ el: category, fn: clickHandler });
        categoryEnterHandlers.push({ el: category, fn: enterHandler });
      });
      cleanupFns.push(() => {
        categoryClickHandlers.forEach(({ el, fn }) =>
          el.removeEventListener("click", fn)
        );
        categoryEnterHandlers.forEach(({ el, fn }) =>
          el.removeEventListener("mouseenter", fn)
        );
      });

      // Enable audio on any user interaction (once)
      const enableAudioOnce = () => soundManager.enableAudio();
      document.addEventListener("click", enableAudioOnce, { once: true });
      cleanupFns.push(() =>
        document.removeEventListener("click", enableAudioOnce)
      );
 const snapToSection = (targetSection) => {
        if (
          targetSection < 0 ||
          targetSection > 9 ||
          targetSection === currentSection ||
          isAnimating
        )
          return;
        isSnapping = true;
        changeSection(targetSection);
        const targetPosition = sectionPositions[targetSection];
        lenis.scrollTo(targetPosition, {
          duration: 0.6,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          lock: true,
          onComplete: () => {
            isSnapping = false;
          }
        });
      };
      // ScrollTrigger for main pinned section
      mainScrollTrigger = ScrollTrigger.create({
        trigger: ".fixed-section",
        start: "top top",
        end: "bottom bottom",
        pin: ".fixed-container",
        pinSpacing: true,
        onUpdate: (self) => {
          if (isSnapping) return;
          const progress = self.progress;
          const progressDelta = progress - lastProgress;

          if (Math.abs(progressDelta) > 0.001) {
            scrollDirection = progressDelta > 0 ? 1 : -1;
          }
          const targetSection = Math.min(9, Math.floor(progress * 10));

          if (targetSection !== currentSection && !isAnimating) {
            const nextSection =
              currentSection + (targetSection > currentSection ? 1 : -1);
            snapToSection(nextSection);
          }

          lastProgress = progress;

          const sectionProgress = currentSection / 9;
          progressFill.style.width = `${sectionProgress * 100}%`;
          debugInfo.textContent = `Section: ${currentSection}, Target: ${targetSection}, Progress: ${progress.toFixed(
            3
          )}, Direction: ${scrollDirection}`;
        }
      });
      cleanupFns.push(() => mainScrollTrigger && mainScrollTrigger.kill());

     

      

      // Global scroll progress tracking
      progressBarTrigger = ScrollTrigger.create({
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          globalProgress = self.progress;
        }
      });
      cleanupFns.push(
        () => progressBarTrigger && progressBarTrigger.kill()
      );

      // End section handling (blur and unpin)
      endSectionTrigger = ScrollTrigger.create({
        trigger: ".end-section",
        start: "top center",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (self.progress > 0.1) {
            footer.classList.add("blur");
            leftColumn.classList.add("blur");
            rightColumn.classList.add("blur");
            featured.classList.add("blur");
          } else {
            footer.classList.remove("blur");
            leftColumn.classList.remove("blur");
            rightColumn.classList.remove("blur");
            featured.classList.remove("blur");
          }

          if (self.progress > 0.1) {
            const newHeight = Math.max(
              0,
              100 - ((self.progress - 0.1) / 0.9) * 100
            );
            gsap.to(fixedContainer, {
              height: `${newHeight}vh`,
              duration: 0.1,
              ease: "power1.out"
            });
            const moveY = (-(self.progress - 0.1) / 0.9) * 200;
            gsap.to(header, {
              y: moveY * 1.5,
              duration: 0.1,
              ease: "power1.out"
            });
            gsap.to(content, {
              y: `calc(${moveY}px + (-50%))`,
              duration: 0.1,
              ease: "power1.out"
            });
            gsap.to(footer, {
              y: moveY * 0.5,
              duration: 0.1,
              ease: "power1.out"
            });
          } else {
            gsap.to(fixedContainer, {
              height: "100vh",
              duration: 0.1,
              ease: "power1.out"
            });
            gsap.to(header, {
              y: 0,
              duration: 0.1,
              ease: "power1.out"
            });
            gsap.to(content, {
              y: "-50%",
              duration: 0.1,
              ease: "power1.out"
            });
            gsap.to(footer, {
              y: 0,
              duration: 0.1,
              ease: "power1.out"
            });
          }

          debugInfo.textContent = `End Section - Height: ${
            fixedContainer.style.height
          }, Progress: ${self.progress.toFixed(2)}`;
        }
      });
      cleanupFns.push(() => endSectionTrigger && endSectionTrigger.kill());

      // Keyboard toggle for debug panel
      const keyHandler = (e) => {
        if (e.key.toLowerCase() === "h") {
          debugInfo.style.display =
            debugInfo.style.display === "none" ? "block" : "none";
        }
      };
      document.addEventListener("keydown", keyHandler);
      cleanupFns.push(() => document.removeEventListener("keydown", keyHandler));

      // Initialize progress numbers and debug
      updateProgressNumbers();
      const debugInit = () => {
        const di = document.getElementById("debug-info");
        if (di) di.textContent = `Current Section: 0 (Initial)`;
      };
      debugInit();

      // Expose addSound globally (as in original)
      window.addSound = function (name, url, volume = 0.3) {
        soundManager.addSound(name, url, volume);
      };
      cleanupFns.push(() => {
        if (window.addSound) delete window.addSound;
      });
    };

    // Initialize
    const start = async () => {
      // Wait a bit and for fonts to be ready (same behavior)
      setTimeout(() => {
        document.fonts.ready.then(() => {
          initLenis();
          initPage();
        });
      }, 500);
    };
    start();

    // Store for cleanup on unmount
    cleanupFnsRef.current = cleanupFns;

    return () => {
      // Cleanup
      try {
        cleanupFns.forEach((fn) => fn && fn());
      } catch {}
      try {
        ScrollTrigger.getAll().forEach((st) => st.kill());
      } catch {}
    };
  }, []);

  return (
    <>
      <div className="loading-overlay" id="loading-overlay">
        Loading <span className="loading-counter" id="loading-counter">[00]</span>
      </div>

      <div className="debug-info" id="debug-info">
        Current Section: 0
      </div>

      <div className="scroll-container" id="scroll-container">
        <div className="fixed-section" id="fixed-section">
          <div className="fixed-container" id="fixed-container">
            <div className="background-container" id="background-container">
              {backgrounds.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Background ${i + 1}`}
                  className={`background-image ${i === 0 ? "active" : ""}`}
                  id={`background-${i + 1}`}
                />
              ))}
            </div>

            <div className="grid-container">
              <div className="header">
                <div className="header-row">The Creative</div>
                <div className="header-row">Process</div>
              </div>

              <div className="content">
                <div className="left-column" id="left-column">
                  {artistsList.map((name, i) => (
                    <div
                      className={`artist ${i === 0 ? "active" : ""}`}
                      id={`artist-${i}`}
                      data-index={i}
                      key={`artist-${i}`}
                    >
                      {name}
                    </div>
                  ))}
                </div>

                <div className="featured" id="featured">
                  {featuredList.map((title, i) => (
                    <div
                      className={`featured-content ${i === 0 ? "active" : ""}`}
                      id={`featured-${i}`}
                      data-index={i}
                      key={`featured-${i}`}
                    >
                      <h3>{title}</h3>
                    </div>
                  ))}
                </div>

                <div className="right-column" id="right-column">
                  {categoriesList.map((name, i) => (
                    <div
                      className={`category ${i === 0 ? "active" : ""}`}
                      id={`category-${i}`}
                      data-index={i}
                      key={`category-${i}`}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="footer" id="footer">
                <div className="header-row">Beyond</div>
                <div className="header-row">Thinking</div>
                <div className="progress-indicator">
                  <div className="progress-numbers">
                    <span id="current-section">01</span>
                    <span id="total-sections">10</span>
                  </div>
                  <div className="progress-fill" id="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="end-section">
          <p className="fin">fin</p>
        </div>
      </div>
    </>
  );
}
