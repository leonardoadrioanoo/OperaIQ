import { supabaseAdmin } from './src/config/supabase';

async function resetMFA(email: string) {
  try {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const user = usersData.users.find(u => u.email === email);
    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    const { data: factorsData, error: factorsError } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: user.id
    });
    
    if (factorsError) throw factorsError;

    if (!factorsData.factors || factorsData.factors.length === 0) {
      console.log(`User ${email} has no MFA factors configured.`);
      return;
    }

    for (const factor of factorsData.factors) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId: user.id
      });
      if (deleteError) {
        console.error(`Failed to delete factor ${factor.id}:`, deleteError);
      } else {
        console.log(`Successfully deleted MFA factor ${factor.id} for user ${email}.`);
      }
    }
    
    console.log(`MFA reset complete for ${email}. They can now login and set up MFA again.`);
  } catch (error) {
    console.error('Error resetting MFA:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Please provide an email. Usage: npx tsx reset-mfa.ts user@example.com');
  process.exit(1);
}

resetMFA(email);
