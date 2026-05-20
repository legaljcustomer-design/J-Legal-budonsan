          {/* Property Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-electric-blue" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {properties.length > 0 ? (
                properties.map((prop, index) => (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="card-luxury group bg-white"
                  >
                    <div className="relative h-56 overflow-hidden bg-zinc-800">
                      <img 
                        src={prop.images[0] || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-4 left-4 px-2 py-1 bg-electric-blue text-[10px] font-bold rounded uppercase tracking-wider text-white">
                        {CATEGORIES.find(c => c.id === prop.type)?.label}
                      </span>
                    </div>
                    
                    <div className="p-6 flex flex-col h-[280px]">
                      <div className="mb-4">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">
                          {prop.location}
                        </p>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                          {prop.title}
                        </h3>
                      </div>
                      <div className="flex flex-col mb-6 pt-4 border-t border-zinc-100">
                        <span className="text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                          {prop.price.replace(/상담\s*문의/g, '').trim()}
                        </span>
                      </div>
                      
                      <div className="mt-auto">
                        <Link 
                          to={`/property/${prop.id}`}
                          className="w-full py-4 bg-zinc-950 text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-all rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue shadow-lg active:scale-[0.98]"
                        >
                          매물 정보 더보기 <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-24 text-zinc-500 text-sm tracking-widest uppercase bg-zinc-200/50 rounded-3xl border border-zinc-200">
                  해당 카테고리에 등록된 매물이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-zinc-950 text-white py-20 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-4">
            <div className="text-2xl font-bold flex items-center gap-2">
              <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center text-sm">
                J
              </div>
              오사카J부동산
            </div>
            <p className="text-zinc-500 text-sm max-w-md">
              오사카 한인 경제의 중심에서 정직과 신뢰를 바탕으로 한 부동산 거래 문화를 선도합니다.
            </p>
          </div>
          <div className="flex gap-4">
            <a 
              href={
                settings.kakaoUrl?.trim() ||
                `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`
              } 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-electric-blue transition-colors"
            >
              <MessageCircle size={20} />
            </a>
            <a 
              href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-electric-blue transition-colors"
            >
              <MessageSquare size={20} />
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-center text-zinc-600 text-xs uppercase tracking-widest">
          &copy; {new Date().getFullYear()} OSAKA J REALTY. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
