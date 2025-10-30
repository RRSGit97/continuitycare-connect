# Vitals Entry Smoke Test

## Test Objective
Verify that:
1. Patients can enter and view their own vitals in adherence_logs
2. Other users cannot view vitals unless explicitly permitted by RLS policies
3. All operations are properly audited

## Test Data Setup

### Test Users
- **Patient A**: `patient-a@test.com` / `password123`
- **Patient B**: `patient-b@test.com` / `password123`
- **Specialist**: `specialist@test.com` / `password123`
- **Local Provider**: `local-provider@test.com` / `password123`

### Pre-seeded Data
- Patient A has an active episode with care plan ID: `fa33a2b0-a706-48e9-a7ec-5fc3b6e84695`
- Test vitals record created for Patient A on ${new Date().toISOString().split('T')[0]}

## Test Scenarios

### Scenario 1: Patient Can View Their Own Vitals

**Steps:**
1. Sign in as `patient-a@test.com` / `password123`
2. Navigate to Patient Dashboard
3. Observe the three cards: Today's Tasks, Record Vitals, Report Symptom
4. In the "Record Vitals" card, enter:
   - BP Systolic: 125
   - BP Diastolic: 85
   - Heart Rate: 75
   - SpO2: 97
5. Click "Save Vitals"

**Expected Results:**
- ✅ Success toast appears: "Vitals recorded successfully"
- ✅ "Last recorded" timestamp appears at bottom of vitals card
- ✅ Data appears in database:
  ```sql
  SELECT * FROM adherence_logs WHERE patient_id = '8f950be8-8b35-4f06-af0d-169b4bb8caad';
  ```
- ✅ Audit log created in `audit_logs` table

**Console Test (run in browser console on Patient Dashboard):**
```javascript
const { data, error } = await supabase
  .from('adherence_logs')
  .select('*')
  .eq('patient_id', '8f950be8-8b35-4f06-af0d-169b4bb8caad');

console.log('Patient A can see their own logs:', data?.length > 0);
console.log('Data:', data);
```

---

### Scenario 2: Patient B Cannot View Patient A's Vitals (Data Isolation)

**Steps:**
1. Sign out from Patient A account
2. Sign in as `patient-b@test.com` / `password123`
3. Navigate to Patient Dashboard
4. Open browser console and run test query

**Expected Results:**
- ✅ Patient B sees message: "No active care plan found"
- ✅ Console test returns empty array for Patient A's data
- ✅ RLS policy blocks unauthorized access

**Console Test (run in browser console as Patient B):**
```javascript
// Attempt to access Patient A's vitals
const { data, error } = await supabase
  .from('adherence_logs')
  .select('*')
  .eq('patient_id', '8f950be8-8b35-4f06-af0d-169b4bb8caad');

console.log('Patient B can see Patient A logs:', data?.length > 0); // Should be FALSE
console.log('Data:', data); // Should be []
console.log('Error:', error); // Should be null (query succeeds but returns no rows)
```

---

### Scenario 3: Specialist Can View Their Patient's Vitals

**Steps:**
1. Sign out and sign in as `specialist@test.com` / `password123`
2. Open browser console

**Expected Results:**
- ✅ Specialist can see vitals for episodes they manage
- ✅ RLS policy allows access via episode assignment

**Console Test (run as Specialist):**
```javascript
// Get specialist's provider ID first
const { data: userData } = await supabase.auth.getUser();
const { data: provider } = await supabase
  .from('providers')
  .select('id')
  .eq('user_id', userData.user.id)
  .single();

// Get vitals for patients in specialist's episodes
const { data: vitals } = await supabase
  .from('adherence_logs')
  .select(`
    *,
    care_plans!inner (
      episode_id,
      episodes_of_care!inner (
        specialist_id
      )
    )
  `)
  .eq('care_plans.episodes_of_care.specialist_id', provider.id);

console.log('Specialist can see patient vitals:', vitals);
```

---

### Scenario 4: Local Provider Requires Consent

**Steps:**
1. Sign in as `local-provider@test.com` / `password123`
2. Attempt to view Patient A's vitals

**Expected Results:**
- ✅ Without active consent: No access to vitals
- ✅ With active consent: Can view (read-only)

**Console Test (run as Local Provider - should fail without consent):**
```javascript
const { data: userData } = await supabase.auth.getUser();
const { data: provider } = await supabase
  .from('providers')
  .select('id')
  .eq('user_id', userData.user.id)
  .single();

// Check for consent
const { data: consent } = await supabase
  .from('consent_records')
  .select('*')
  .eq('provider_id', provider.id)
  .eq('patient_id', '8f950be8-8b35-4f06-af0d-169b4bb8caad')
  .eq('accepted', true);

console.log('Has consent:', consent?.length > 0);

// Try to view vitals (will be empty without consent)
const { data: vitals } = await supabase
  .from('adherence_logs')
  .select('*')
  .eq('patient_id', '8f950be8-8b35-4f06-af0d-169b4bb8caad');

console.log('Can see vitals:', vitals?.length > 0); // Should be false
```

---

## RLS Policies in Effect

### `adherence_logs` Table Policies:

1. **Block anonymous access**
   - Ensures all requests are authenticated
   
2. **Patients can manage their adherence logs**
   - `USING: patient_id = get_patient_id_for_user(auth.uid())`
   - Patients have full CRUD on their own logs

3. **Specialists can view adherence for their episodes**
   - `USING: EXISTS (SELECT 1 FROM care_plans cp JOIN episodes_of_care e ON e.id = cp.episode_id WHERE cp.id = adherence_logs.care_plan_id AND e.specialist_id = get_provider_id_for_user(auth.uid()))`
   - Read-only access to assigned patients

4. **Local providers can view adherence with consent**
   - `USING: has_role(auth.uid(), 'local_provider') AND has_active_consent(get_provider_id_for_user(auth.uid()), patient_id)`
   - Consent-gated read access

5. **Admins can manage all adherence logs**
   - Full access for admin role

---

## Audit Log Verification

After each vitals entry, verify audit logs:

```sql
SELECT 
  actor_id,
  action,
  entity,
  entity_id,
  new_data->'bp_systolic' as systolic,
  new_data->'heart_rate' as heart_rate,
  timestamp
FROM audit_logs
WHERE entity = 'adherence_logs'
ORDER BY timestamp DESC
LIMIT 5;
```

**Expected Results:**
- ✅ INSERT action logged when creating new vitals
- ✅ UPDATE action logged when updating existing log
- ✅ Actor ID matches authenticated user
- ✅ New data contains vitals values

---

## Quick Verification Checklist

- [ ] Patient A can enter vitals via dashboard
- [ ] Vitals appear in adherence_logs table
- [ ] Patient B cannot see Patient A's vitals
- [ ] Specialist can view their assigned patient's vitals
- [ ] Local provider blocked without consent
- [ ] Audit logs capture all operations
- [ ] Toast messages confirm actions
- [ ] Input validation prevents invalid values (e.g., BP > 250)

---

## Current Test Data

**Existing Vitals Record:**
- Patient: patient-a@test.com
- Log Date: ${new Date().toISOString().split('T')[0]}
- BP: 120/80
- Heart Rate: 72 bpm
- SpO2: 98%
- Notes: Test vitals entry for smoke test

---

## Security Summary

| User Role | View Own Vitals | View Others' Vitals | Create/Update |
|-----------|----------------|---------------------|---------------|
| Patient | ✅ Yes | ❌ No | ✅ Yes (own only) |
| Specialist | ✅ Yes (if patient) | ✅ Yes (assigned) | ❌ No |
| Local Provider | ✅ Yes (if patient) | ✅ Yes (with consent) | ❌ No |
| Admin | ✅ Yes | ✅ Yes (all) | ✅ Yes (all) |

All access is enforced at the database level via RLS policies, preventing unauthorized access even if client-side checks are bypassed.
