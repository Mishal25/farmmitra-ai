import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudSun,
  FileImage,
  Handshake,
  IndianRupee,
  Leaf,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Language = 'en' | 'hi';
type AnalysisState = 'idle' | 'loading' | 'ready';

const crops = [
  { value: 'tomato', en: 'Tomato', hi: 'टमाटर', variety: 'Hybrid tomato' },
  { value: 'wheat', en: 'Wheat', hi: 'गेहूँ', variety: 'Lok-1 wheat' },
  { value: 'cotton', en: 'Cotton', hi: 'कपास', variety: 'Desi cotton' },
  { value: 'onion', en: 'Onion', hi: 'प्याज़', variety: 'Red onion' },
];

const marketData: Record<string, { market: string; district: string; price: string; change: string; up: boolean; range: string; updated: string; hint: string }> = {
  tomato: { market: 'Lasalgaon APMC', district: 'Nashik, Maharashtra', price: '₹2,840', change: '₹120 today', up: true, range: '₹2,640 — ₹2,910', updated: 'Today, 8:40 am', hint: 'Prices are firming with arrivals easing.' },
  wheat: { market: 'Mandi Samiti Sehore', district: 'Sehore, Madhya Pradesh', price: '₹2,465', change: '₹35 today', up: true, range: '₹2,390 — ₹2,520', updated: 'Today, 7:55 am', hint: 'A steady market; quality lots are moving first.' },
  cotton: { market: 'Gondal Yard', district: 'Rajkot, Gujarat', price: '₹7,180', change: '₹90 today', up: false, range: '₹7,080 — ₹7,340', updated: 'Yesterday, 6:10 pm', hint: 'Softer arrivals may bring a small rebound this week.' },
  onion: { market: 'Pimpalgaon Baswant', district: 'Nashik, Maharashtra', price: '₹1,960', change: '₹75 today', up: true, range: '₹1,820 — ₹2,040', updated: 'Today, 8:15 am', hint: 'Demand is holding; watch the next two arrival days.' },
};

const sampleCropImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
    <defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#cdd9b5"/><stop offset="1" stop-color="#829a66"/></linearGradient><radialGradient id="fruit"><stop stop-color="#e9a23b"/><stop offset="1" stop-color="#a8422e"/></radialGradient></defs>
    <rect width="960" height="640" fill="url(#bg)"/><path d="M0 438c180-68 300-34 465-64 183-34 284-109 495-74v340H0z" fill="#92734b"/><path d="M0 506c205-42 349-30 543-57 132-18 280-73 417-37v228H0z" fill="#775c3e"/>
    <path d="M430 560c-13-131 35-215 135-289M437 537c-110-86-159-167-143-259M487 472c101-61 175-128 205-215" fill="none" stroke="#315c45" stroke-width="18" stroke-linecap="round"/>
    <g fill="#3f794c"><ellipse cx="315" cy="293" rx="105" ry="42" transform="rotate(29 315 293)"/><ellipse cx="583" cy="245" rx="125" ry="47" transform="rotate(-29 583 245)"/><ellipse cx="623" cy="373" rx="120" ry="45" transform="rotate(19 623 373)"/></g>
    <g fill="url(#fruit)" stroke="#893c2e" stroke-width="6"><circle cx="451" cy="334" r="77"/><circle cx="550" cy="299" r="68"/><circle cx="364" cy="390" r="64"/></g>
    <g fill="#f6d28a" opacity=".35"><circle cx="426" cy="310" r="13"/><circle cx="528" cy="277" r="11"/><circle cx="344" cy="370" r="10"/></g>
  </svg>
`)}`;

const enCopy = {
  greeting: 'Good morning, let’s grow better today',
  subtitle: 'A clear first look at your crop, and the next sensible step.',
  uploadTitle: 'Show me what is happening',
  uploadBody: 'Take a photo in daylight. Keep the leaf or fruit close and in focus.',
  uploadAction: 'Upload crop photo',
  sample: 'Try a sample photo',
  readyTitle: 'Your crop check is ready',
  readyBody: 'This is a first look, not a final diagnosis. Use the advice below and watch the plant for 2–3 days.',
  analyze: 'Check this crop',
  checking: 'Looking closely…',
  newPhoto: 'Use another photo',
  marketTitle: 'Mandi watch',
  marketBody: 'Today’s useful number for your crop and market.',
  alertTitle: 'Never miss your selling window',
  alertBody: 'Get one simple message when your mandi price moves.',
  alertAction: 'Set price alert',
  alertDone: 'Price alert is on',
  guidance: 'What you can do today',
  guidanceBody: 'Small, practical steps. Start with the first one.',
  partner: 'Bring FarmMitra to your farmers',
  partnerBody: 'For FPOs, agri-input teams and field programmes that want simple crop support at scale.',
  partnerAction: 'Talk to our field team',
};

const hiCopy = {
  greeting: 'सुप्रभात, आज फसल को और बेहतर बनाएं',
  subtitle: 'आपकी फसल की साफ़ पहली जाँच और अगला सही कदम।',
  uploadTitle: 'फसल की तस्वीर दिखाइए',
  uploadBody: 'दिन की रोशनी में फोटो लें। पत्ता या फल पास और साफ़ दिखाई दे।',
  uploadAction: 'फसल की फोटो डालें',
  sample: 'एक नमूना फोटो देखें',
  readyTitle: 'फसल की जाँच तैयार है',
  readyBody: 'यह पहली जाँच है, अंतिम रोग पहचान नहीं। सलाह अपनाकर 2–3 दिन पौधे को देखें।',
  analyze: 'फसल की जाँच करें',
  checking: 'ध्यान से देख रहे हैं…',
  newPhoto: 'दूसरी फोटो इस्तेमाल करें',
  marketTitle: 'मंडी भाव',
  marketBody: 'आपकी फसल और मंडी का आज का काम का भाव।',
  alertTitle: 'बेचने का सही समय न चूकें',
  alertBody: 'मंडी भाव बदलने पर एक आसान संदेश पाएं।',
  alertAction: 'भाव का अलर्ट लगाएं',
  alertDone: 'भाव का अलर्ट चालू है',
  guidance: 'आज आप क्या कर सकते हैं',
  guidanceBody: 'छोटे, काम के कदम। पहले कदम से शुरू करें।',
  partner: 'अपने किसानों तक FarmMitra लाएं',
  partnerBody: 'एफपीओ, कृषि-इनपुट टीमें और फील्ड कार्यक्रमों के लिए सरल फसल सहायता।',
  partnerAction: 'हमारी टीम से बात करें',
};

function Logo() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-farmmitra">
      <div className="logo-mark" aria-hidden="true"><Leaf size={18} strokeWidth={2.4} /></div>
      <div>
        <div className="display text-xl font-bold leading-none tracking-tight">FarmMitra</div>
        <div className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Your field companion</div>
      </div>
    </div>
  );
}

function AppHeader({ language, setLanguage, onPartner }: { language: Language; setLanguage: (value: Language) => void; onPartner: () => void }) {
  return (
    <header className="topbar border-b border-border/70">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 md:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <button className="hidden button-ghost md:flex" onClick={onPartner} data-testid="button-header-partnership">
            <Handshake size={16} /> Partner with us
          </button>
          <div className="language-toggle" role="group" aria-label="Choose language">
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'} data-testid="button-language-english">EN</button>
            <button className={language === 'hi' ? 'active' : ''} onClick={() => setLanguage('hi')} aria-pressed={language === 'hi'} data-testid="button-language-hindi">हिंदी</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function CropUpload({ copy, preview, setPreview, analysisState, setAnalysisState }: {
  copy: typeof enCopy;
  preview: string | null;
  setPreview: (value: string | null) => void;
  analysisState: AnalysisState;
  setAnalysisState: (value: AnalysisState) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const receiveFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please choose a JPG, PNG or HEIC photo.');
      return;
    }
    setUploadMessage('');
    setPreview(URL.createObjectURL(file));
    setAnalysisState('idle');
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => receiveFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    receiveFile(event.dataTransfer.files?.[0]);
  };
  const analyze = () => {
    if (!preview) return;
    setAnalysisState('loading');
    timerRef.current = window.setTimeout(() => setAnalysisState('ready'), 1500);
  };

  return (
    <section className="card-surface overflow-hidden rounded-[1.35rem]" aria-labelledby="crop-check-title">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5 md:px-7">
        <div>
          <span className="section-kicker">01 · Crop check</span>
          <h2 id="crop-check-title" className="display mt-3 text-[1.7rem] font-semibold leading-[1.08]">{copy.uploadTitle}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{copy.uploadBody}</p>
        </div>
        <div className="hidden rounded-full bg-accent/25 p-3 text-secondary sm:block"><ScanLine size={21} /></div>
      </div>
      <div className="p-5 md:p-7">
        {!preview ? (
          <>
            <div
              className={`upload-zone flex min-h-[250px] flex-col items-center justify-center rounded-xl px-6 text-center ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              data-testid="dropzone-crop-photo"
            >
              <div className="upload-icon"><Upload size={23} /></div>
              <div className="mt-4 text-sm font-bold text-secondary">{copy.uploadAction}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">JPG, PNG or HEIC · up to 10 MB</div>
              <button className="button-primary mt-5" onClick={() => inputRef.current?.click()} data-testid="button-upload-crop-photo">
                <FileImage size={16} /> Choose a photo
              </button>
              <input ref={inputRef} className="sr-only" type="file" accept="image/*" onChange={handleInput} aria-label="Upload a crop photo" data-testid="input-crop-photo" />
            </div>
            <button className="button-ghost mt-4" onClick={() => setPreview(sampleCropImage)} data-testid="button-use-sample-photo">
              <Sparkles size={15} /> {copy.sample}
            </button>
            {uploadMessage && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-destructive" role="alert" data-testid="status-upload-error"><AlertCircle size={14} />{uploadMessage}</p>}
          </>
        ) : (
          <div className="grid gap-5 md:grid-cols-[190px_1fr] md:items-center">
            <div className="relative h-48 overflow-hidden rounded-xl bg-muted md:h-44">
              <img src={preview} alt="Uploaded crop for analysis" className="preview-image" data-testid="img-crop-preview" />
              <button className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-secondary/85 text-secondary-foreground" onClick={() => { setPreview(null); setAnalysisState('idle'); }} aria-label="Remove crop photo" data-testid="button-remove-crop-photo"><X size={15} /></button>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-secondary"><Check size={15} className="text-primary" /> Photo added · ready for a first look</div>
              {analysisState === 'loading' ? (
                <div className="mt-5" data-testid="status-analysis-loading">
                  <div className="flex items-center gap-2 text-sm font-bold text-secondary"><LoaderCircle size={17} className="animate-spin text-primary" /> {copy.checking}</div>
                  <div className="skeleton mt-4 h-2 w-full rounded-full" /><div className="skeleton mt-2 h-2 w-4/5 rounded-full" />
                </div>
              ) : analysisState === 'ready' ? (
                <div className="mt-4 rounded-xl border border-secondary/15 bg-secondary/5 p-4" data-testid="status-analysis-ready">
                  <div className="flex items-center gap-2 text-sm font-bold text-secondary"><ShieldCheck size={17} className="text-secondary" /> {copy.readyTitle}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.readyBody}</p>
                  <button className="button-ghost mt-3" onClick={() => { setPreview(null); setAnalysisState('idle'); }} data-testid="button-new-crop-photo">{copy.newPhoto} <RefreshCw size={14} /></button>
                </div>
              ) : (
                <>
                  <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">We’ll look for common signs on the visible leaf, fruit or stem.</p>
                  <button className="button-primary mt-4" onClick={analyze} data-testid="button-analyze-crop"><ScanLine size={16} /> {copy.analyze}</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisResult({ language, analysisState }: { language: Language; analysisState: AnalysisState }) {
  if (analysisState !== 'ready') {
    return (
      <section className="tip-card relative overflow-hidden rounded-[1.35rem] p-6 md:p-7" aria-label="How FarmMitra works">
        <div className="leaf-line" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-accent"><CircleHelp size={15} /> {language === 'hi' ? 'ध्यान रखने वाली बात' : 'A useful first step'}</div>
          <h2 className="display mt-5 max-w-sm text-[2rem] font-semibold leading-[1.06]">{language === 'hi' ? 'अच्छी तस्वीर, आधी मदद।' : 'A good photo is half the help.'}</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-secondary-foreground/75">{language === 'hi' ? 'पौधे के जिस हिस्से में दिक्कत है, उसे पास से और साफ़ रोशनी में दिखाएं।' : 'Show the part that looks different, close up and in clear daylight. It helps us give you a more useful first look.'}</p>
          <div className="mt-7 flex items-center gap-3 border-t border-secondary-foreground/15 pt-4 text-xs text-secondary-foreground/65"><Clock3 size={15} /> {language === 'hi' ? 'जाँच में एक मिनट से कम लगेगा' : 'A check takes less than a minute'}</div>
        </div>
      </section>
    );
  }

  const hindi = language === 'hi';
  return (
    <section className="card-surface rounded-[1.35rem] p-5 md:p-7" aria-labelledby="analysis-title" data-testid="card-analysis-result">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="pill pill-amber"><span className="status-dot pending" /> {hindi ? 'देखने लायक संकेत' : 'Worth watching'}</span>
          <h2 id="analysis-title" className="display mt-4 text-[1.85rem] font-semibold leading-[1.06]">{hindi ? 'शुरुआती झुलसा रोग के संकेत' : 'Early blight-like signs'}</h2>
        </div>
        <div className="rounded-full bg-accent/25 p-3 text-primary"><Leaf size={21} /></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{hindi ? 'पत्तियों पर गोल भूरे धब्बे दिख रहे हैं। यह नमी और लगातार पत्तियों के गीले रहने से बढ़ सकता है।' : 'Round brown spots are visible on the lower leaves. This can spread when leaves stay wet for long periods.'}</p>
      <div className="mt-5 flex items-center gap-3 rounded-xl bg-secondary/7 p-3.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-accent"><ShieldCheck size={17} /></div>
        <div><div className="text-xs font-extrabold text-secondary">{hindi ? 'भरोसे का स्तर · मध्यम' : 'Confidence · medium'}</div><div className="mt-1 text-[11px] text-muted-foreground">{hindi ? 'फोटो से पहली जाँच' : 'First look from one photo'}</div></div>
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <div className="text-xs font-extrabold uppercase tracking-[.12em] text-muted-foreground">{hindi ? 'अगले 24 घंटे' : 'In the next 24 hours'}</div>
        <ul className="mt-3 space-y-3 text-sm">
          {(hindi ? ['प्रभावित पत्तियां अलग करके खेत से बाहर करें।', 'सिंचाई सुबह करें और पत्तियों को गीला न रखें।', '3 दिन बाद फिर फोटो लेकर तुलना करें।'] : ['Remove the most affected leaves and take them away from the field.', 'Water in the morning; avoid wetting the leaves.', 'Take another photo in 3 days and compare.']).map((item, index) => (
            <li className="flex items-start gap-3 leading-5" key={item}><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-secondary">{index + 1}</span><span>{item}</span></li>
          ))}
        </ul>
      </div>
      <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground"><AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" /> {hindi ? 'तेज़ी से फैलने पर नज़दीकी कृषि अधिकारी से पक्की सलाह लें।' : 'If it spreads quickly, ask a nearby agriculture officer for a confirmed diagnosis.'}</p>
    </section>
  );
}

function Guidance({ copy }: { copy: typeof enCopy }) {
  const steps = [
    { icon: Leaf, number: '01', title: copy === hiCopy ? 'खेत का एक छोटा हिस्सा साफ़ रखें' : 'Keep one small patch clean', body: copy === hiCopy ? 'पहले प्रभावित पत्तियां हटाएं ताकि हवा चलती रहे।' : 'Start by removing affected leaves so air can move through the plant.' },
    { icon: CloudSun, number: '02', title: copy === hiCopy ? 'सुबह पानी दें' : 'Water with the morning sun', body: copy === hiCopy ? 'पत्तियों पर पानी न डालें; जड़ों तक धीरे-धीरे दें।' : 'Keep water at the roots, not on the leaves. A dry leaf is a safer leaf.' },
    { icon: MessageCircle, number: '03', title: copy === hiCopy ? 'फिर से हमें दिखाएं' : 'Come back with an update', body: copy === hiCopy ? '2–3 दिन बाद नई फोटो से बदलाव समझने में मदद मिलेगी।' : 'A second photo in 2–3 days will make the next step clearer.' },
  ];
  return (
    <section className="mt-10" aria-labelledby="guidance-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><span className="section-kicker">02 · Field notes</span><h2 id="guidance-title" className="display mt-3 text-3xl font-semibold">{copy.guidance}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.guidanceBody}</p></div>
        <div className="hidden items-center gap-2 text-xs font-bold text-secondary sm:flex"><Sprout size={16} /> Advice made for the field</div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, number, title, body }) => (
          <article className="card-surface lift rounded-2xl p-5" key={number} data-testid={`card-guidance-${number}`}>
            <div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/10 text-secondary"><Icon size={19} /></div><span className="display text-3xl font-semibold text-primary/35">{number}</span></div>
            <h3 className="mt-6 text-sm font-extrabold leading-5">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MandiWatch({ crop, setCrop, market, setMarket, copy }: { crop: string; setCrop: (value: string) => void; market: string; setMarket: (value: string) => void; copy: typeof enCopy }) {
  const price = marketData[crop];
  const selectedCrop = crops.find((item) => item.value === crop) ?? crops[0];
  const marketOptions = crop === 'tomato' ? ['Lasalgaon APMC', 'Pune Market Yard', 'Kolar APMC'] : crop === 'wheat' ? ['Mandi Samiti Sehore', 'Indore Krishi Mandi', 'Kota Bhamashah Mandi'] : crop === 'cotton' ? ['Gondal Yard', 'Rajkot APMC', 'Akola Cotton Market'] : ['Pimpalgaon Baswant', 'Lasalgaon APMC', 'Solapur APMC'];
  return (
    <section className="card-surface rounded-[1.35rem] p-5 md:p-7" aria-labelledby="mandi-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="section-kicker">03 · Mandi watch</span><h2 id="mandi-title" className="display mt-3 text-[1.85rem] font-semibold leading-[1.06]">{copy.marketTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.marketBody}</p></div>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-accent/25 text-primary"><TrendingUp size={21} /></div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="text-[11px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Crop
          <div className="relative mt-2"><select value={crop} onChange={(event) => setCrop(event.target.value)} className="select-field appearance-none pr-9" aria-label="Choose crop" data-testid="select-crop">{crops.map((item) => <option key={item.value} value={item.value}>{item.en} · {item.hi}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-muted-foreground" size={15} /></div>
        </label>
        <label className="text-[11px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Market
          <div className="relative mt-2"><select value={market} onChange={(event) => setMarket(event.target.value)} className="select-field appearance-none pr-9" aria-label="Choose market" data-testid="select-market">{marketOptions.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-muted-foreground" size={15} /></div>
        </label>
      </div>
      <div className="mt-6 rounded-xl bg-secondary p-4 text-secondary-foreground">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-1.5 text-[11px] font-bold text-secondary-foreground/70"><MapPin size={13} /> {price.market === market ? price.district : 'Selected market'}</div><div className="mt-3 text-xs font-bold">{selectedCrop.en} · {market}</div></div><span className="pill bg-secondary-foreground/10 text-secondary-foreground"><span className="status-dot" /> Live-ish demo</span></div>
        <div className="mt-5 flex items-end justify-between gap-4"><div><div className="font-mono text-3xl font-bold tracking-[-.06em]" data-testid="text-mandi-price">{price.price}</div><div className="mt-1 text-[11px] text-secondary-foreground/65">per quintal · {price.updated}</div></div><div className={`flex items-center gap-1 text-xs font-extrabold ${price.up ? 'text-accent' : 'text-orange-200'}`}>{price.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} {price.change}</div></div>
        <div className="chart-grid relative mt-5 h-20 overflow-hidden rounded-lg border border-secondary-foreground/10"><svg viewBox="0 0 420 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-label="Seven day mandi price trend"><path d={price.up ? 'M0 68 C35 71 53 55 82 59 S132 34 163 48 S209 45 234 29 S276 35 302 22 S356 25 420 9' : 'M0 18 C40 12 55 29 87 25 S139 46 170 37 S213 53 244 44 S302 61 340 51 S382 73 420 64'} fill="none" stroke="#e9b83f" strokeWidth="3" strokeLinecap="round" /></svg></div>
        <div className="mt-3 flex justify-between text-[10px] text-secondary-foreground/55"><span>7 days ago</span><span>{price.range}</span><span>Today</span></div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><IndianRupee size={14} className="mt-0.5 shrink-0 text-primary" /> {price.hint}</p>
    </section>
  );
}

function PriceAlert({ copy, subscribed, setSubscribed }: { copy: typeof enCopy; subscribed: boolean; setSubscribed: (value: boolean) => void }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) { setMessage('Enter a 10-digit mobile number to continue.'); return; }
    setMessage('');
    setSubscribed(true);
  };
  return (
    <section className="rounded-[1.35rem] bg-accent p-5 text-secondary md:p-7" aria-labelledby="alert-title">
      <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-accent"><Bell size={20} /></div><div><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-secondary/65">A small nudge</span><h2 id="alert-title" className="display mt-2 text-[1.65rem] font-semibold leading-[1.05]">{copy.alertTitle}</h2><p className="mt-2 text-sm leading-5 text-secondary/70">{copy.alertBody}</p></div></div>
      {subscribed ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary/10 p-3 text-sm font-bold" data-testid="status-alert-subscribed"><div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-accent"><Check size={16} /></div>{copy.alertDone}<button className="ml-auto text-xs font-bold underline underline-offset-4" onClick={() => setSubscribed(false)} data-testid="button-edit-alert">Edit</button></div>
      ) : (
        <form className="mt-6" onSubmit={submit}>
          <label htmlFor="alert-phone" className="text-[11px] font-extrabold uppercase tracking-[.12em] text-secondary/70">Mobile number</label>
          <div className="mt-2 flex gap-2"><div className="relative flex-1"><Phone size={15} className="absolute left-3 top-3.5 text-secondary/50" /><input id="alert-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="98 7654 3210" className="input-field border-secondary/20 bg-secondary/10 pl-9 text-secondary placeholder:text-secondary/45" type="tel" data-testid="input-alert-phone" /></div><button className="button-primary shrink-0 bg-secondary text-accent shadow-[0_5px_0_hsl(161_28%_25%)] hover:bg-secondary/90" type="submit" data-testid="button-subscribe-alert">{copy.alertAction}</button></div>
          {message && <p className="mt-2 text-xs font-bold text-secondary/80" role="alert" data-testid="status-alert-error">{message}</p>}
          <p className="mt-3 text-[10px] text-secondary/55">No spam. One useful message, only when the price moves.</p>
        </form>
      )}
    </section>
  );
}

function PartnershipModal({ open, onClose, copy }: { open: boolean; onClose: () => void; copy: typeof enCopy }) {
  const [submitted, setSubmitted] = useState(false);
  if (!open) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-card p-6 md:p-7" role="dialog" aria-modal="true" aria-labelledby="partnership-title">
        <div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-full bg-accent text-secondary"><Handshake size={20} /></div><button className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground" onClick={onClose} aria-label="Close partnership form" data-testid="button-close-partnership"><X size={17} /></button></div>
        {submitted ? (
          <div className="py-8 text-center" data-testid="status-partnership-success"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-accent"><Check size={25} /></div><h2 className="display mt-5 text-3xl font-semibold">We’ll be in touch.</h2><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Thank you. A member of the FarmMitra field team will reach out within two working days.</p><button className="button-secondary mt-6" onClick={onClose} data-testid="button-finish-partnership">Done</button></div>
        ) : (
          <>
            <span className="section-kicker mt-6">Field partnerships</span><h2 id="partnership-title" className="display mt-3 text-3xl font-semibold leading-[1.05]">{copy.partner}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.partnerBody}</p>
            <form className="mt-6 space-y-3" onSubmit={submit}>
              <label className="sr-only" htmlFor="partner-name">Your name</label><input id="partner-name" required className="input-field" placeholder="Your name" data-testid="input-partner-name" />
              <label className="sr-only" htmlFor="partner-org">Organisation or FPO</label><input id="partner-org" required className="input-field" placeholder="Organisation or FPO" data-testid="input-partner-organisation" />
              <label className="sr-only" htmlFor="partner-email">Work email</label><input id="partner-email" required type="email" className="input-field" placeholder="Work email" data-testid="input-partner-email" />
              <button type="submit" className="button-primary mt-2 w-full" data-testid="button-submit-partnership">Send my interest <ArrowUpRight size={16} /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [crop, setCrop] = useState('tomato');
  const [market, setMarket] = useState('Lasalgaon APMC');
  const [subscribed, setSubscribed] = useState(false);
  const [partnershipOpen, setPartnershipOpen] = useState(false);
  const copy = language === 'hi' ? hiCopy : enCopy;
  const selectedCrop = useMemo(() => crops.find((item) => item.value === crop) ?? crops[0], [crop]);

  useEffect(() => {
    if (crop === 'tomato') setMarket('Lasalgaon APMC');
    if (crop === 'wheat') setMarket('Mandi Samiti Sehore');
    if (crop === 'cotton') setMarket('Gondal Yard');
    if (crop === 'onion') setMarket('Pimpalgaon Baswant');
  }, [crop]);

  return (
    <div className="farm-app grain-overlay">
      <AppHeader language={language} setLanguage={setLanguage} onPartner={() => setPartnershipOpen(true)} />
      <main className="farm-page mx-auto max-w-[1240px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <section className="hero-wash relative overflow-hidden rounded-[1.6rem] px-5 py-8 md:px-10 md:py-10">
          <div className="leaf-line !right-8 !top-2 !h-40 !w-40 opacity-10" />
          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-secondary"><span className="status-dot" /> {language === 'hi' ? 'आज का खेत साथी' : 'Your field companion, today'}</div>
            <h1 className="display hero-title mt-5 max-w-2xl text-[3.65rem] font-semibold leading-[.96] text-secondary md:text-[4.8rem]" data-testid="text-page-greeting">{copy.greeting}<span className="text-primary">.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">{copy.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-bold text-secondary/70"><span className="flex items-center gap-2"><MapPin size={15} className="text-primary" /> {selectedCrop.en} watchlist</span><span className="h-1 w-1 rounded-full bg-border" /><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-primary" /> Advice, not alarm</span></div>
          </div>
        </section>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.16fr_.84fr]">
          <CropUpload copy={copy} preview={preview} setPreview={setPreview} analysisState={analysisState} setAnalysisState={setAnalysisState} />
          <AnalysisResult language={language} analysisState={analysisState} />
        </div>

        <Guidance copy={copy} />

        <div className="mt-12 grid gap-5 lg:grid-cols-[.93fr_1.07fr]">
          <MandiWatch crop={crop} setCrop={setCrop} market={market} setMarket={setMarket} copy={copy} />
          <PriceAlert copy={copy} subscribed={subscribed} setSubscribed={setSubscribed} />
        </div>

        <section className="mt-12 flex flex-col justify-between gap-6 rounded-[1.35rem] border border-secondary/15 bg-secondary px-6 py-7 text-secondary-foreground md:flex-row md:items-center md:px-8" aria-labelledby="partner-cta-title">
          <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-secondary"><Handshake size={20} /></div><div><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-accent/80">For people who stand with farmers</span><h2 id="partner-cta-title" className="display mt-2 text-2xl font-semibold md:text-3xl">{copy.partner}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-secondary-foreground/65">{copy.partnerBody}</p></div></div>
          <button className="button-primary shrink-0 self-start bg-accent text-secondary shadow-[0_5px_0_hsl(43_66%_43%)] hover:bg-accent/90 md:self-center" onClick={() => setPartnershipOpen(true)} data-testid="button-partnership-cta">{copy.partnerAction} <ArrowUpRight size={16} /></button>
        </section>

        <footer className="mt-9 flex flex-col gap-3 border-t border-border/70 pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>FarmMitra AI · Made for the next field visit.</span><span className="flex items-center gap-2"><ShieldCheck size={13} /> Your photos stay yours in this demo.</span>
        </footer>
      </main>
      <PartnershipModal open={partnershipOpen} onClose={() => setPartnershipOpen(false)} copy={copy} />
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;