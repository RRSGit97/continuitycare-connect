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

    console.log('Starting analytics data seeding...');

    // Get existing patients and providers
    const { data: patients } = await supabaseAdmin
      .from('patients')
      .select('id')
      .limit(3);

    const { data: providers } = await supabaseAdmin
      .from('providers')
      .select('id, user_id')
      .limit(2);

    if (!patients || patients.length === 0 || !providers || providers.length === 0) {
      throw new Error('No patients or providers found. Run seed-test-data first.');
    }

    const actions: string[] = [];

    // Generate adherence logs for last 30 days with varied completion rates
    const adherenceLogs = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - i);
      const dateStr = logDate.toISOString().split('T')[0];

      // Each patient gets 1-2 logs per day
      for (const patient of patients) {
        const logsPerDay = Math.random() > 0.3 ? 2 : 1; // 70% chance of 2 logs
        
        for (let j = 0; j < logsPerDay; j++) {
          adherenceLogs.push({
            patient_id: patient.id,
            log_date: dateStr,
            medication_taken: Math.random() > 0.2, // 80% adherence
            exercises_completed: Math.random() > 0.25, // 75% adherence
            pain_level: Math.floor(Math.random() * 5) + 1,
            heart_rate: Math.floor(Math.random() * 30) + 60,
            bp_systolic: Math.floor(Math.random() * 20) + 110,
            bp_diastolic: Math.floor(Math.random() * 15) + 70,
            notes: 'Generated for analytics testing'
          });
        }
      }
    }

    // Insert adherence logs in batches
    const batchSize = 100;
    for (let i = 0; i < adherenceLogs.length; i += batchSize) {
      const batch = adherenceLogs.slice(i, i + batchSize);
      const { error } = await supabaseAdmin
        .from('adherence_logs')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting adherence batch:', error);
      }
    }
    actions.push(`Created ${adherenceLogs.length} adherence logs`);
    console.log(`Created ${adherenceLogs.length} adherence logs`);

    // Create episodes of care with varied dates
    const episodes = [];
    for (let i = 0; i < patients.length; i++) {
      const episodeDate = new Date(today);
      episodeDate.setDate(today.getDate() - (10 + i * 5));
      
      const { data: episode, error: episodeError } = await supabaseAdmin
        .from('episodes_of_care')
        .insert({
          patient_id: patients[i].id,
          specialist_id: providers[i % providers.length].id,
          surgery_type: `Analytics Test Surgery ${i + 1}`,
          surgery_date: episodeDate.toISOString().split('T')[0],
          surgery_location: 'Test Hospital',
          expected_recovery_weeks: 6,
          status: 'active'
        })
        .select()
        .single();

      if (!episodeError && episode) {
        episodes.push(episode);
        
        // Create a care plan for each episode
        const { error: carePlanError } = await supabaseAdmin
          .from('care_plans')
          .insert({
            episode_id: episode.id,
            title: `Care Plan for Analytics ${i + 1}`,
            description: 'Test care plan for analytics',
            status: 'active',
            created_by: providers[i % providers.length].user_id
          });

        if (carePlanError) {
          console.error('Error creating care plan:', carePlanError);
        }
      }
    }
    actions.push(`Created ${episodes.length} episodes with care plans`);
    console.log(`Created ${episodes.length} episodes`);

    // Create tele-visits with varied statuses and CSAT ratings
    const teleVisits = [];
    for (let i = 0; i < 20; i++) {
      const visitDate = new Date(today);
      visitDate.setDate(today.getDate() - Math.floor(i / 3)); // Spread across last ~7 days
      
      const episodeIndex = i % episodes.length;
      const isCompleted = Math.random() > 0.15; // 85% completion rate
      const status = isCompleted ? 'completed' : ['scheduled', 'in_progress'][Math.floor(Math.random() * 2)];
      
      teleVisits.push({
        episode_id: episodes[episodeIndex].id,
        scheduled_at: visitDate.toISOString(),
        duration_minutes: 30,
        status: status,
        meeting_url: `https://meet.example.com/test-${i}`,
        notes: isCompleted ? 'Visit completed successfully' : 'Scheduled visit',
        // Add CSAT rating for completed visits (80% of them)
        csat_rating: isCompleted && Math.random() > 0.2 
          ? Math.floor(Math.random() * 2) + 4 // Ratings between 4-5
          : null
      });
    }

    const { error: visitError } = await supabaseAdmin
      .from('tele_visits')
      .insert(teleVisits);

    if (!visitError) {
      actions.push(`Created ${teleVisits.length} tele-visits with CSAT ratings`);
      console.log(`Created ${teleVisits.length} tele-visits`);
    } else {
      console.error('Error creating tele-visits:', visitError);
    }

    console.log(`Completed ${actions.length} analytics seeding actions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated analytics demo data`,
        actions: actions,
        stats: {
          adherence_logs: adherenceLogs.length,
          episodes: episodes.length,
          tele_visits: teleVisits.length,
          csat_ratings: teleVisits.filter(v => v.csat_rating).length
        },
        instructions: [
          '✅ Analytics demo data has been created',
          '📊 Go to Admin Dashboard → Analytics',
          '📈 View KPI cards: Adherence %, Avg Time to Follow-up, Completion Rate, CSAT',
          '📉 Check the 7-day trend chart showing metrics over time',
          '🔄 Refresh the page to see updated calculations',
          '⭐ CSAT ratings are automatically included in completed visits'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error seeding analytics data:', error);
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
