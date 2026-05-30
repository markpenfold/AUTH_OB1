// src/actions/invite.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

// Initialize Resend with your API key (add RESEND_API_KEY to your .env.local)
const resend = new Resend(process.env.RESEND_API_KEY)

export type InviteState = { error?: string; success?: boolean }

export async function inviteTeamMember(
  accountId: string, 
  prevState: InviteState, 
  formData: FormData
): Promise<InviteState> {
  const email = (formData.get('email') as string).trim().toLowerCase()
  
  if (!email) {
    return { error: "Email address is required." }
  }

  const supabase = await createClient()
  
  // 1. Get the current logged-in user (the admin/owner doing the inviting)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "You must be logged in to invite team members." }
  }

  // 🔒 SECURITY CHECK: Verify they are actually the OWNER of this specific account
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .single() // Expecting exactly one row

  if (membershipError || !membership || membership.role !== 'owner') {
    return { error: "Unauthorized. Only the workspace owner can invite team members." }
  }

  // 2. Insert the secure token row into the invitations table
  const { data: invite, error: dbError } = await supabase
    .from('invitations')
    .insert({
      account_id: accountId,
      email: email,
      invited_by: user.id
    })
    .select('id')
    .single()

  if (dbError || !invite) {
    return { error: "Failed to generate invitation token. Please try again." }
  }

  // 3. Construct the secure signup link
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteLink = `${siteUrl}/signup?invite=${invite.id}`

  // 4. Fire the email out via Resend
  try {
    const { error: mailError } = await resend.emails.send({
      from: 'Your App <onboarding@yourdomain.com>', // Replace with your verified Resend domain
      to: [email],
      subject: `You've been invited to join a team!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2>Workspace Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to collaborate on a workspace team. Click the link below to accept your invitation and set up your account:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This invitation link will expire in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you weren't expecting this email, you can safely ignore it.</p>
        </div>
      `
    })

    if (mailError) {
      return { error: mailError.message }
    }

    // Refresh the dashboard view to show pending invites if you list them
    revalidatePath('/dashboard/settings/team')
    return { success: true }

  } catch (err) {
    return { error: "System failed to broadcast invitation email." }
  }
}