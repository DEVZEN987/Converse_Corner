import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skillsApi } from '../lib/api';

export default function Home() {
  const { user } = useAuth();
  const [liveSkills, setLiveSkills] = useState([]);

  useEffect(() => {
    skillsApi
      .list()
      .then((list) => setLiveSkills(list.slice(0, 2)))
      .catch(() => {
        // fail silently – we'll fall back to demo content
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-slate-900/90 py-12 px-6 sm:px-10 mb-10 shadow-[0_18px_60px_rgba(15,23,42,0.55)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.4),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.35),transparent_55%)] opacity-90" />
          <div className="relative z-10 grid gap-10 items-center md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-indigo-200 mb-4">
                Skill sharing · Messaging · Collaboration
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                Turn your{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  skills
                </span>{' '}
                into real conversations.
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-200/85 leading-relaxed mb-6">
                Showcase what you can offer, find the skills you&apos;re seeking, and
                connect instantly with peers through a focused, distraction‑free chat
                experience.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-600 hover:shadow-indigo-500/60 transition"
                    >
                      Go to dashboard
                      <span className="ml-2 text-lg leading-none">↗</span>
                    </Link>
                    <Link
                      to="/add-skill"
                      className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/15 transition"
                    >
                      Add a skill
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-600 hover:shadow-indigo-500/60 transition"
                    >
                      Get started free
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/15 transition"
                    >
                      I already have an account
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-10 -right-6 h-32 w-32 rounded-full bg-indigo-400/40 blur-3xl" />
              <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-sky-400/40 blur-3xl" />

              <div className="relative rounded-2xl bg-slate-900/70 border border-white/8 px-4 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.75)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-[0.16em]">
                    Live skill cards
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    ● active today
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Primary skill with progress */}
                  <div className="rounded-xl bg-slate-800/80 px-3 py-3 flex items-center justify-between">
                    {liveSkills[0] ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-slate-100 line-clamp-1">
                            {liveSkills[0].name}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            by {liveSkills[0].user?.username || 'Unknown'} ·{' '}
                            {liveSkills[0].level}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] text-slate-300">Progress</span>
                          <div className="h-1.5 w-24 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400 transition-[width] duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, Number(liveSkills[0].progress ?? 0))
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-slate-100">
                            Frontend mentoring
                          </p>
                          <p className="text-[11px] text-slate-400">
                            by Ayesha · React · UX
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] text-slate-300">Progress</span>
                          <div className="h-1.5 w-24 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-indigo-400 to-sky-400" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Secondary skill with Chat button */}
                  <div className="rounded-xl bg-slate-800/60 px-3 py-3 flex items-center justify-between">
                    {liveSkills[1] ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-slate-100 line-clamp-1">
                            {liveSkills[1].name}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            by {liveSkills[1].user?.username || 'Unknown'} ·{' '}
                            {liveSkills[1].skillType || 'Offer'}
                          </p>
                        </div>
                        {liveSkills[1].user && (
                          <Link
                            to={`/messages?skill=${liveSkills[1]._id}&userId=${
                              liveSkills[1].user?._id || liveSkills[1].user
                            }&username=${encodeURIComponent(
                              liveSkills[1].user?.username || ''
                            )}`}
                            className="inline-flex items-center rounded-full bg-indigo-500/90 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-600/95 transition"
                          >
                            Chat
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-slate-100">
                            Learning UI design
                          </p>
                          <p className="text-[11px] text-slate-400">by Rahul · Seek</p>
                        </div>
                        <button className="inline-flex items-center rounded-full bg-indigo-500/90 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-600/95 transition">
                          Chat
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <Link
            to="/profile"
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <span className="text-lg">◆</span>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Skill management
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track levels, progress, and whether you&apos;re offering or seeking each
                skill in one clean profile.
              </p>
            </div>
          </Link>

          <Link
            to="/messages"
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <span className="text-lg">◇</span>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Real‑time messaging
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Jump into focused conversations with typing indicators, read states,
                and a familiar chat layout.
              </p>
            </div>
          </Link>

          <Link
            to="/browse-skill"
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <span className="text-lg">◈</span>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Browse &amp; connect
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discover people by their skills and reach out in one click when you
                find the perfect match.
              </p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
