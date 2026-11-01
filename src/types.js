/**
 * @fileoverview Central JSDoc type definitions for Eventiq core domain models.
 * Provides IDE autocompletion and static type checking without a TypeScript compile step.
 */

/**
 * @typedef {Object} WeddingDetails
 * @property {string[]} [functions] - List of ceremonies (e.g. ['wedding', 'reception'])
 * @property {boolean} [indoor] - Whether primary ceremony is indoor
 * @property {string} [dietary] - Regional or dietary requirements
 */

/**
 * @typedef {Object} BirthdayDetails
 * @property {number} [age] - Age of the guest of honor
 * @property {boolean} [surprise] - Whether the party is a surprise
 * @property {boolean} [indoor] - Whether party is indoors
 */

/**
 * @typedef {Object} CommunityDetails
 * @property {number} [expectedCrowd] - Expected footfall count
 * @property {number} [sponsorshipTarget] - Target sponsorship in INR
 * @property {boolean} [indoor] - Venue setting
 * @property {boolean} [isPublic] - Open to public vs private society
 */

/**
 * @typedef {Object} EventiqRequest
 * @property {'wedding' | 'birthday' | 'community' | 'other'} eventType - Event category
 * @property {string} eventDate - Date in YYYY-MM-DD format
 * @property {number} guests - Expected guest count
 * @property {number} budget - Total budget in INR
 * @property {string} [city] - City or region
 * @property {'low' | 'average' | 'high'} [costLevel] - Regional cost level
 * @property {string} [theme] - Style or aesthetic theme
 * @property {string} [notes] - Organizer constraints or notes
 * @property {string} [eventName] - Custom event name if eventType is "other"
 * @property {WeddingDetails} [wedding]
 * @property {BirthdayDetails} [birthday]
 * @property {CommunityDetails} [community]
 */

/**
 * @typedef {Object} BudgetHealth
 * @property {'comfortable' | 'tight' | 'unrealistic'} level
 * @property {string} reason
 * @property {number} [effectivePerGuest]
 */

/**
 * @typedef {Object} BudgetCategory
 * @property {string} id - Unique category identifier (e.g. 'catering')
 * @property {string} label - Human-readable category title
 * @property {number} percent - Percentage share of total budget
 * @property {number} amount - Rupee allocation (integer)
 * @property {string} rationale - Contextual explanation for allocation
 * @property {string[]} tips - Tactical cost-saving and quality assurance tips
 */

/**
 * @typedef {Object} PlanBudget
 * @property {number} total - Total event budget
 * @property {number} perGuest - Unadjusted spend per guest
 * @property {BudgetHealth} health - Feasibility rating
 * @property {BudgetCategory[]} categories - Category distributions
 */

/**
 * @typedef {Object} TimelineTask
 * @property {string} title - Action title
 * @property {string} detail - Operational instruction
 */

/**
 * @typedef {Object} TimelineMilestone
 * @property {string} id - Milestone identifier
 * @property {string} label - Milestone title
 * @property {string} dueDate - Deadline date (YYYY-MM-DD)
 * @property {number} weeksLeft - Weeks remaining until deadline
 * @property {boolean} urgent - Urgent indicator (<= 4 weeks)
 * @property {TimelineTask[]} tasks - Specific milestone tasks
 */

/**
 * @typedef {Object} Vendor
 * @property {string} categoryId - Associated category
 * @property {string} label - Vendor service title
 * @property {string} bookByDate - Booking target date
 * @property {'immediate' | 'normal'} priority - Booking priority
 * @property {string[]} checklist - Vendor due-diligence steps
 * @property {string[]} questions - Negotiation/interview questions
 * @property {string[]} redFlags - Contractual warnings and red flags
 */

/**
 * @typedef {Object} CreativeIdeas
 * @property {string[]} themes - Creative concept themes
 * @property {string[]} activities - Entertainment and interactive ideas
 * @property {string[]} menu - Curated culinary suggestions
 * @property {string[]} decor - Aesthetic and floral highlights
 * @property {string[]} extras - Memorable personalized touches
 */

/**
 * @typedef {Object} RiskItem
 * @property {string} id - Risk code
 * @property {string} title - Risk title
 * @property {number} severity - Severity rating (1 to 3)
 * @property {string} mitigation - Actionable mitigation strategy
 */

/**
 * @typedef {Object} FiredRuleItem
 * @property {string} id - Rule code
 * @property {string} description - Trigger description
 * @property {string} effect - Concrete effect applied to plan
 */

/**
 * @typedef {Object} Plan
 * @property {string} id - Unique plan UUID
 * @property {'ai' | 'offline'} mode - Generation mode
 * @property {EventiqRequest} request - Sanitized request snapshot
 * @property {string} summary - Natural language summary
 * @property {PlanBudget} budget - Reconciled budget breakdown
 * @property {TimelineMilestone[]} timeline - Schedule of milestones
 * @property {Vendor[]} vendors - Due-diligence vendor guidance
 * @property {CreativeIdeas} ideas - Creative concepts and themes
 * @property {string[]} warnings - High-level advisory warnings
 * @property {RiskItem[]} risks - Prioritized event risks
 * @property {FiredRuleItem[]} firedRules - Audit trail of fired rules
 */

/**
 * @typedef {Object} RuleContext
 * @property {EventiqRequest} req - Validated input request
 * @property {Date} today - Normalized reference date
 * @property {Date} eventDate - Normalized event date
 * @property {number} daysToEvent - Calendar days until event
 * @property {number} weeksToEvent - Fractional weeks until event
 * @property {number} perGuest - Raw budget per attendee
 * @property {'low' | 'average' | 'high'} costLevel - Regional tier
 * @property {number} eventMonth - Event calendar month (1-12)
 * @property {boolean} isMonsoon - Whether event falls in monsoon months
 * @property {{ comfortable: number, tight: number }} bands - Threshold bands
 */

/**
 * @typedef {Object} RuleOutput
 * @property {Record<string, number>} [allocationShifts] - Percentage adjustments netting to 0
 * @property {string[]} [warnings] - User-facing warnings
 * @property {string[]} [priorityFlags] - Vendor category IDs marked urgent
 * @property {Array<{ milestoneId: string, title: string, detail: string }>} [extraTasks] - Injected tasks
 * @property {RiskItem[]} [risks] - Injected risk items
 * @property {BudgetHealth} [budgetHealth] - Overridden health tier
 * @property {string} [effect] - Fallback description of rule effect
 */

/**
 * @typedef {Object} Rule
 * @property {string} id - Unique rule identifier
 * @property {string} description - Rule purpose and trigger condition
 * @property {(ctx: RuleContext) => boolean} applies - Pure predicate function
 * @property {(ctx: RuleContext) => RuleOutput} apply - Pure transformation function
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - Profile type identifier
 * @property {string} label - Display title
 * @property {string} promptContext - Specialized instruction for Gemini
 * @property {{ comfortable: number, tight: number }} budgetBands - Spend benchmarks
 * @property {Record<string, number>} baseBudget - Default percentage allocation
 * @property {Array<{ id: string, label: string, weeksBefore: number }>} timelineMilestones
 * @property {Array<{ id: string, label: string, bookWeeksBefore: number }>} vendorCategories
 * @property {ReadonlyArray<Rule>} rules - Profile-specific rule catalog
 * @property {object} [templates] - Offline fallback text dictionaries
 */

export {};
