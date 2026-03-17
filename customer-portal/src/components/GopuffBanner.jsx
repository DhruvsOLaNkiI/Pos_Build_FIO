const GopuffBanner = ({ onClick }) => (
  <div 
    className="w-full overflow-hidden bg-[#e6f0ff] py-2 flex whitespace-nowrap cursor-pointer hover:bg-blue-100 transition-colors border-b border-blue-100" 
    onClick={onClick}
  >
    <div className="flex animate-marquee text-blue-600 font-black text-[10px] tracking-[0.15em] uppercase italic">
      <span className="mx-12">NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉</span>
      <span className="mx-12">NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉</span>
      <span className="mx-12">NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉</span>
      <span className="mx-12">NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉</span>
      <span className="mx-12">NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉</span>
      <span className="mx-12">NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉</span>
    </div>
  </div>
);

export default GopuffBanner;
