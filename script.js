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
    cursor.style.visibility = "hidden";
});
document.body.addEventListener("mouseleave", (event) => {
    cursor.style.visibility = "hidden";
});
document.body.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX + 8}px`;
    cursor.style.top = `${event.clientY + 8}px`;
});

const baseConfig = {
    durationMs: 320,
    refreshMs: 320,
    steps: 6,
    rotateDeg: 6,
    scaleDelta: 0.04,
    translatePx: 1.2,
    perspectivePx: 100,
    useScale: true,
    useTranslate: false
};

const neutralTransform = `perspective(${baseConfig.perspectivePx}px) rotate3d(1, 0, 0, 0deg) scale3d(1, 1, 1) translate3d(0, 0, 0)`;
const animations = new WeakMap();
const timers = new WeakMap();
const hovered = new Set();
const active = new Set();
let currentHover = null;

const randomBetween = (min, max) => min + Math.random() * (max - min);

const isEligible = (el) => {
    if (!el.matches("h1, h2, h3, h4, h5, h6, p, button, li, img, a")) {
        return false;
    }
    if (!(el instanceof HTMLElement)) {
        return false;
    }

    if (el === document.body || el === document.documentElement) {
        return false;
    }

    return !el.closest("script, style");
};

const getEligibleFromNode = (node) => {
    let el = node;
    while (el && el instanceof HTMLElement) {
        if (isEligible(el)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
};

const getDeepestEligibleTarget = (event) => {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
    for (const node of path) {
        if (isEligible(node)) {
            return node;
        }
    }
    return null;
};

const randomAxis = () => [
    randomBetween(0.1, 1),
    randomBetween(0.1, 1),
    randomBetween(0.1, 1)
];

const randomFrame = (settings) => {
    const [x, y, z] = randomAxis();
    const angle = randomBetween(-settings.rotateDeg, settings.rotateDeg);
    const sx = settings.useScale ? 1 + randomBetween(-settings.scaleDelta, settings.scaleDelta) : 1;
    const sy = settings.useScale ? 1 + randomBetween(-settings.scaleDelta, settings.scaleDelta) : 1;
    const tx = settings.useTranslate ? randomBetween(-settings.translatePx, settings.translatePx) : 0;
    const ty = settings.useTranslate ? randomBetween(-settings.translatePx, settings.translatePx) : 0;

    return `perspective(${settings.perspectivePx}px) `
        + `rotate3d(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}, ${angle.toFixed(2)}deg) `
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

const applyIdleTransform = (el, settings = baseConfig) => {
    el.style.transition = "transform 180ms ease";
    el.style.transform = randomFrame(settings);
};

const resetIdleTransform = (el) => {
    el.style.transition = "transform 180ms ease";
    el.style.transform = neutralTransform;
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

const setHoverTarget = (el) => {
    if (currentHover === el) {
        return;
    }
    if (currentHover) {
        hovered.delete(currentHover);
        active.delete(currentHover);
        stopHover(currentHover);
        resetIdleTransform(currentHover);
    }
    currentHover = el;
    if (currentHover) {
        hovered.add(currentHover);
        applyIdleTransform(currentHover);
    }
};

document.addEventListener("pointermove", (event) => {
    const node = document.elementFromPoint(event.clientX, event.clientY);
    const el = getEligibleFromNode(node);
    setHoverTarget(el);
}, true);

document.addEventListener("pointerleave", () => {
    setHoverTarget(null);
}, true);

document.addEventListener("pointerdown", (event) => {
    cursor.classList.add("oh-no");
    const el = getDeepestEligibleTarget(event);
    if (!el) {
        return;
    }
    active.add(el);
    el.style.transition = "none";
    startHover(el, {
        rotateDeg: 10,
        durationMs: 120,
        refreshMs: 120,
        steps: 10,
        scaleDelta: 0.18,
        translatePx: 4,
        perspectivePx: 1000,
        useScale: true,
        useTranslate: true
    });
}, true);

const releaseActive = (event) => {
    cursor.classList.remove("oh-no");
    const el = getDeepestEligibleTarget(event);
    if (!el) {
        return;
    }
    active.delete(el);
    if (hovered.has(el)) {
        stopHover(el);
        el.style.transition = "transform 180ms ease";
        applyIdleTransform(el);
    } else {
        stopHover(el);
        resetIdleTransform(el);
    }
};

document.addEventListener("pointerup", releaseActive, true);
document.addEventListener("pointercancel", releaseActive, true);
