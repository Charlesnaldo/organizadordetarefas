export type LauncherItem = {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  accent: string;
  icon: "target" | "calendar" | "kanban" | "study" | "finance" | "wishlist" | "lightbulb" | "bookmark" | "link" | "review" | "video";
};

export const launcherItems: LauncherItem[] = [
  {
    href: "/cinema",
    title: "Cinema",
    eyebrow: "YouTube",
    description: "Sua coleção de vídeos favoritos. Assista diretamente do sistema com player embutido.",
    accent: "from-rose-400 via-red-300 to-white",
    icon: "video",
  },
  {
    href: "/planejamento-semanal",
    title: "Planejamento semanal",
    eyebrow: "Agenda",
    description: "Distribua prioridades por dia e mantenha o radar nas duas próximas semanas.",
    accent: "from-emerald-200 via-teal-100 to-white",
    icon: "calendar",
  },
  {
    href: "/rotina",
    title: "Rotina",
    eyebrow: "Fluxo",
    description: "Kanban e checklists para a rotina diária e suas entregas principais.",
    accent: "from-sky-200 via-cyan-100 to-white",
    icon: "kanban",
  },
  {
    href: "/estudos",
    title: "Estudos",
    eyebrow: "Foco",
    description: "Prateleiras para matérias, tópicos, revisões e próximos passos.",
    accent: "from-fuchsia-200 via-rose-100 to-white",
    icon: "study",
  },
  {
    href: "/financeiro",
    title: "Financeiro",
    eyebrow: "Controle",
    description: "Entradas, saídas, investimentos e metas financeiras em um painel detalhado.",
    accent: "from-lime-200 via-emerald-100 to-white",
    icon: "finance",
  },
  {
    href: "/desejos",
    title: "Desejos",
    eyebrow: "Wishlist",
    description: "Wishlist com fotos, meta, quanto já tem e quanto falta.",
    accent: "from-amber-200 via-orange-100 to-white",
    icon: "wishlist",
  },
  {
    href: "/ideias",
    title: "Ideias",
    eyebrow: "Criação",
    description: "Capture insights e experimente combinações até a próxima execução.",
    accent: "from-rose-200 via-pink-100 to-white",
    icon: "lightbulb",
  },
  {
    href: "/sites-uteis",
    title: "Sites Úteis",
    eyebrow: "Favoritos",
    description: "Coleção dos links que você usa e quer manter por perto.",
    accent: "from-emerald-200 via-teal-100 to-white",
    icon: "bookmark",
  },
  {
    href: "/revisoes",
    title: "Revisões",
    eyebrow: "Rotinas",
    description: "Lista de revisões recorrentes para reforçar aprendizados e hábitos.",
    accent: "from-slate-200 via-slate-100 to-white",
    icon: "review",
  },
];
