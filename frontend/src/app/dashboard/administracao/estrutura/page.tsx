import { redirect } from 'next/navigation';

export default function EstruturaRootPage() {
  // Redireciona automaticamente para a aba de Departamentos
  redirect('/dashboard/administracao/estrutura/departamentos');
}
