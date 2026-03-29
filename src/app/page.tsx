export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-neutral-950">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm max-w-[800px] text-center">
        <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-500 mb-6 drop-shadow-lg">
          DivyaDrishti Engine
        </h1>
        <p className="text-xl text-neutral-400 mb-12">
          Initializing the Quantitative Life Operating System.
        </p>
        <div className="p-8 border border-neutral-800 rounded-xl bg-neutral-900 shadow-2xl">
          <p className="text-emerald-400 font-mono text-lg animate-pulse">System is booting. Awaiting Database Link...</p>
        </div>
      </div>
    </main>
  );
}
