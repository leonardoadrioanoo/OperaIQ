import { redirect } from 'next/navigation';

export default function EmpresaRedirect() {
  redirect('/dashboard/administracao/empresa/dados');
}
