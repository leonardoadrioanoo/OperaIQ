"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ScanFace, CheckCircle2, AlertCircle, Save, Building2, Globe2,
  ChevronDown, ChevronUp, Check, Key, Link as LinkIcon, Loader2, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const SUPABASE_PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '<seu-projeto>';
const ACS_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/sso/saml/acs`;
const SP_ENTITY_ID = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/sso/saml/metadata`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 hover:text-white text-zinc-400 transition-colors flex-shrink-0"
      title="Copiar URL"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function SSOPage() {
  const { company, fetchUserData, user } = useAuthStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [samlStatus, setSamlStatus] = useState<'inactive' | 'active'>('inactive');

  const [formData, setFormData] = useState({
    samlEntityId: '',
    samlMetadataUrl: '',
    samlDomains: '',
    samlAtivo: false
  });

  useEffect(() => {
    if (company) {
      setFormData({
        samlEntityId: company.saml_entity_id || '',
        samlMetadataUrl: company.saml_metadata_url || '',
        samlDomains: company.saml_domains || '',
        samlAtivo: company.saml_ativo || false
      });
      setSamlStatus(company.saml_ativo ? 'active' : 'inactive');
    }
  }, [company]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => prev === id ? null : id);
  };

  const handleSaveSAML = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.samlEntityId || !formData.samlMetadataUrl) {
      return toast.error("Preencha os campos obrigatórios.");
    }
    
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('http://localhost:3002/api/empresa/sso', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          samlEntityId: formData.samlEntityId,
          samlMetadataUrl: formData.samlMetadataUrl,
          samlDomains: formData.samlDomains,
          samlAtivo: true // Se salvou preenchido, já ativa
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setSamlStatus('active');
        toast.success(data.message || "Configurações de SSO corporativo salvas com sucesso!");
        if (user) {
          fetchUserData(user.id);
        }
      } else {
        toast.error(data.error || "Erro ao salvar configurações SSO.");
      }
    } catch (err) {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
          <span>Administração</span>
          <span>/</span>
          <Link href="/dashboard/administracao/seguranca" className="hover:text-blue-400 transition-colors">Segurança</Link>
          <span>/</span>
          <span className="text-zinc-300">Single Sign-On (SSO)</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ScanFace className="w-8 h-8 text-blue-400" />
          Single Sign-On (SSO)
        </h1>
        <p className="text-zinc-400 mt-2 text-sm max-w-2xl">
          Configure a conexão do OperaIQ com o Provedor de Identidade (IdP) da sua empresa (Okta, Microsoft Entra ID, etc) para acesso via login corporativo unificado.
        </p>
      </div>

      <div className="space-y-4">
        
        {/* Bloco SAML 2.0 (O padrão Enterprise) */}
        <div className={`bg-[#13131f] border rounded-2xl overflow-hidden transition-all duration-300 ${expanded === 'saml' ? 'border-blue-500/30' : 'border-white/5'}`}>
          <button
            onClick={() => toggleExpanded('saml')}
            className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${samlStatus === 'active' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/10'}`}>
              <Building2 className={`w-6 h-6 ${samlStatus === 'active' ? 'text-blue-400' : 'text-zinc-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-white">SAML 2.0 (Okta, Microsoft Entra, Google Workspace)</h3>
                {samlStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-bold uppercase tracking-wider border border-zinc-500/20">
                    <AlertCircle className="w-3 h-3" /> Não configurado
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">Conecte seu diretório corporativo via protocolo padrão SAML 2.0.</p>
            </div>
            <div className="flex-shrink-0">
              {expanded === 'saml' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </div>
          </button>

          {/* Configuração do Cliente */}
          {expanded === 'saml' && (
            <div className="border-t border-white/5 p-6 animate-in slide-in-from-top-2 duration-200">
              
              {/* Passo 1: O que nós damos pro cliente */}
              <div className="mb-8 space-y-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">1</span>
                  Configure estas URLs no seu Provedor (IdP)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">ACS URL (Assertion Consumer Service)</label>
                    <div className="flex items-center gap-2">
                      <input readOnly value={ACS_URL} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none" />
                      <CopyButton text={ACS_URL} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Entity ID do OperaIQ</label>
                    <div className="flex items-center gap-2">
                      <input readOnly value={SP_ENTITY_ID} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-blue-400 font-mono focus:outline-none" />
                      <CopyButton text={SP_ENTITY_ID} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 2: O que o cliente nos dá */}
              <form onSubmit={handleSaveSAML} className="space-y-6">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-t border-white/5 pt-6">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">2</span>
                  Insira os dados gerados pelo seu Provedor
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-400" /> Entity ID do Provedor de Identidade (IdP)
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.samlEntityId}
                      onChange={e => setFormData({ ...formData, samlEntityId: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="ex: https://sts.windows.net/1234abcd-1234..."
                    />
                    <p className="text-[10px] text-zinc-500">URL identificadora fornecida pelo seu provedor (Okta, Azure).</p>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-400" /> Metadata URL (XML)
                    </label>
                    <input
                      required
                      type="url"
                      value={formData.samlMetadataUrl}
                      onChange={e => setFormData({ ...formData, samlMetadataUrl: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="https://login.microsoftonline.com/.../federationmetadata.xml"
                    />
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-blue-400" /> Domínios Mapeados
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.samlDomains}
                      onChange={e => setFormData({ ...formData, samlDomains: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="ex: suaempresa.com.br, filial.com.br"
                    />
                    <p className="text-[10px] text-zinc-500">Usuários com estes domínios serão redirecionados ao seu IdP.</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Configurações
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>



      </div>
    </div>
  );
}
