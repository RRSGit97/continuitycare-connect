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

    console.log('Starting audit data seeding...');

    // Get admin user to perform actions as
    const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = adminUsers?.users?.find(u => u.email?.includes('admin'));
    
    if (!adminUser) {
      throw new Error('No admin user found');
    }

    // Create a client authenticated as the admin user
    const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email!,
    });

    // Get the admin's patient/provider records
    const { data: patients } = await supabaseAdmin
      .from('patients')
      .select('id, user_id')
      .limit(2);

    const { data: providers } = await supabaseAdmin
      .from('providers')
      .select('id, user_id')
      .limit(2);

    const actions: string[] = [];

    // Perform various operations to generate audit logs
    
    // 1. Create a booking
    if (patients && patients.length > 0 && providers && providers.length > 0) {
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          patient_id: patients[0].id,
          provider_id: providers[0].id,
          booking_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 30,
          reason: 'Test audit booking',
          status: 'pending'
        });

      if (!bookingError) {
        actions.push('Created test booking');
        console.log('Created test booking');
      }

      // 2. Update a patient record
      const { error: updateError } = await supabaseAdmin
        .from('patients')
        .update({ 
          emergency_contact_name: 'Test Contact Updated',
          emergency_contact_phone: '555-0123'
        })
        .eq('id', patients[0].id);

      if (!updateError) {
        actions.push('Updated patient emergency contact');
        console.log('Updated patient record');
      }

      // 3. Create a consent record
      const { error: consentError } = await supabaseAdmin
        .from('consent_records')
        .insert({
          patient_id: patients[0].id,
          provider_id: providers[0].id,
          consent_text: 'Test consent for audit logging',
          version: '1.0',
          accepted: true,
          signed_at: new Date().toISOString(),
          ip_address: '127.0.0.1'
        });

      if (!consentError) {
        actions.push('Created consent record');
        console.log('Created consent record');
      }

      // 4. Update provider bio
      const { error: providerError } = await supabaseAdmin
        .from('providers')
        .update({ 
          bio: 'Updated bio for audit testing',
          consultation_fee: 150
        })
        .eq('id', providers[0].id);

      if (!providerError) {
        actions.push('Updated provider information');
        console.log('Updated provider record');
      }

      // 5. Create an episode of care
      if (patients[1] && providers[1]) {
        const { data: episode, error: episodeError } = await supabaseAdmin
          .from('episodes_of_care')
          .insert({
            patient_id: patients[1].id,
            specialist_id: providers[1].id,
            surgery_type: 'Audit Test Surgery',
            surgery_date: new Date().toISOString().split('T')[0],
            surgery_location: 'Test Hospital',
            expected_recovery_weeks: 6,
            status: 'active'
          })
          .select()
          .single();

        if (!episodeError && episode) {
          actions.push('Created episode of care');
          console.log('Created episode of care');

          // 6. Create a care plan for the episode
          const { error: carePlanError } = await supabaseAdmin
            .from('care_plans')
            .insert({
              episode_id: episode.id,
              title: 'Test Care Plan for Audit',
              description: 'This is a test care plan',
              status: 'draft',
              created_by: providers[1].user_id
            });

          if (!carePlanError) {
            actions.push('Created care plan');
            console.log('Created care plan');
          }
        }
      }

      // 7. Create a message
      const { error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          sender_id: providers[0].user_id,
          recipient_id: patients[0].user_id,
          patient_id: patients[0].id,
          subject: 'Test Audit Message',
          body: 'This is a test message for audit logging',
          is_read: false
        });

      if (!messageError) {
        actions.push('Created message');
        console.log('Created message');
      }

      // 8. Update a booking status
      const { data: recentBooking } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .limit(1)
        .single();

      if (recentBooking) {
        const { error: updateBookingError } = await supabaseAdmin
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', recentBooking.id);

        if (!updateBookingError) {
          actions.push('Updated booking status');
          console.log('Updated booking status');
        }
      }
    }

    console.log(`Completed ${actions.length} audit actions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully performed ${actions.length} actions to generate audit logs`,
        actions: actions,
        instructions: [
          '✅ Audit log entries have been created',
          '📋 Go to Admin Dashboard → Audit Log Explorer',
          '🔍 Filter by different entities, actors, and dates',
          '📥 Export the audit logs to CSV',
          '📊 Go to Monthly Compliance Report',
          '📅 Select current month and generate report',
          '💾 Export the compliance report to CSV'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error seeding audit data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
