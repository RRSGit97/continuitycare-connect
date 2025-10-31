import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting provider data seeding...');

    // 1. Create local provider user
    const providerEmail = 'provider-local@test.com';
    const providerPassword = 'password123';

    let providerUserId: string;

    // Check if provider user exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const existingProvider = existingUser?.users.find(u => u.email === providerEmail);

    if (existingProvider) {
      console.log('Provider user already exists');
      providerUserId = existingProvider.id;
    } else {
      // Create provider user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: providerEmail,
        password: providerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Dr. Local Provider',
          role: 'local_provider'
        }
      });

      if (authError) throw authError;
      providerUserId = authData.user.id;
      console.log('Created provider user:', providerUserId);

      // Wait a bit for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 2. Get provider record
    const { data: providerRecord, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('id')
      .eq('user_id', providerUserId)
      .single();

    if (providerError) throw providerError;
    const providerId = providerRecord.id;
    console.log('Provider ID:', providerId);

    // 3. Get Patient A
    const { data: patientUser } = await supabaseAdmin.auth.admin.listUsers();
    const patientA = patientUser?.users.find(u => u.email === 'patient-a@test.com');

    if (!patientA) {
      return new Response(
        JSON.stringify({ 
          error: 'Patient A not found. Please run main seed script first.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Get patient record
    const { data: patientRecord, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', patientA.id)
      .single();

    if (patientError) throw patientError;
    const patientId = patientRecord.id;
    console.log('Patient A ID:', patientId);

    // 5. Create or update consent record
    const { data: existingConsent } = await supabaseAdmin
      .from('consent_records')
      .select('id')
      .eq('patient_id', patientId)
      .eq('provider_id', providerId)
      .maybeSingle();

    if (existingConsent) {
      // Update existing consent
      const { error: updateError } = await supabaseAdmin
        .from('consent_records')
        .update({
          accepted: true,
          signed_at: new Date().toISOString(),
          expires_at: null, // No expiry
        })
        .eq('id', existingConsent.id);

      if (updateError) throw updateError;
      console.log('Updated existing consent record');
    } else {
      // Create new consent
      const { error: consentError } = await supabaseAdmin
        .from('consent_records')
        .insert({
          patient_id: patientId,
          provider_id: providerId,
          accepted: true,
          signed_at: new Date().toISOString(),
          consent_text: 'I authorize Dr. Local Provider to access my medical records and care information.',
          version: '1.0',
          expires_at: null, // No expiry
          locale: 'en'
        });

      if (consentError) throw consentError;
      console.log('Created new consent record');
    }

    // 6. Return credentials
    const result = {
      success: true,
      message: 'Local provider data seeded successfully',
      credentials: {
        email: providerEmail,
        password: providerPassword,
        userId: providerUserId,
        providerId: providerId,
      },
      testInstructions: [
        '1. Sign in as provider-local@test.com (password: password123)',
        '2. Navigate to /dashboard/provider',
        '3. You should see Patient A with consent granted',
        '4. To test consent revocation:',
        '   - Go to Admin Console → Consent Management',
        '   - Toggle off consent for Patient A and this provider',
        '   - Refresh provider portal - Patient A should disappear',
      ]
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error seeding provider data:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
