# Security Smoke Test Guide

## Test Objective
Verify that RLS policies correctly enforce:
- Patients can only access their own data
- Specialists can only see assigned episodes
- Local providers have read-only access with active consent
- All data access is logged in audit_logs

## Security Fixes Applied ✅
1. ✅ Removed public access to providers table
2. ✅ Restricted audit log inserts to service role (triggers only)
3. ✅ Added INSERT policies for profiles, patients, providers
4. ✅ Patients can only view providers they have episodes/bookings with

---

## Test Scenario 1: Patient Data Isolation

### Step 1: Create Test Patient A
1. Navigate to `/auth`
2. Sign up as:
   - Email: `patient-a@test.com`
   - Password: `TestPass123!`
   - Role: **Patient**
   - Full Name: `Test Patient A`

### Step 2: Create Test Patient B
1. Sign out
2. Sign up as:
   - Email: `patient-b@test.com`
   - Password: `TestPass123!`
   - Role: **Patient**
   - Full Name: `Test Patient B`

### Step 3: Create Episode for Patient A
1. Open Backend (Lovable Cloud dashboard)
2. Navigate to `episodes_of_care` table
3. Insert a record:
   ```sql
   -- First, get patient A's patient_id from the patients table
   -- Then create an episode (you'll need a specialist_id - create one first)
   ```

### Step 4: Verify Isolation
1. Log in as **Patient B**
2. Open browser DevTools Console
3. Run:
   ```javascript
   const { data, error } = await supabase
     .from('episodes_of_care')
     .select('*');
   console.log('Episodes visible to Patient B:', data);
   ```
4. **Expected Result**: Empty array `[]` - Patient B should NOT see Patient A's episodes

5. Log in as **Patient A**
6. Run the same query
7. **Expected Result**: Array with Patient A's episodes ONLY

---

## Test Scenario 2: Specialist Access Control

### Step 1: Create Test Specialist
1. Sign up as:
   - Email: `specialist-a@test.com`
   - Password: `TestPass123!`
   - Role: **Specialist**
   - Full Name: `Dr. Test Specialist`

### Step 2: Verify Specialist Can Only See Assigned Episodes
1. Log in as **Specialist A**
2. Run:
   ```javascript
   const { data, error } = await supabase
     .from('episodes_of_care')
     .select('*');
   console.log('Episodes visible to Specialist:', data);
   ```
3. **Expected Result**: Only episodes where `specialist_id` matches this specialist

### Step 3: Verify Specialist Can Create Care Plans
1. Log in as **Specialist A**
2. Run:
   ```javascript
   const { data: episodes } = await supabase
     .from('episodes_of_care')
     .select('id')
     .limit(1);
   
   if (episodes.length > 0) {
     const { data, error } = await supabase
       .from('care_plans')
       .insert({
         episode_id: episodes[0].id,
         title: 'Post-Op Recovery Plan',
         description: 'Standard recovery protocol'
       })
       .select();
     
     console.log('Care plan created:', data, 'Error:', error);
   }
   ```
4. **Expected Result**: Success if episode is assigned to this specialist

---

## Test Scenario 3: Local Provider Consent-Based Access

### Step 1: Create Local Provider
1. Sign up as:
   - Email: `provider-local@test.com`
   - Password: `TestPass123!`
   - Role: **Local Provider**
   - Full Name: `Local Care Provider`

### Step 2: Verify No Access Without Consent
1. Log in as **Local Provider**
2. Run:
   ```javascript
   const { data, error } = await supabase
     .from('episodes_of_care')
     .select('*');
   console.log('Episodes visible to Local Provider (no consent):', data);
   ```
3. **Expected Result**: Empty array `[]`

### Step 3: Grant Consent
1. Open Backend
2. In `consent_records` table, insert:
   ```sql
   -- Insert consent record linking patient to local provider
   INSERT INTO consent_records (patient_id, provider_id, version, consent_text, accepted, signed_at)
   VALUES (
     '[patient_a_id]',
     '[local_provider_id]',
     '1.0',
     'I consent to share my data with local provider',
     true,
     now()
   );
   ```

### Step 4: Verify Read-Only Access With Consent
1. Log in as **Local Provider**
2. Run:
   ```javascript
   const { data, error } = await supabase
     .from('episodes_of_care')
     .select('*');
   console.log('Episodes visible WITH consent:', data);
   ```
3. **Expected Result**: Can now see patient's episodes (read-only)

4. Try to update:
   ```javascript
   const { error } = await supabase
     .from('episodes_of_care')
     .update({ notes: 'Trying to modify' })
     .eq('id', '[episode_id]');
   console.log('Update error:', error);
   ```
5. **Expected Result**: Should FAIL - local providers have read-only access

---

## Test Scenario 4: Audit Logging

### Step 1: Verify Audit Logs Are Created
1. Perform any CRUD operation (create, update, or delete)
2. Open Backend
3. Navigate to `audit_logs` table
4. **Expected Result**: New audit log entries with:
   - `actor_id`: User who performed action
   - `action`: INSERT/UPDATE/DELETE
   - `entity`: Table name
   - `entity_id`: Record ID
   - `old_data` / `new_data`: Change details
   - `timestamp`: When action occurred

### Step 2: Verify Users Cannot Forge Audit Logs
1. Log in as any user
2. Try to insert directly:
   ```javascript
   const { error } = await supabase
     .from('audit_logs')
     .insert({
       actor_id: '[some_user_id]',
       action: 'FAKE_ACTION',
       entity: 'test',
       entity_id: '[random_id]'
     });
   console.log('Audit insert error:', error);
   ```
3. **Expected Result**: Should FAIL with permission denied error

---

## Test Scenario 5: Admin Full Access

### Step 1: Create Admin User
1. Sign up as:
   - Email: `admin@test.com`
   - Password: `TestPass123!`
   - Role: **Admin**
   - Full Name: `System Admin`

### Step 2: Verify Full Access
1. Log in as **Admin**
2. Run:
   ```javascript
   const { data: allEpisodes } = await supabase
     .from('episodes_of_care')
     .select('*');
   
   const { data: allPatients } = await supabase
     .from('patients')
     .select('*');
   
   const { data: allAuditLogs } = await supabase
     .from('audit_logs')
     .select('*');
   
   console.log('Admin sees:', {
     episodes: allEpisodes.length,
     patients: allPatients.length,
     auditLogs: allAuditLogs.length
   });
   ```
3. **Expected Result**: Admin can see ALL data across ALL tables

---

## Quick Verification Checklist

- [ ] Patient A cannot see Patient B's episodes
- [ ] Patient can see their own episodes and care plans
- [ ] Specialist can only see assigned episodes
- [ ] Specialist can create/update care plans for their episodes
- [ ] Local provider has NO access without consent
- [ ] Local provider has READ-ONLY access WITH consent
- [ ] All CRUD operations create audit log entries
- [ ] Users cannot directly insert into audit_logs
- [ ] Admin can see all data
- [ ] Provider personal data is NOT publicly accessible

---

## Testing via Backend UI

<lov-actions>
  <lov-open-backend>Open Backend to View Data</lov-open-backend>
</lov-actions>

1. Click "Open Backend to View Data" above
2. Navigate through tables to verify RLS policies
3. Try querying as different users to confirm access controls

---

## Expected Security Behavior Summary

| User Role | Episodes Access | Care Plans | Audit Logs | Provider Data |
|-----------|----------------|------------|------------|---------------|
| Patient | Own only | Own only | Own only | Assigned providers only |
| Specialist | Assigned only | Assigned (full) | Own only | Own + assigned patients' |
| Local Provider | With consent (read-only) | With consent (read-only) | Own only | Own only |
| Admin | All (full) | All (full) | All (full) | All (full) |
| Unauthenticated | None | None | None | None |
