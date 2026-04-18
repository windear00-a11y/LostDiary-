export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-950 text-white">
      <h2 className="text-2xl font-serif italic mb-4">Space Not Found</h2>
      <p className="text-neutral-400 mb-8 font-serif">We couldn't find the corner of the diary you were looking for.</p>
      <a href="/" className="px-6 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors">
        Return Home
      </a>
    </div>
  )
}
