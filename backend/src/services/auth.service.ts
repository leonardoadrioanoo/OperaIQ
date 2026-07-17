import { supabaseAdmin } from '../config/supabase';
import { UserRepository } from '../repositories/user.repository';
import { RegisterPayloadDTO } from '../models/user.model';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerUser(data: RegisterPayloadDTO) {
    // 1. Create User in Supabase Auth (auth.users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // Força a verificação de e-mail
      user_metadata: {
        full_name: data.nome_admin,
        role: data.cargo_admin
      }
    });

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    const userId = authData.user.id;

    // 2. Create relational records in public schema
    try {
      await this.userRepository.createCompanyAndProfile(userId, data);
      
      // 3. Dispara o e-mail de verificação oficial do Supabase
      const { error: resendError } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email: data.email,
      });

      if (resendError) {
        console.warn(`Aviso: Falha ao enviar e-mail de verificação para ${data.email}. Erro:`, resendError.message);
      }

      return { success: true, user: authData.user };
    } catch (dbError: any) {
      // If DB insert fails, cleanup the auth user to avoid orphan accounts
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Database Error: ${dbError.message}`);
    }
  }
}
