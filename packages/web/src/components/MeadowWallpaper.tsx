const wallpaper = '/images/homepage-animation.gif';

/** Full-bleed looping wallpaper; the page content is layered above it. */
export function MeadowWallpaper() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a1d18]">
      <img
        src={wallpaper}
        alt=""
        decoding="async"
        fetchPriority="low"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#07120f]/20" />
    </div>
  );
}
