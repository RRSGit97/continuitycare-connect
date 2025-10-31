import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string
  password: string
  role: 'patient' | 'specialist' | 'local_provider' | 'admin'
  fullName: string
}

const testUsers: TestUser[] = [
  { email: 'patient-a@test.com', password: 'password123', role: 'patient', fullName: 'Patient A' },
  { email: 'patient-b@test.com', password: 'password123', role: 'patient', fullName: 'Patient B' },
  { email: 'specialist@test.com', password: 'password123', role: 'specialist', fullName: 'Dr. Specialist' },
  { email: 'local-provider@test.com', password: 'password123', role: 'local_provider', fullName: 'Local Provider' },
  { email: 'admin@test.com', password: 'password123', role: 'admin', fullName: 'Admin User' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = {
      users: [] as any[],
      episode: null as any,
      carePlan: null as any,
      errors: [] as string[]
    }

    // Create test users
    for (const testUser of testUsers) {
      try {
        // Check if user exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
        const userExists = existingUser?.users.find(u => u.email === testUser.email)

        let userId: string

        if (userExists) {
          userId = userExists.id
          
          // Ensure password is consistent and email is confirmed
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirm: true,
            password: testUser.password,
          })

          if (!userExists.email_confirmed_at) {
            results.users.push({ email: testUser.email, id: userId, status: 'confirmed_and_password_reset' })
          } else {
            results.users.push({ email: testUser.email, id: userId, status: 'password_reset' })
          }
        } else {
          // Create user
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
            user_metadata: {
              full_name: testUser.fullName,
              role: testUser.role
            }
          })

          if (authError) throw authError
          userId = authUser.user.id

          results.users.push({ email: testUser.email, id: userId, role: testUser.role, status: 'created' })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        results.errors.push(`Failed to create ${testUser.email}: ${message}`)
      }
    }

    // Get created user IDs
    const patientAUser = results.users.find(u => u.email === 'patient-a@test.com')
    const specialistUser = results.users.find(u => u.email === 'specialist@test.com')

    if (patientAUser && specialistUser) {
      // Get patient and provider IDs
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('user_id', patientAUser.id)
        .single()

      const { data: provider } = await supabaseAdmin
        .from('providers')
        .select('id')
        .eq('user_id', specialistUser.id)
        .single()

      if (patient && provider) {
        // Check if episode already exists
        const { data: existingEpisode } = await supabaseAdmin
          .from('episodes_of_care')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('specialist_id', provider.id)
          .eq('status', 'active')
          .maybeSingle()

        let episodeId = existingEpisode?.id

        if (!episodeId) {
          // Create episode
          const { data: episode, error: episodeError } = await supabaseAdmin
            .from('episodes_of_care')
            .insert({
              patient_id: patient.id,
              specialist_id: provider.id,
              surgery_type: 'Knee Replacement',
              surgery_date: '2025-01-15',
              surgery_location: 'Memorial Hospital',
              expected_recovery_weeks: 12,
              status: 'active'
            })
            .select()
            .single()

          if (episodeError) {
            results.errors.push(`Failed to create episode: ${episodeError.message}`)
          } else {
            results.episode = episode
            episodeId = episode.id
          }
        } else {
          results.episode = { id: episodeId, status: 'already exists' }
        }

        // Create care plan if episode exists
        if (episodeId) {
          const { data: existingPlan } = await supabaseAdmin
            .from('care_plans')
            .select('id')
            .eq('episode_id', episodeId)
            .maybeSingle()

          if (existingPlan) {
            results.carePlan = { id: existingPlan.id, status: 'already exists' }
          } else {
            const { data: carePlan, error: carePlanError } = await supabaseAdmin
              .from('care_plans')
              .insert({
                episode_id: episodeId,
                created_by: specialistUser.id,  // Use user_id, not provider id
                title: 'Post-Knee Replacement Recovery Plan',
                description: 'Comprehensive care plan for knee replacement recovery',
                instructions: 'Follow all exercises daily and take medications as prescribed',
                medications: [
                  { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 6 hours as needed' },
                  { name: 'Blood Thinner', dosage: '10mg', frequency: 'Once daily' }
                ],
                exercises: [
                  { name: 'Ankle pumps', sets: 3, reps: 15, frequency: 'Every 2 hours while awake' },
                  { name: 'Quad sets', sets: 3, reps: 10, frequency: 'Daily' },
                  { name: 'Straight leg raises', sets: 2, reps: 10, frequency: 'Twice daily' }
                ]
              })
              .select()
              .single()

            if (carePlanError) {
              results.errors.push(`Failed to create care plan: ${carePlanError.message}`)
            } else {
              results.carePlan = carePlan

              // Create initial adherence log with test vitals
              const today = new Date().toISOString().split('T')[0]
              const { error: logError } = await supabaseAdmin
                .from('adherence_logs')
                .insert({
                  patient_id: patient.id,
                  care_plan_id: carePlan.id,
                  log_date: today,
                  bp_systolic: 120,
                  bp_diastolic: 80,
                  heart_rate: 72,
                  spo2: 98,
                  notes: 'Initial vitals entry from seed script'
                })

              if (logError && !logError.message.includes('duplicate')) {
                results.errors.push(`Failed to create adherence log: ${logError.message}`)
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test data seeded successfully',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({
        success: false,
        error: message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
