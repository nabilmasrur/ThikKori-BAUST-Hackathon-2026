import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CategoryIcon, IconSearch, IconStar } from '@/components/Icons';
import { CATEGORIES } from '@/data/seed';
import { useData } from '@/state/DataContext';
import { useFmt } from '@/lib/useFmt';

export function WelcomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { t, locale } = useFmt();
  const { db } = useData();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate('/login?role=customer');
    }
  };

  const POPULAR_PROJECTS = [
    { id: '1', title: t('welcome.projects.move.title'), price: t('welcome.projects.move.price'), image: '/images/moving.jpg' },
    { id: '2', title: t('welcome.projects.clean.title'), price: t('welcome.projects.clean.price'), image: '/images/cleaning.jpg' },
    { id: '3', title: t('welcome.projects.plumb.title'), price: t('welcome.projects.plumb.price'), image: '/images/plumbing.jpg' },
    { id: '4', title: t('welcome.projects.elect.title'), price: t('welcome.projects.elect.price'), image: '/images/electrical.jpg' },
  ];

  const REVIEWS = [
    { name: t('welcome.reviews.r1.name'), text: t('welcome.reviews.r1.text'), service: t('welcome.reviews.r1.service') },
    { name: t('welcome.reviews.r2.name'), text: t('welcome.reviews.r2.text'), service: t('welcome.reviews.r2.service') },
    { name: t('welcome.reviews.r3.name'), text: t('welcome.reviews.r3.text'), service: t('welcome.reviews.r3.service') },
    { name: t('welcome.reviews.r4.name'), text: t('welcome.reviews.r4.text'), service: t('welcome.reviews.r4.service') },
    { name: t('welcome.reviews.r5.name'), text: t('welcome.reviews.r5.text'), service: t('welcome.reviews.r5.service') },
    { name: t('welcome.reviews.r6.name'), text: t('welcome.reviews.r6.text'), service: t('welcome.reviews.r6.service') },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#F9FAFB] font-sans text-ink">
      {/* Top Nav */}
      <div className="pt-4 px-6 relative z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-6 md:flex font-semibold text-[15px]">
              <Link to="/login?role=customer" className="hover:text-teal-deep text-ink transition-colors">{t('welcome.services')}</Link>
              <Link to="/login?role=customer" className="hover:text-teal-deep text-ink transition-colors">{t('welcome.logIn')}</Link>
              <Link to="/signup" className="hover:text-teal-deep text-ink transition-colors">{t('welcome.signUp')}</Link>
            </div>
            <Link to="/login?role=provider" className="hidden sm:inline-flex rounded-full border border-teal-deep px-5 py-2.5 text-[14px] font-semibold hover:bg-teal-deep hover:text-white transition-all bg-white text-teal-deep shadow-sm hover:shadow-md">
              {t('welcome.becomeProvider')}
            </Link>
            <LanguageToggle />
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-32 bg-[#F9FAFB] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center relative z-10 bg-white/60 backdrop-blur-xl p-8 md:p-14 rounded-[2.5rem] border border-white shadow-xl"
        >
          <h1 className="mb-10 font-display text-[48px] font-extrabold leading-tight md:text-[64px] text-[#0F172A] drop-shadow-sm">
            {t('welcome.motoTitle')} <br /> {t('welcome.motoSubtitle')}
          </h1>
          
          <form onSubmit={handleSearch} className="mx-auto flex w-full max-w-2xl items-center rounded-full border-[2px] border-stone-line/50 bg-white pl-6 pr-2 py-2 shadow-lg transition-all focus-within:border-[#0A5840] focus-within:shadow-xl hover:shadow-xl">
            <input
              type="text"
              placeholder={t('welcome.searchPlaceholder')}
              className="flex-1 bg-transparent py-3 outline-none text-[17px] font-medium text-ink placeholder:text-ink-soft/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit" 
              className="flex h-14 w-20 items-center justify-center rounded-full bg-[#0A5840] text-white hover:bg-[#074632] transition-colors shadow-md"
            >
              <IconSearch />
            </motion.button>
          </form>
        </motion.div>
      </section>

      {/* Categories Bar */}
      <section className="border-y border-stone-line bg-white shadow-sm relative z-20">
        <div className="mx-auto max-w-7xl overflow-x-auto px-6 py-8">
          <div className="flex items-start justify-between gap-10 min-w-max px-4">
            {CATEGORIES.map((cat, i) => (
              <Link to="/login?role=customer" key={cat.id} className="flex flex-col items-center gap-3 group cursor-pointer outline-none">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#F3F5F6] group-hover:bg-[#EAF0EE] transition-colors relative shadow-sm group-hover:shadow-md"
                >
                  <div className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-blue-100/50 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  <CategoryIcon name={cat.icon} className="h-9 w-9 text-[#0A5840] relative z-10 transition-transform duration-300 group-hover:scale-110" />
                </motion.div>
                <span className="text-[15px] font-bold text-ink group-hover:text-[#0A5840] transition-colors text-center w-28 leading-tight">
                  {locale === 'bn' ? cat.name_bn : cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Projects Grid */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 font-display font-extrabold text-[36px] text-[#0A5840]"
        >
          {t('welcome.popularProjects')}
        </motion.h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_PROJECTS.map((project, i) => (
            <Link to="/login?role=customer" key={project.id} className="block outline-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-2xl border border-stone-line bg-white shadow-sm hover:shadow-xl transition-all h-full flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-base relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                  <img src={project.image} alt={project.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="p-6 text-center flex-1 flex flex-col justify-center">
                  <h3 className="mb-2 font-bold text-[18px] text-ink leading-snug group-hover:text-[#0A5840] transition-colors">{project.title}</h3>
                  <p className="text-[16px] font-medium text-ink-soft">{project.price}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="bg-white py-24 px-6 border-t border-stone-line/50">
         <div className="max-w-7xl mx-auto">
           <motion.h2 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="font-display font-extrabold text-[36px] text-[#0A5840] mb-16"
           >
             {t('welcome.testimonialsTitle')}
           </motion.h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
             {db?.reviews.length ? db.reviews.slice(0, 6).map((review, i) => {
               const c = db.customers.find(c => c.id === review.customer_id);
               const p = db.providers.find(p => p.id === review.provider_id);
               return (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.05 }}
                   key={review.id} 
                   className="flex flex-col group"
                 >
                   <div className="flex items-center gap-3 mb-4">
                     <h4 className="font-bold text-[18px] text-ink">{c?.name || 'Customer'}</h4>
                     <div className="flex items-center text-[#E8B923]">
                       {[...Array(review.rating)].map((_, j) => (
                         <IconStar key={j} size={18} filled />
                       ))}
                     </div>
                   </div>
                   <p className="text-[16px] text-ink-soft leading-relaxed mb-5 flex-1 group-hover:text-ink transition-colors">
                     "{review.comment}"
                   </p>
                   <Link to="/login?role=customer" className="text-[16px] font-bold text-[#0A5840] hover:text-teal-deep hover:underline transition-all">
                     Service by {p?.business_name || 'Provider'} →
                   </Link>
                 </motion.div>
               );
             }) : REVIEWS.map((review, i) => (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.05 }}
                 key={i} 
                 className="flex flex-col group"
               >
                 <div className="flex items-center gap-3 mb-4">
                   <h4 className="font-bold text-[18px] text-ink">{review.name}</h4>
                   <div className="flex items-center text-[#E8B923]">
                     {[...Array(5)].map((_, j) => (
                       <IconStar key={j} size={18} filled />
                     ))}
                   </div>
                 </div>
                 <p className="text-[16px] text-ink-soft leading-relaxed mb-5 flex-1 group-hover:text-ink transition-colors">
                   "{review.text}"
                 </p>
                 <Link to="/login?role=customer" className="text-[16px] font-bold text-[#0A5840] hover:text-teal-deep hover:underline transition-all">
                   {review.service} →
                 </Link>
               </motion.div>
             ))}
           </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-line bg-[#F9FAFB] py-12 text-center text-[15px] font-medium text-ink-soft px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <p>© 2026 ThikKori. {t('welcome.allRightsReserved')}</p>
          <div className="flex gap-6">
             <Link to="#" className="hover:text-[#0A5840] transition-colors">{t('welcome.terms')}</Link>
             <Link to="#" className="hover:text-[#0A5840] transition-colors">{t('welcome.privacy')}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
