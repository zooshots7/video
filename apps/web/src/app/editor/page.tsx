export default function EditorPage() {
  return (
    <div className="flex h-screen w-full flex-col bg-stone-950 text-slate-200">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-800 bg-stone-900/50 px-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-indigo-500" />
          <h1 className="text-sm font-semibold tracking-wide text-stone-100">Hybrid Editor</h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors">
            Share
          </button>
          <button className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors">
            Export
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Assets/Tools) */}
        <aside className="flex w-16 shrink-0 flex-col items-center border-r border-stone-800 bg-stone-900/30 py-4 gap-4">
            {['Media', 'Audio', 'Text', 'Transitions', 'Filters'].map((item, idx) => (
              <button key={item} className="flex h-12 w-12 flex-col items-center justify-center rounded-lg hover:bg-stone-800/80 text-stone-400 hover:text-stone-200 transition-all">
                  <div className="h-5 w-5 mb-1 rounded bg-stone-700/50" />
                  <span className="text-[9px] font-medium">{item}</span>
              </button>
            ))}
        </aside>

        {/* Left Panel (Tool Options / Asset Library) */}
        <section className="w-64 shrink-0 border-r border-stone-800 bg-stone-900/30 p-4">
          <h2 className="text-sm font-semibold text-stone-200 mb-4">Project Assets</h2>
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-stone-800">
             <p className="text-xs text-stone-500">Drag & Drop Media</p>
          </div>
        </section>

        {/* Center Canvas Area */}
        <main className="flex flex-1 flex-col items-center justify-center bg-black/40 p-8 relative">
          {/* Canvas Wrapper */}
          <div className="relative aspect-video w-full max-w-4xl rounded-lg bg-stone-900 shadow-2xl overflow-hidden ring-1 ring-stone-800/50">
             <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-sm text-stone-500">Preview Renderer (PixiJS)</p>
             </div>
          </div>
          
          {/* Playback Controls */}
          <div className="absolute bottom-4 flex items-center gap-4 rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 backdrop-blur-md">
             <button className="text-stone-300 hover:text-white">◁</button>
             <button className="text-stone-300 hover:text-white">▷</button>
             <div className="w-px h-4 bg-stone-700" />
             <span className="text-xs font-mono text-stone-400">00:00:00</span>
          </div>
        </main>

        {/* Right Settings Panel */}
        <aside className="w-72 shrink-0 border-l border-stone-800 bg-stone-900/30 p-4">
          <h2 className="text-sm font-semibold text-stone-200 mb-4">Properties</h2>
          <div className="space-y-4">
             <div className="rounded-lg bg-stone-800/30 p-3">
                 <p className="text-xs text-stone-400">Select an item on the timeline to view properties.</p>
             </div>
          </div>
        </aside>
      </div>

      {/* Bottom Timeline Section */}
      <footer className="flex h-64 shrink-0 flex-col border-t border-stone-800 bg-stone-900/50">
        {/* Timeline Header (Tools) */}
        <div className="flex h-10 items-center border-b border-stone-800/50 px-4 bg-stone-900">
           <div className="flex gap-2">
              <button className="rounded px-2 py-1 text-xs text-stone-400 hover:bg-stone-800 hover:text-stone-200">Split</button>
              <button className="rounded px-2 py-1 text-xs text-stone-400 hover:bg-stone-800 hover:text-stone-200">Delete</button>
           </div>
           <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-stone-500">Zoom</span>
              <input type="range" className="w-24 accent-indigo-500" />
           </div>
        </div>
        
        {/* Timeline Tracks Area */}
        <div className="flex-1 overflow-auto relative p-4 flex flex-col gap-2">
            {/* Mock Tracks */}
            <div className="flex h-12 w-full rounded bg-stone-800/30 ring-1 ring-stone-800 flex items-center px-4">
                <span className="text-xs font-medium text-stone-500 w-16 shrink-0">V1</span>
                <div className="h-8 w-64 rounded bg-indigo-600/20 border border-indigo-500/50 flex items-center px-2">
                    <span className="text-[10px] text-indigo-300">sample_video.mp4</span>
                </div>
            </div>
            <div className="flex h-12 w-full rounded bg-stone-800/30 ring-1 ring-stone-800 flex items-center px-4">
                <span className="text-xs font-medium text-stone-500 w-16 shrink-0">A1</span>
                <div className="h-8 w-48 rounded bg-teal-600/20 border border-teal-500/50 flex items-center px-2">
                    <span className="text-[10px] text-teal-300">background_music.mp3</span>
                </div>
            </div>
            
            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[200px] w-0.5 bg-rose-500 z-10 shadow-[0_0_8px_rgba(244,63,94,0.5)]">
               <div className="absolute -top-1 -left-1.5 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-rose-500" />
            </div>
        </div>
      </footer>
    </div>
  );
}
