"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

export function TagCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const simulationStarted = useRef(false);
  const engineRef = useRef<any>(null);
  const renderRef = useRef<any>(null);
  const runnerRef = useRef<any>(null);
  const afterUpdateRef = useRef<(() => void) | null>(null);
  const [tagsVisible, setTagsVisible] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          if (
            scriptLoaded.current &&
            !simulationStarted.current &&
            containerRef.current
          ) {
            simulationStarted.current = true;
            initSimulation(containerRef.current);
          }
        }
      },
      { threshold: 0.3 },
    );

    if (wrapperRef.current) observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
      if (!window.Matter) return;
      const Matter = window.Matter;

      if (afterUpdateRef.current && engineRef.current) {
        Matter.Events.off(
          engineRef.current,
          "afterUpdate",
          afterUpdateRef.current,
        );
      }
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);

      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleScriptLoad = () => {
    scriptLoaded.current = true;
    // Intersection observer already fired — start now
    if (
      simulationStarted.current &&
      !engineRef.current &&
      containerRef.current
    ) {
      initSimulation(containerRef.current);
    }
  };

  const handleResize = () => {
    if (!containerRef.current || !renderRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    renderRef.current.canvas.width = w;
    renderRef.current.canvas.height = h;
    renderRef.current.options.width = w;
    renderRef.current.options.height = h;

    updateBoundaries(w, h);
  };

  const updateBoundaries = (width: number, height: number) => {
    if (!engineRef.current) return;

    const Matter = window.Matter;
    const world = engineRef.current.world;
    const thickness = 100;

    const bodies = Matter.Composite.allBodies(world);
    bodies.forEach((body: any) => {
      if (body.isStatic) Matter.World.remove(world, body);
    });

    Matter.World.add(world, [
      Matter.Bodies.rectangle(
        width / 2,
        height + thickness / 2,
        width + thickness * 2,
        thickness,
        {
          isStatic: true,
          render: { fillStyle: "transparent" },
          label: "ground",
        },
      ),
      Matter.Bodies.rectangle(
        -thickness / 2,
        height / 2,
        thickness,
        height + thickness * 2,
        {
          isStatic: true,
          render: { fillStyle: "transparent" },
          label: "wallLeft",
        },
      ),
      Matter.Bodies.rectangle(
        width + thickness / 2,
        height / 2,
        thickness,
        height + thickness * 2,
        {
          isStatic: true,
          render: { fillStyle: "transparent" },
          label: "wallRight",
        },
      ),
      Matter.Bodies.rectangle(
        width / 2,
        -thickness / 2,
        width + thickness * 2,
        thickness,
        {
          isStatic: true,
          render: { fillStyle: "transparent" },
          label: "roof",
        },
      ),
    ]);
  };

  function initSimulation(containerElement: HTMLDivElement) {
    if (typeof window === "undefined" || !window.Matter) return;

    const Matter = window.Matter;
    const {
      Engine,
      Render,
      Runner,
      World,
      Bodies,
      MouseConstraint,
      Mouse,
      Events,
    } = Matter;

    const engine = Engine.create();
    engine.world.gravity.y = 0.6;
    engineRef.current = engine;

    const w = containerElement.clientWidth;
    const h = containerElement.clientHeight;

    const render = Render.create({
      element: containerElement,
      engine,
      options: {
        width: w,
        height: h,
        background: "transparent",
        wireframes: false,
        showBounds: false,
        showVelocity: false,
        showAngleIndicator: false,
        showDebug: false,
      },
    });
    renderRef.current = render;

    if (render.canvas) {
      Object.assign(render.canvas.style, {
        border: "none",
        outline: "none",
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
      });
    }

    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);
    runnerRef.current = runner;

    updateBoundaries(w, h);

    const tags = containerElement.querySelectorAll<HTMLElement>(".phys-tag");
    const tagBodies = Array.from(tags).map((tag) => {
      const tw = tag.offsetWidth;
      const th = tag.offsetHeight;
      const margin = 60;
      const x = Math.random() * (w - tw - margin * 2) + tw / 2 + margin;
      const y = Math.random() * (h - th - margin * 2) + th / 2 + margin;

      const body = Bodies.rectangle(x, y, tw, th, {
        chamfer: { radius: th / 2 },
        density: 0.008,
        friction: 0.3,
        frictionAir: 0.02,
        restitution: 0.4,
        render: { fillStyle: "transparent" },
      });

      World.add(engine.world, body);
      return { body, element: tag };
    });

    // Fade in tags after physics settles
    setTimeout(() => setTagsVisible(true), 300);

    const checkBounds = () => {
      const maxVelocity = 15;
      const maxAngular = 0.3;

      tagBodies.forEach(({ body }) => {
        const { x, y } = body.position;
        const margin = 50;

        if (x < -margin || x > w + margin || y < -margin || y > h + margin) {
          Matter.Body.setPosition(body, {
            x: w / 2 + (Math.random() - 0.5) * 100,
            y: h / 4 + Math.random() * 100,
          });
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(body, 0);
          return;
        }

        const vx = Math.max(
          -maxVelocity,
          Math.min(maxVelocity, body.velocity.x),
        );
        const vy = Math.max(
          -maxVelocity,
          Math.min(maxVelocity, body.velocity.y),
        );
        if (vx !== body.velocity.x || vy !== body.velocity.y) {
          Matter.Body.setVelocity(body, { x: vx, y: vy });
        }

        const av = Math.max(
          -maxAngular,
          Math.min(maxAngular, body.angularVelocity),
        );
        if (av !== body.angularVelocity) {
          Matter.Body.setAngularVelocity(body, av);
        }
      });
    };

    const onAfterUpdate = () => {
      checkBounds();
      tagBodies.forEach(({ body, element }) => {
        const { x, y } = body.position;
        element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
      });
    };

    afterUpdateRef.current = onAfterUpdate;
    Events.on(engine, "afterUpdate", onAfterUpdate);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.15,
        render: { visible: false },
      },
    });
    World.add(engine.world, mouseConstraint);

    window.addEventListener("resize", handleResize);
  }

  const tags = [
    {
      label: "Bubble.io",
      light: { bg: "#fde8e8", color: "#c0392b" },
      dark: { bg: "#3b1a1a", color: "#fca5a5" },
    },
    {
      label: "Nocode",
      light: { bg: "#fef3c7", color: "#b45309" },
      dark: { bg: "#3b2a0d", color: "#fcd34d" },
    },
    {
      label: "Expression",
      light: { bg: "#fce7f3", color: "#be185d" },
      dark: { bg: "#3b1a30", color: "#f9a8d4" },
    },
    {
      label: "Option Set",
      light: { bg: "#ede9fe", color: "#6d28d9" },
      dark: { bg: "#2d1f4e", color: "#c4b5fd" },
    },
    {
      label: "Interface",
      light: { bg: "#dbeafe", color: "#1d4ed8" },
      dark: { bg: "#1a2a4e", color: "#93c5fd" },
    },
    {
      label: "Version",
      light: { bg: "#d1fae5", color: "#065f46" },
      dark: { bg: "#0d3322", color: "#6ee7b7" },
    },
    {
      label: "Mobile",
      light: { bg: "#ccfbf1", color: "#0f766e" },
      dark: { bg: "#0d2e2a", color: "#5eead4" },
    },
    {
      label: "Design",
      light: { bg: "#fefce8", color: "#a16207" },
      dark: { bg: "#322a0d", color: "#fde68a" },
    },
    {
      label: "UX/UI",
      light: { bg: "#fff7ed", color: "#c2410c" },
      dark: { bg: "#3b1f0d", color: "#fdba74" },
    },
    {
      label: "Element",
      light: { bg: "#e0e7ff", color: "#3730a3" },
      dark: { bg: "#1e1f4e", color: "#a5b4fc" },
    },
    {
      label: "Repeating Group",
      light: { bg: "#fdf2f8", color: "#9d174d" },
      dark: { bg: "#37132a", color: "#f0abfc" },
    },
    {
      label: "API Connector",
      light: { bg: "#dcfce7", color: "#15803d" },
      dark: { bg: "#0d3320", color: "#86efac" },
    },
    {
      label: "Custom State",
      light: { bg: "#faf5ff", color: "#7e22ce" },
      dark: { bg: "#2a1a3e", color: "#d8b4fe" },
    },
    {
      label: "Conditional",
      light: { bg: "#fff1f2", color: "#be123c" },
      dark: { bg: "#3b1520", color: "#fda4af" },
    },
    {
      label: "Dynamic Data",
      light: { bg: "#eff6ff", color: "#1e40af" },
      dark: { bg: "#172040", color: "#bfdbfe" },
    },
    {
      label: "Plugins",
      light: { bg: "#f0fdf4", color: "#166534" },
      dark: { bg: "#0d2e1a", color: "#bbf7d0" },
    },
    {
      label: "Backend Workflow",
      light: { bg: "#fff7ed", color: "#9a3412" },
      dark: { bg: "#3b200d", color: "#fed7aa" },
    },
    {
      label: "Privacy Rules",
      light: { bg: "#f0f9ff", color: "#0369a1" },
      dark: { bg: "#0d2535", color: "#bae6fd" },
    },
    {
      label: "Events",
      light: { bg: "#fdf4ff", color: "#86198f" },
      dark: { bg: "#301535", color: "#f0abfc" },
    },
  ];

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"
        onLoad={handleScriptLoad}
        strategy="afterInteractive"
      />

      <motion.div
        ref={wrapperRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.3 }}
        className="h-full w-full"
      >
        <div className="relative h-full w-full overflow-hidden">
          <div ref={containerRef} className="absolute inset-0">
            {tags.map((tag, i) => {
              const scheme = isDark ? tag.dark : tag.light;
              return (
                <div
                  key={tag.label}
                  className="phys-tag absolute cursor-grab rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap select-none active:cursor-grabbing"
                  style={{
                    backgroundColor: scheme.bg,
                    color: scheme.color,
                    opacity: tagsVisible ? 1 : 0,
                    transition: `opacity 0.4s ease ${i * 30}ms, background-color 0.3s ease, color 0.3s ease`,
                  }}
                >
                  {tag.label}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function Illustration21() {
  return (
    <div className="flex h-[350px] w-full items-center justify-center rounded-md border">
      <TagCanvas />
    </div>
  );
}

declare global {
  interface Window {
    Matter: any;
  }
}
