import React from "react";

export default function Footer5() {
  return (
    <div className="bg-black px-4 pt-20">
      <footer className="mx-auto w-full max-w-[1350px] overflow-hidden rounded-tl-3xl rounded-tr-3xl bg-white px-4 pt-8 font-sans text-black sm:px-8 md:px-16 lg:px-28 lg:pt-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:gap-12 lg:grid-cols-6">
          <div className="space-y-6 lg:col-span-3">
            <a href="https://shadcnuikit.com" className="block">
              <svg
                width="31"
                height="33"
                viewBox="0 0 31 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m8.349 4.55 7.098 3.884 7.098-3.885M8.35 27.83v-7.755l-7.1-3.886m28.394 0-7.099 3.885v7.754M1.676 8.658l13.771 7.546 13.77-7.546M15.448 31.25V16.189m14.197 5.976V10.212c0-.524-.147-1.039-.424-1.492a3.1 3.1 0 0 0-1.154-1.093L17.024 1.65a3.3 3.3 0 0 0-1.577-.4 3.3 3.3 0 0 0-1.577.4L2.828 7.627A3.07 3.07 0 0 0 1.674 8.72a2.87 2.87 0 0 0-.424 1.492v11.953c0 .524.147 1.04.424 1.493s.675.83 1.154 1.092l11.042 5.977c.48.262 1.023.4 1.577.4a3.3 3.3 0 0 0 1.577-.4l11.042-5.977c.48-.262.877-.639 1.154-1.092s.423-.969.424-1.493"
                  stroke="#262626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <p className="max-w-96 text-sm/6 text-neutral-600">
              Shadcn UI Kit helps you build faster by transforming your design
              vision into fully functional, production-ready UI components.
            </p>
            <div className="order-1 flex gap-5 md:order-2 md:gap-6">
              {/* X (Twitter) */}
              <a href="#" className="text-neutral-600 hover:text-neutral-700">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              {/* Github */}
              <a href="#" className="text-neutral-600 hover:text-neutral-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              {/* Linkedin */}
              <a href="#" className="text-neutral-600 hover:text-neutral-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              {/* Youtube */}
              <a href="#" className="text-neutral-600 hover:text-neutral-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="text-neutral-600 hover:text-neutral-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 items-start gap-8 md:grid-cols-3 md:gap-12 lg:col-span-3 lg:gap-28">
            {/* Products */}
            <div>
              <h3 className="mb-4 text-sm font-medium">Products</h3>
              <ul className="space-y-3 text-sm text-neutral-800">
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Components
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Icons
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="mb-4 text-sm font-medium">Resources</h3>
              <ul className="space-y-3 text-sm text-neutral-800">
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Shadcn UI Kit
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Components
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Blogs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Store
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="mb-4 text-sm font-medium">Company</h3>
              <ul className="space-y-3 text-sm text-neutral-800">
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Vision
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <a href="#" className="hover:text-neutral-700">
                    Careers
                  </a>
                  <span className="rounded-full border border-neutral-400 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-700">
                    HIRING
                  </span>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-neutral-700">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-neutral-300 pt-4">
          <p className="text-sm text-neutral-600">
            © 2025 Shadcn UI Kit Design
          </p>
          <p className="text-sm text-neutral-600">All right reserved.</p>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-full max-h-64 w-full max-w-3xl rounded-full bg-slate-100 blur-[100px]" />
          <h1 className="mt-6 text-center text-[clamp(3rem,15vw,15rem)] leading-[0.7] font-extrabold text-transparent [-webkit-text-stroke:1px_#D4D4D4]">
            Shadcn UI Kit
          </h1>
        </div>
      </footer>
    </div>
  );
}
