import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Layout, Zap, BarChart3, Settings, Users, Link2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 flex items-center">
        <div className="container mx-auto px-6 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-700 tracking-tight">
            <div className="w-7 h-7 bg-blue-700 rounded-md flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13 3L21 9V15L13 21L5 15V9L13 3Z"/></svg>
            </div>
            OperaIQ
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button className="font-semibold bg-blue-700 hover:bg-blue-800 text-white">Criar Conta</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-40 pb-28 bg-gradient-to-br from-slate-900 to-blue-900 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="container relative z-10 mx-auto px-6 max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Transforme operações em <span className="text-blue-300">resultados.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              A plataforma empresarial que conecta pessoas, processos, dados e Inteligência Artificial em um único ecossistema.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  Comece gratuitamente <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-slate-400 text-white hover:bg-white/10 bg-transparent w-full sm:w-auto">
                  Evolua sem limites
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Uma plataforma. Possibilidades ilimitadas.</h2>
              <p className="text-slate-600 text-lg">Tudo o que sua empresa precisa para operar com excelência.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Layout, title: "Gestão Inteligente", desc: "Padronize operações e automatize fluxos entre departamentos." },
                { icon: Zap, title: "IA Integrada", desc: "Transforme dados em decisões e gere insights automáticos." },
                { icon: BarChart3, title: "Dashboards Executivos", desc: "Visualize indicadores em tempo real com alta personalização." },
                { icon: Settings, title: "Automação", desc: "Crie regras inteligentes. Menos trabalho manual, mais eficiência." },
                { icon: Users, title: "Gestão de Equipes", desc: "Monitore produtividade e mantenha a comunicação centralizada." },
                { icon: Link2, title: "Integrações", desc: "Conecte sistemas via APIs modernas e flexíveis." }
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center mb-6">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 h-96 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-12 h-12" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-6">Segurança em primeiro lugar.</h2>
                <p className="text-lg text-slate-600 mb-8">
                  Porque confiança é construída todos os dias. Seus dados protegidos por uma arquitetura desenvolvida seguindo as melhores práticas internacionais.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Criptografia de ponta", "Backups automáticos", 
                    "Controle de acesso (RBAC)", "Monitoramento contínuo", 
                    "Logs de auditoria", "Conformidade internacional", 
                    "MFA e Passkeys", "Infraestrutura escalável"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white">
                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M13 3L21 9V15L13 21L5 15V9L13 3Z"/></svg>
              </div>
              OperaIQ
            </div>
            <p className="text-sm">© 2026 OperaIQ. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
