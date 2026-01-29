const cursor = document.createElement("img");
cursor.src = "cursor.svg";
cursor.style.position = "fixed";
cursor.style.pointerEvents = "none";
cursor.style.width = "32px";
cursor.style.height = "32px";
cursor.style.visibility = "hidden";
cursor.classList.add("spinning-plate")
document.body.appendChild(cursor);
document.body.addEventListener("mouseenter", (event) => {
    cursor.style.left = `${event.clientX + 8}px`;
    cursor.style.top = `${event.clientY + 8}px`;
    cursor.style.visibility = "visible";
    document.body.style.cursor = "none";
});
document.body.addEventListener("mouseleave", (event) => {
    cursor.style.visibility = "hidden";
    document.body.style.cursor = "";
});
document.body.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX + 8}px`;
    cursor.style.top = `${event.clientY + 8}px`;
});

const baseConfig = {
    durationMs: 300,
    refreshMs: 300,
    steps: 8,
    rotateDeg: 2,
    scaleDelta: 0.035,
    translatePx: 1.1
};

const neutralTransform = "rotate3d(1, 0, 0, 0deg) scale3d(1, 1, 1) translate3d(0, 0, 0)";
const animations = new WeakMap();
const timers = new WeakMap();
const hovered = new Set();
const active = new Set();

const randomBetween = (min, max) => min + Math.random() * (max - min);

const isEligible = (el) => {
    if (!(el instanceof HTMLElement)) {
        return false;
    }

    if (el === document.body || el === document.documentElement) {
        return false;
    }

    return !el.closest("script, style");
};

const randomAxis = () => [
    randomBetween(0.1, 1),
    randomBetween(0.1, 1),
    randomBetween(0.1, 1)
];

const randomFrame = (settings) => {
    const [x, y, z] = randomAxis();
    const angle = randomBetween(-settings.rotateDeg, settings.rotateDeg);
    const sx = 1 + randomBetween(-settings.scaleDelta, settings.scaleDelta);
    const sy = 1 + randomBetween(-settings.scaleDelta, settings.scaleDelta);
    const tx = randomBetween(-settings.translatePx, settings.translatePx);
    const ty = randomBetween(-settings.translatePx, settings.translatePx);

    return `rotate3d(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}, ${angle.toFixed(2)}deg) `
        + `scale3d(${sx.toFixed(3)}, ${sy.toFixed(3)}, 1) `
        + `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
};

const buildKeyframes = (settings) => {
    const frames = [{ transform: neutralTransform, offset: 0 }];
    for (let i = 1; i < settings.steps; i += 1) {
        frames.push({ transform: randomFrame(settings), offset: i / settings.steps });
    }
    frames.push({ transform: neutralTransform, offset: 1 });
    return frames;
};

const startHover = (el, overrides = {}) => {
    if (animations.has(el)) {
        stopHover(el);
    }

    const settings = { ...baseConfig, ...overrides };

    const startAnimation = () => {
        const anim = el.animate(buildKeyframes(settings), {
            duration: settings.durationMs,
            easing: "linear",
            iterations: Infinity
        });
        animations.set(el, anim);
    };

    startAnimation();

    const timer = setInterval(() => {
        const anim = animations.get(el);
        if (anim) {
            anim.cancel();
        }
        startAnimation();
    }, settings.refreshMs);

    timers.set(el, timer);
};

const stopHover = (el) => {
    const anim = animations.get(el);
    if (anim) {
        anim.cancel();
    }
    animations.delete(el);

    const timer = timers.get(el);
    if (timer) {
        clearInterval(timer);
    }
    timers.delete(el);
};

document.addEventListener("pointerenter", (event) => {
    const el = event.target;
    if (!isEligible(el)) {
        return;
    }
    hovered.add(el);
    startHover(el);
}, true);

document.addEventListener("pointerleave", (event) => {
    const el = event.target;
    if (!isEligible(el)) {
        return;
    }
    hovered.delete(el);
    active.delete(el);
    stopHover(el);
}, true);

document.addEventListener("pointerdown", (event) => {
    const el = event.target;
    cursor.classList.add("oh-no");
    if (!isEligible(el)) {
        return;
    }
    active.add(el);
    startHover(el, {
        rotateDeg: 8, durationMs: 150, refreshMs: 150, scaleDelta: 0.1,
        translatePx: 2
    });
}, true);

const releaseActive = (event) => {
    const el = event.target;
    cursor.classList.remove("oh-no");
    if (!isEligible(el)) {
        return;
    }
    active.delete(el);
    if (hovered.has(el)) {
        startHover(el);
    } else {
        stopHover(el);
    }
};

document.addEventListener("pointerup", releaseActive, true);
document.addEventListener("pointercancel", releaseActive, true);
