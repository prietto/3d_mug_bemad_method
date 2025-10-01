import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CreateLeadRequest, CreateLeadResponse, Lead, LeadSessionData } from '@/lib/types'
import {
  rateLimit,
  getClientIdentifier,
  getSecurityHeaders,
  getCorsHeaders,
  createRequestTimer,
  logError,
  logInfo
} from '@/lib/middleware/security'
import {
  extractSessionData,
  mergeSessionData,
  validateSessionData
} from '@/lib/utils/sessionTracking'
import {
  checkForDuplicateLead,
  mergeDuplicateLead,
  logDuplicateDetection
} from '@/lib/utils/duplicateDetection'
import {
  validateDesignForLead,
  createDesignSnapshot,
  updateDesignCompletionStatus,
  calculateLeadQualityScore
} from '@/lib/utils/designValidation'
import {
  QueryPerformanceTimer
} from '@/lib/utils/performanceMonitoring'
import { sendEmailAsync } from '@/lib/utils/emailDelivery'
import { generateBusinessNotificationEmail, generateUserConfirmationEmail } from '@/lib/services/emailTemplates'
import { generateUnsubscribeToken } from '@/lib/utils/gdpr'
import type { Lead as EmailLead, Design as EmailDesign } from '@/types/email'

export async function POST(request: NextRequest) {
  const timer = createRequestTimer()
  const clientId = getClientIdentifier(request)
  const requestId = crypto.randomUUID()
  
  const context = {
    method: 'POST',
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: new Date().toISOString(),
    requestId,
    clientIp: clientId
  }

  try {
    // Apply rate limiting (stricter for lead creation)
    const rateLimitResult = rateLimit(clientId, { maxRequests: 10 })
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for lead creation', context)
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    const body: CreateLeadRequest = await request.json()
    
    // Validate required fields
    if (!body.email || !body.name || !body.projectDescription) {
      logInfo('Lead creation failed - missing required fields', context, { 
        missingFields: {
          email: !body.email,
          name: !body.name,
          projectDescription: !body.projectDescription
        }
      })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, name, projectDescription' },
        { 
          status: 400,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    // Extract and validate session tracking data (Story 3.2)
    const serverSessionData = extractSessionData(request, body.sessionData?.sessionId)
    const sessionData = mergeSessionData(serverSessionData, body.sessionData)
    
    const sessionValidation = validateSessionData(sessionData)
    if (!sessionValidation.isValid) {
      logInfo('Lead creation failed - invalid session data', context, { 
        missingSessionFields: sessionValidation.missingFields
      })
      return NextResponse.json(
        { success: false, error: `Invalid session data: missing ${sessionValidation.missingFields.join(', ')}` },
        { 
          status: 400,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    // Check for duplicate submissions (Story 3.2)
    const duplicateCheck = await checkForDuplicateLead(body.email, sessionData)
    logDuplicateDetection(duplicateCheck, body.email, sessionData.sessionId, context)
    
    if (duplicateCheck.isDuplicate) {
      if (duplicateCheck.canMerge && duplicateCheck.existingLeadId) {
        // Merge with existing lead
        const mergeResult = await mergeDuplicateLead(duplicateCheck.existingLeadId, {
          email: body.email,
          name: body.name,
          phone: body.phone,
          projectDescription: body.projectDescription,
          designId: body.designId,
          source: body.source || 'direct',
          sessionData
        })
        
        if (mergeResult.success) {
          logInfo('Duplicate lead merged successfully', context, { 
            originalLeadId: duplicateCheck.existingLeadId,
            duplicateType: duplicateCheck.duplicateType
          })
          
          const response: CreateLeadResponse = {
            success: true,
            data: mergeResult.data as Lead
          }
          
          return NextResponse.json(response, { 
            status: 200, // 200 for successful merge, not 201 for new creation
            headers: {
              ...rateLimitResult.headers,
              ...getSecurityHeaders(),
              ...getCorsHeaders(request.headers.get('origin') || undefined),
              ...timer.getHeaders()
            }
          })
        } else {
          logError(new Error(mergeResult.error), context, { 
            component: 'duplicate_merge',
            existingLeadId: duplicateCheck.existingLeadId
          })
        }
      }
      
      // If merge failed or not allowed, return duplicate error
      return NextResponse.json(
        { success: false, error: duplicateCheck.reason || 'Duplicate submission detected' },
        { 
          status: 409, // Conflict status for duplicates
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      logInfo('Lead creation failed - invalid email format', context, { email: body.email })
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { 
          status: 400,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    // Validate design if provided (Story 3.2)
    let designValidation = null
    let designSnapshot = null
    let leadQualityScore = 50 // Default score
    
    if (body.designId) {
      designValidation = await validateDesignForLead(body.designId)
      
      if (!designValidation.isValid) {
        logInfo('Lead creation failed - invalid design', context, { 
          designId: body.designId,
          designErrors: designValidation.errors
        })
        return NextResponse.json(
          { success: false, error: `Invalid design: ${designValidation.errors.join(', ')}` },
          { 
            status: 400,
            headers: {
              ...rateLimitResult.headers,
              ...getSecurityHeaders(),
              ...getCorsHeaders(request.headers.get('origin') || undefined),
              ...timer.getHeaders()
            }
          }
        )
      }
      
      // Create design snapshot for audit trail
      designSnapshot = await createDesignSnapshot(body.designId)
      
      // Calculate lead quality score
      leadQualityScore = calculateLeadQualityScore(designValidation, {
        engagementDuration: sessionData.engagementDuration,
        deviceType: sessionData.deviceType
      })
      
      // Update design completion status
      await updateDesignCompletionStatus(body.designId, designValidation)
    }

    // Database timeout protection
    const supabase = createServerClient()
    
    // Determine engagement level based on quality score and provided level
    let engagementLevel = body.engagementLevel || 'medium'
    if (leadQualityScore >= 80) {
      engagementLevel = 'high'
    } else if (leadQualityScore >= 60) {
      engagementLevel = 'medium'
    } else if (leadQualityScore < 40) {
      engagementLevel = 'low'
    }

    // Create lead record with session tracking data (Story 3.2)
    const leadId = crypto.randomUUID()
    const leadData = {
      id: leadId,
      email: body.email,
      name: body.name,
      phone: body.phone,
      project_description: body.projectDescription,
      design_id: body.designId,
      source: body.source || 'direct',
      engagement_level: engagementLevel,
      status: 'new',
      created_at: new Date().toISOString(),
      // Session tracking fields
      session_id: sessionData.sessionId,
      user_agent: sessionData.userAgent,
      referral_source: sessionData.referralSource,
      device_type: sessionData.deviceType,
      browser_type: sessionData.browserType,
      ip_address_hash: sessionData.ipAddressHash,
      engagement_duration: sessionData.engagementDuration
    }

    // Monitor database operation performance (Story 3.2)
    const dbTimer = new QueryPerformanceTimer('INSERT_leads', {
      email: body.email,
      hasDesign: !!body.designId,
      deviceType: sessionData.deviceType
    });

    const dbOperation = supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    // Add timeout to database operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 5000)
    })

    const { data, error } = await Promise.race([dbOperation, timeoutPromise]) as any
    
    // Log database performance
    await dbTimer.end(1) // 1 row inserted

    if (error) {
      logError(error, context, { 
        component: 'lead_creation',
        leadData: { email: body.email, name: body.name }
      })
      return NextResponse.json(
        { success: false, error: 'Failed to create lead' },
        { 
          status: 500,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    const response: CreateLeadResponse = {
      success: true,
      data: data as Lead
    }

    logInfo('Lead created successfully', context, {
      leadId: data.id,
      email: body.email,
      sessionId: sessionData.sessionId,
      deviceType: sessionData.deviceType,
      browserType: sessionData.browserType,
      referralSource: sessionData.referralSource,
      designId: body.designId,
      designQuality: designValidation?.qualityScore,
      leadQualityScore,
      engagementLevel,
      responseTime: timer.end()
    })

    // Send email notifications asynchronously (non-blocking) - Story 3.4
    sendLeadNotificationEmails(data as Lead, designSnapshot).catch((error) => {
      logError(error, context, {
        component: 'email_notification',
        leadId: data.id
      })
    })

    return NextResponse.json(response, {
      status: 201,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders()
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'lead_creation' })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      {
        status: 500,
        headers: {
          ...getSecurityHeaders(),
          ...getCorsHeaders(request.headers.get('origin') || undefined),
          ...timer.getHeaders()
        }
      }
    )
  }
}

/**
 * Send email notifications for new lead
 * Story 3.4: Automated Lead Notifications
 */
async function sendLeadNotificationEmails(lead: Lead, designSnapshot: any) {
  try {
    const businessEmail = process.env.BUSINESS_EMAIL || 'owner@example.com'

    // Convert lead to email format
    const emailLead: EmailLead = {
      id: lead.id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      projectDescription: lead.projectDescription,
      designId: lead.designId,
      createdAt: lead.createdAt,
      source: lead.source,
      engagementLevel: lead.engagementLevel as 'low' | 'medium' | 'high',
      status: lead.status as 'new' | 'contacted' | 'qualified' | 'converted',
    }

    // Convert design snapshot to email format if available
    let emailDesign: EmailDesign | undefined
    if (designSnapshot) {
      emailDesign = {
        id: designSnapshot.id,
        mugColor: designSnapshot.mug_color || 'white',
        uploadedImageBase64: designSnapshot.uploaded_image_base64,
        customText: designSnapshot.custom_text,
        textFont: designSnapshot.text_font,
        textPosition: designSnapshot.text_position,
        createdAt: designSnapshot.created_at,
        lastModified: designSnapshot.last_modified,
        isComplete: designSnapshot.is_complete || false,
      }
    }

    // Generate unsubscribe token for user
    const unsubscribeToken = generateUnsubscribeToken(emailLead.email)

    // Send business owner notification
    const businessEmail_template = generateBusinessNotificationEmail(emailLead, emailDesign)
    sendEmailAsync({
      to: businessEmail,
      subject: businessEmail_template.subject,
      html: businessEmail_template.html,
      text: businessEmail_template.text,
    })

    // Send user confirmation email
    const userEmailTemplate = generateUserConfirmationEmail(emailLead, emailDesign, unsubscribeToken)
    sendEmailAsync({
      to: emailLead.email,
      subject: userEmailTemplate.subject,
      html: userEmailTemplate.html,
      text: userEmailTemplate.text,
    })

    console.log(`📧 Email notifications queued for lead ${lead.id}`)
  } catch (error) {
    console.error('Failed to queue email notifications:', error)
    throw error
  }
}
