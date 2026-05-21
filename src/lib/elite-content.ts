// Curated VIP content for Drum Elite. All in PT-BR for end users.

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: string;
  level: "Iniciante" | "Intermediário" | "Profissional";
  highlights: string[];
  why: string;
};

export type ProductCategory = {
  id: string;
  title: string;
  subtitle: string;
  items: Product[];
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "kits-iniciante",
    title: "Melhores Kits para Iniciantes",
    subtitle: "Custo-benefício imbatível para começar com qualidade real.",
    items: [
      { id: "pearl-roadshow", name: "Roadshow 5-Peças", brand: "Pearl", price: "R$ 3.200", level: "Iniciante", highlights: ["Hardware incluso", "Pratos Planet Z", "Afinação fácil"], why: "Kit completo, pronto para tocar e com som maduro para o iniciante." },
      { id: "tama-imperialstar", name: "Imperialstar 5-Peças", brand: "Tama", price: "R$ 4.500", level: "Iniciante", highlights: ["Aros MIGHTY HOOP", "Hardware robusto", "Pratos Meinl HCS"], why: "Estrutura de kit intermediário com preço de entrada." },
      { id: "ludwig-accent", name: "Accent Drive", brand: "Ludwig", price: "R$ 2.890", level: "Iniciante", highlights: ["Casco poplar", "Banco incluso", "Compacto"], why: "Som clássico Ludwig em pacote acessível." },
    ],
  },
  {
    id: "kits-pro",
    title: "Melhores Kits Profissionais",
    subtitle: "Bateria de palco e estúdio para quem leva a sério.",
    items: [
      { id: "dw-collectors", name: "Collector's Maple", brand: "DW", price: "R$ 38.000", level: "Profissional", highlights: ["Cascos VLT", "True-Pitch tuning", "Acabamento exclusivo"], why: "Padrão ouro mundial em bateria acústica." },
      { id: "tama-starclassic", name: "Starclassic Walnut/Birch", brand: "Tama", price: "R$ 24.500", level: "Profissional", highlights: ["Combinação de madeiras", "Som focado", "Versatilidade"], why: "Definição cirúrgica em estúdio com peso de palco." },
      { id: "yamaha-recordingcustom", name: "Recording Custom Birch", brand: "Yamaha", price: "R$ 32.000", level: "Profissional", highlights: ["Som dos maiores estúdios", "Birch 100%", "Tom seco e poderoso"], why: "A bateria mais gravada da história do pop/rock." },
    ],
  },
  {
    id: "pratos",
    title: "Melhores Pratos",
    subtitle: "Liga, peso e martelagem fazem toda a diferença.",
    items: [
      { id: "zildjian-k-custom", name: "K Custom Dark Set", brand: "Zildjian", price: "R$ 7.200", level: "Profissional", highlights: ["Som escuro/complexo", "Resposta rápida", "Versátil"], why: "Padrão para gospel, jazz e fusion modernos." },
      { id: "sabian-hhx", name: "HHX Complex Set", brand: "Sabian", price: "R$ 6.900", level: "Profissional", highlights: ["Brilho controlado", "Stick definition", "Hand-hammered"], why: "Mistura warmth e clareza num só prato." },
      { id: "meinl-byzance", name: "Byzance Vintage Pure", brand: "Meinl", price: "R$ 8.400", level: "Profissional", highlights: ["Trash controlado", "Decaimento rápido", "Tom orgânico"], why: "Favorito de Chris Coleman e gospel chops." },
    ],
  },
  {
    id: "baquetas",
    title: "Melhores Baquetas",
    subtitle: "A extensão das suas mãos. Escolha por gramatura e taper.",
    items: [
      { id: "vater-5b", name: "Los Angeles 5B", brand: "Vater", price: "R$ 95", level: "Intermediário", highlights: ["Equilíbrio perfeito", "Hickory americano", "Ponta oval"], why: "A 5B mais consistente da indústria." },
      { id: "vicfirth-5a", name: "American Classic 5A", brand: "Vic Firth", price: "R$ 89", level: "Iniciante", highlights: ["Padrão mundial", "Hickory", "Ponta lágrima"], why: "Aprenda com a baqueta mais vendida do mundo." },
      { id: "promark-rebound", name: "Rebound 5B ActiveGrip", brand: "Pro-Mark", price: "R$ 115", level: "Intermediário", highlights: ["Grip térmico", "Anti-slip", "Hickory"], why: "Suor não tira mais a baqueta da sua mão." },
    ],
  },
  {
    id: "pedais",
    title: "Melhores Pedais de Bumbo",
    subtitle: "Velocidade, retorno e estabilidade.",
    items: [
      { id: "dw-9000", name: "9000 Single Pedal", brand: "DW", price: "R$ 3.800", level: "Profissional", highlights: ["Tração dupla", "Rolamentos selados", "Floating rotor"], why: "Sensação suave e altamente ajustável." },
      { id: "tama-speedcobra", name: "Speed Cobra 910", brand: "Tama", price: "R$ 2.200", level: "Intermediário", highlights: ["Long footboard", "Speed para metal/gospel", "Cobra coil"], why: "Velocidade pura por um preço justo." },
      { id: "pearl-eliminator", name: "Eliminator Demon Drive", brand: "Pearl", price: "R$ 4.300", level: "Profissional", highlights: ["Direct drive", "Customizável", "Ângulo zero-friction"], why: "Resposta imediata para dobles e blasts." },
    ],
  },
  {
    id: "bancos",
    title: "Melhores Bancos (Throne)",
    subtitle: "Sua coluna agradece. Banco bom é prevenção.",
    items: [
      { id: "rocnsoc-nitro", name: "Nitro Throne", brand: "Roc-N-Soc", price: "R$ 2.600", level: "Profissional", highlights: ["Pistão a gás", "Assento moldado", "Encosto opcional"], why: "Conforto profissional para sessões longas." },
      { id: "dw-9100m", name: "9100M Airlift", brand: "DW", price: "R$ 3.100", level: "Profissional", highlights: ["Airlift", "Tripod 4 pés", "Memory lock"], why: "Estabilidade absoluta, altura sem esforço." },
      { id: "tama-1stchair", name: "1st Chair Round Rider", brand: "Tama", price: "R$ 1.450", level: "Intermediário", highlights: ["Glide-Tite grip", "Cloth top", "3 pés robustos"], why: "Melhor custo-benefício do mercado." },
    ],
  },
  {
    id: "fones",
    title: "Melhores Fones para Bateristas",
    subtitle: "Isolamento e fidelidade para você ouvir o que importa.",
    items: [
      { id: "vic-sih2", name: "SIH2 Stereo Isolation", brand: "Vic Firth", price: "R$ 1.350", level: "Profissional", highlights: ["Isolamento 25dB", "Drivers de 50mm", "Cabo destacável"], why: "Pensado por bateristas, para bateristas." },
      { id: "shure-srh840", name: "SRH840A", brand: "Shure", price: "R$ 1.700", level: "Profissional", highlights: ["Resposta plana", "Mix referência", "Conforto longo"], why: "Padrão de estúdio para mixagem real." },
      { id: "audio-ath-m50x", name: "ATH-M50x", brand: "Audio-Technica", price: "R$ 1.100", level: "Intermediário", highlights: ["Bass preciso", "Dobrável", "Cabos intercambiáveis"], why: "O fone mais recomendado da última década." },
    ],
  },
  {
    id: "eletronicas",
    title: "Melhores Baterias Eletrônicas",
    subtitle: "Para casa, estúdio silencioso ou palco moderno.",
    items: [
      { id: "roland-td17kvx2", name: "V-Drums TD-17KVX2", brand: "Roland", price: "R$ 18.500", level: "Profissional", highlights: ["Mesh heads", "Bluetooth", "Coaching mode"], why: "Sensação de bateria real em casa." },
      { id: "alesis-strike-pro", name: "Strike Pro Special Edition", brand: "Alesis", price: "R$ 22.000", level: "Profissional", highlights: ["Cascos de madeira", "Triggers dinâmicos", "5000 samples"], why: "Visual de acústica + flexibilidade eletrônica." },
      { id: "yamaha-dtx6k3x", name: "DTX6K3-X", brand: "Yamaha", price: "R$ 14.900", level: "Intermediário", highlights: ["Pads TCS", "Voices reais", "Compacto"], why: "Qualidade Yamaha em pacote acessível." },
    ],
  },
];

export type Store = {
  id: string;
  name: string;
  city: string;
  url?: string;
  highlights: string[];
  type: "Física" | "Online" | "Híbrida";
};

export const STORES: Store[] = [
  { id: "playtech", name: "Playtech Instrumentos", city: "São Paulo • SP", url: "https://www.playtech.com.br", highlights: ["Maior portfólio de baterias", "Showroom presencial", "Pós-venda forte"], type: "Híbrida" },
  { id: "habro", name: "Habro Music", city: "Online (Brasil)", url: "https://www.habromusic.com.br", highlights: ["Importação direta", "Preço competitivo", "Especialista em pratos"], type: "Online" },
  { id: "musical-express", name: "Musical Express", city: "Curitiba • PR", url: "https://www.musicalexpress.com.br", highlights: ["Tradição em bateria", "Atendimento técnico", "Lançamentos"], type: "Híbrida" },
  { id: "drumsetup", name: "Drum Setup", city: "Rio de Janeiro • RJ", highlights: ["Boutique para bateristas", "Snares customizadas", "Restauração"], type: "Física" },
  { id: "imusic", name: "iMusic", city: "Online (Brasil)", url: "https://www.imusic.com.br", highlights: ["Variedade enorme", "Parcelamento longo", "Cupons frequentes"], type: "Online" },
  { id: "made-in-brazil", name: "Made In Brazil", city: "São Paulo • SP", highlights: ["Bumbos artesanais", "Acabamentos exclusivos", "Custom-shop"], type: "Híbrida" },
  { id: "som-imagem", name: "Som & Imagem", city: "Online (Brasil)", url: "https://www.somimagem.com.br", highlights: ["Pratos Premium", "Frete rápido", "Estoque sempre cheio"], type: "Online" },
  { id: "drumsbar", name: "Drum's Bar", city: "Porto Alegre • RS", highlights: ["Loja-conceito", "Eventos com artistas", "Workshops"], type: "Física" },
];

export type Course = {
  id: string;
  title: string;
  instructor: string;
  focus: string;
  language: "PT-BR" | "EN";
  level: "Iniciante" | "Intermediário" | "Avançado";
  url?: string;
};

export const COURSES: Course[] = [
  { id: "groove-brasileiro", title: "Groove Brasileiro Pro", instructor: "Ramon Montagner", focus: "Samba, baião, partido alto aplicados à bateria moderna", language: "PT-BR", level: "Intermediário" },
  { id: "gospel-chops-br", title: "Gospel Chops Brasil", instructor: "Pablo Cassemiro", focus: "Linguagem gospel: chops, fills modernos e linadas", language: "PT-BR", level: "Avançado" },
  { id: "rudimentos-completo", title: "Rudimentos do Zero ao Pro", instructor: "Aquiles Priester", focus: "40 rudimentos com aplicação na bateria completa", language: "PT-BR", level: "Iniciante" },
  { id: "drumeo-edge", title: "Drumeo Edge", instructor: "Vários (Drumeo)", focus: "Maior biblioteca de aulas de bateria do mundo", language: "EN", level: "Intermediário" },
  { id: "gospel-modern", title: "Modern Gospel Drumming", instructor: "Chris Coleman", focus: "Vocabulário moderno do gospel norte-americano", language: "EN", level: "Avançado" },
  { id: "independencia-jojo", title: "Independência Total", instructor: "Jojo Mayer", focus: "Sistema de independência hi-hat/bumbo/mão", language: "EN", level: "Avançado" },
  { id: "groove-basico", title: "Grooves Essenciais", instructor: "Cuca Teixeira", focus: "Levadas que todo baterista precisa dominar", language: "PT-BR", level: "Iniciante" },
];

export type GospelLesson = {
  id: string;
  title: string;
  bpmRange: [number, number];
  difficulty: 1 | 2 | 3 | 4 | 5;
  pattern: string[]; // sequence of R/L/K (right hand, left hand, kick)
  description: string;
};

export const GOSPEL_LESSONS: GospelLesson[] = [
  {
    id: "linear-6notes",
    title: "Linear de 6 Notas (Gospel Base)",
    bpmRange: [70, 130],
    difficulty: 3,
    pattern: ["R", "L", "K", "R", "L", "K"],
    description: "Frase linear clássica que abre o vocabulário do gospel chops. Pratique com swing 16 antes de empurrar BPM.",
  },
  {
    id: "tony-royster-fill",
    title: "Fill Estilo Tony Royster Jr.",
    bpmRange: [80, 120],
    difficulty: 4,
    pattern: ["R", "R", "L", "R", "L", "L", "K", "K"],
    description: "Dobles alternados terminando em bumbo duplo. Foque em distribuição igual entre as mãos.",
  },
  {
    id: "chris-coleman-groove",
    title: "Groove Chris Coleman",
    bpmRange: [60, 100],
    difficulty: 5,
    pattern: ["R", "K", "L", "R", "K", "R", "L", "K"],
    description: "Coordenação extrema com ghosts entre bumbo e mãos. Comece muito lento.",
  },
  {
    id: "hand-speed-burst",
    title: "Hand Speed Burst",
    bpmRange: [100, 180],
    difficulty: 4,
    pattern: ["R", "L", "R", "L", "R", "L", "R", "L"],
    description: "Singles a velocidades altas usando push-pull. Cronometre rajadas de 30s.",
  },
  {
    id: "modern-pocket",
    title: "Modern Pocket Gospel",
    bpmRange: [70, 95],
    difficulty: 3,
    pattern: ["R", "L", "R", "K", "L", "R", "K", "L"],
    description: "Levada moderna que mistura ghosts, hi-hat aberto e bumbo deslocado.",
  },
  {
    id: "five-stroke-trick",
    title: "Five Stroke Roll Aplicado",
    bpmRange: [90, 160],
    difficulty: 3,
    pattern: ["R", "R", "L", "L", "R", "L", "L", "R", "R", "L"],
    description: "Aplicação prática do five stroke entre caixa e tons. Distribua livremente.",
  },
];

export type EliteExercise = {
  id: string;
  title: string;
  category: "Rudimentos Avançados" | "Velocidade" | "Coordenação" | "Independência" | "Resistência" | "Timing";
  bpmStart: number;
  bpmTarget: number;
  durationMin: number;
  description: string;
};

export const ELITE_EXERCISES: EliteExercise[] = [
  { id: "double-stroke-master", title: "Doubles em escala progressiva", category: "Rudimentos Avançados", bpmStart: 60, bpmTarget: 180, durationMin: 10, description: "Suba 5 BPM a cada minuto mantendo dinâmica equilibrada." },
  { id: "paradiddle-cycle", title: "Ciclo dos Paradiddles (4 variações)", category: "Rudimentos Avançados", bpmStart: 70, bpmTarget: 150, durationMin: 12, description: "Cicle entre os 4 paradiddles sem parar o pulso." },
  { id: "speed-ladder", title: "Escada de Velocidade 5min", category: "Velocidade", bpmStart: 100, bpmTarget: 200, durationMin: 5, description: "Aumente 10 BPM a cada 30s. Cronometre falhas." },
  { id: "kick-doubles", title: "Bumbo: Dobles a 180 BPM", category: "Velocidade", bpmStart: 90, bpmTarget: 180, durationMin: 8, description: "Heel-toe ou swivel. Mantenha consistência por 2min seguidos." },
  { id: "limb-independence-3", title: "Independência 3 Membros", category: "Independência", bpmStart: 65, bpmTarget: 110, durationMin: 15, description: "Hi-hat ostinato + caixa em 2/4 + bumbo em padrões de 5." },
  { id: "limb-4way", title: "Independência 4 Vias", category: "Independência", bpmStart: 60, bpmTarget: 95, durationMin: 15, description: "Cada membro toca uma subdivisão diferente. Comece muito lento." },
  { id: "polyrhythm-3v4", title: "Polirritmia 3:4", category: "Coordenação", bpmStart: 60, bpmTarget: 110, durationMin: 10, description: "Mãos em 3, pés em 4. Sinta o ponto comum." },
  { id: "endurance-30min", title: "Resistência: Groove 30min", category: "Resistência", bpmStart: 95, bpmTarget: 95, durationMin: 30, description: "Mesmo groove, BPM fixo, sem perder dinâmica. Foco em economia." },
  { id: "timing-displaced", title: "Timing Deslocado em 8", category: "Timing", bpmStart: 80, bpmTarget: 120, durationMin: 10, description: "Caixa deslocada 1 colcheia. Treine sentir o um." },
  { id: "timing-metronome-drop", title: "Metrônomo Some 2 Compassos", category: "Timing", bpmStart: 70, bpmTarget: 140, durationMin: 12, description: "Mantenha o pulso quando o clique sumir. Volte e cheque." },
];
