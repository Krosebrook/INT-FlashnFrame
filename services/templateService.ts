
import { DashboardTemplate, VizType, WidgetConfig } from '../types';

const mkWidget = (tId: string, idx: number, type: VizType, title: string, x: number, y: number, w: number, h: number): WidgetConfig => ({
  id: `${tId}-w${idx}`,
  type,
  title,
  x,
  y,
  w,
  h
});

export const generateTemplates = (): DashboardTemplate[] => {
  const fohTemplates: DashboardTemplate[] = [
    {
      id: 'foh-sales-exec',
      name: 'Sales Executive Command',
      category: 'Sales',
      archetype: 'Executive',
      difficulty: 'Pro',
      description: 'High-level view of revenue performance, pipeline health, and forecast accuracy for CROs.',
      widgets: [
        mkWidget('foh-sales-exec', 1, VizType.KPI_CARD, 'ARR Current', 0, 0, 3, 1),
        mkWidget('foh-sales-exec', 2, VizType.KPI_CARD, 'Pipeline Coverage', 3, 0, 3, 1),
        mkWidget('foh-sales-exec', 3, VizType.KPI_CARD, 'Forecast vs Goal', 6, 0, 3, 1),
        mkWidget('foh-sales-exec', 4, VizType.KPI_CARD, 'Win Rate', 9, 0, 3, 1),
        mkWidget('foh-sales-exec', 5, VizType.TIME_SERIES, 'Revenue Trend (YoY)', 0, 1, 8, 3),
        mkWidget('foh-sales-exec', 6, VizType.FUNNEL, 'Sales Funnel Velocity', 8, 1, 4, 3),
        mkWidget('foh-sales-exec', 7, VizType.BAR, 'Regional Performance', 0, 4, 6, 3),
        mkWidget('foh-sales-exec', 8, VizType.TABLE, 'Top 10 Deals Closing', 6, 4, 6, 3),
        mkWidget('foh-sales-exec', 9, VizType.BAR, 'Regional Sales Analysis', 0, 7, 12, 4)
      ]
    },
    {
      id: 'foh-mkt-roi',
      name: 'Marketing ROI Tracker',
      category: 'Marketing',
      archetype: 'Analyst',
      difficulty: 'Intermediate',
      description: 'Track campaign effectiveness, cost per lead, and channel attribution.',
      widgets: [
        mkWidget('foh-mkt-roi', 1, VizType.KPI_CARD, 'Total Spend', 0, 0, 4, 1),
        mkWidget('foh-mkt-roi', 2, VizType.KPI_CARD, 'Cost Per MQL', 4, 0, 4, 1),
        mkWidget('foh-mkt-roi', 3, VizType.KPI_CARD, 'Marketing Influenced Rev', 8, 0, 4, 1),
        mkWidget('foh-mkt-roi', 4, VizType.STACKED_BAR, 'Spend by Channel', 0, 1, 6, 3),
        mkWidget('foh-mkt-roi', 5, VizType.SCATTER, 'Campaign Cost vs Conv.', 6, 1, 6, 3),
        mkWidget('foh-mkt-roi', 6, VizType.TIME_SERIES, 'Lead Gen Volume', 0, 4, 12, 3)
      ]
    },
    {
      id: 'foh-cx-health',
      name: 'Customer Health Monitor',
      category: 'Support',
      archetype: 'Ops',
      difficulty: 'Novice',
      description: 'Real-time monitoring of NPS, CSAT, and support ticket volumes.',
      widgets: [
        mkWidget('foh-cx-health', 1, VizType.KPI_CARD, 'Current NPS', 0, 0, 3, 1),
        mkWidget('foh-cx-health', 2, VizType.KPI_CARD, 'CSAT Score', 3, 0, 3, 1),
        mkWidget('foh-cx-health', 3, VizType.KPI_CARD, 'Ticket Backlog', 6, 0, 3, 1),
        mkWidget('foh-cx-health', 4, VizType.KPI_CARD, 'Avg Response Time', 9, 0, 3, 1),
        mkWidget('foh-cx-health', 5, VizType.HEATMAP, 'Ticket Heatmap (Hr/Day)', 0, 1, 6, 4),
        mkWidget('foh-cx-health', 6, VizType.BAR, 'Issues by Category', 6, 1, 6, 4)
      ]
    },
    {
      id: 'foh-ecom-ops',
      name: 'E-commerce Store Ops',
      category: 'Ecom',
      archetype: 'Ops',
      difficulty: 'Pro',
      description: 'Detailed operational view for online retailers including cart abandonment.',
      widgets: [
        mkWidget('foh-ecom-ops', 1, VizType.KPI_CARD, 'AOV', 0, 0, 3, 1),
        mkWidget('foh-ecom-ops', 2, VizType.KPI_CARD, 'Conversion Rate', 3, 0, 3, 1),
        mkWidget('foh-ecom-ops', 3, VizType.KPI_CARD, 'Cart Abandon Rate', 6, 0, 3, 1),
        mkWidget('foh-ecom-ops', 4, VizType.KPI_CARD, 'Return Rate', 9, 0, 3, 1),
        mkWidget('foh-ecom-ops', 5, VizType.TIME_SERIES, 'Hourly Traffic', 0, 1, 12, 2),
        mkWidget('foh-ecom-ops', 6, VizType.FUNNEL, 'Checkout Flow Drop-off', 0, 3, 6, 3),
        mkWidget('foh-ecom-ops', 7, VizType.TABLE, 'Low Stock Alerts', 6, 3, 6, 3)
      ]
    },
    {
      id: 'foh-retail-perf',
      name: 'Retail Store Performance',
      category: 'Sales',
      archetype: 'Executive',
      difficulty: 'Intermediate',
      description: 'Physical store analytics comparison across regions.',
      widgets: [
        mkWidget('foh-retail-perf', 1, VizType.GEO_MAP, 'Store Performance Map', 0, 0, 8, 4),
        mkWidget('foh-retail-perf', 2, VizType.BAR, 'Top 5 Stores', 8, 0, 4, 4),
        mkWidget('foh-retail-perf', 3, VizType.KPI_CARD, 'Foot Traffic', 0, 4, 4, 1),
        mkWidget('foh-retail-perf', 4, VizType.KPI_CARD, 'Sales / SqFt', 4, 4, 4, 1),
        mkWidget('foh-retail-perf', 5, VizType.KPI_CARD, 'Staff Cost %', 8, 4, 4, 1)
      ]
    },
    {
      id: 'foh-pr-sentiment',
      name: 'Brand Sentiment & PR',
      category: 'PR',
      archetype: 'Analyst',
      difficulty: 'Novice',
      description: 'Track media mentions, sentiment analysis, and share of voice.',
      widgets: [
        mkWidget('foh-pr-sentiment', 1, VizType.KPI_CARD, 'Net Sentiment', 0, 0, 4, 1),
        mkWidget('foh-pr-sentiment', 2, VizType.KPI_CARD, 'Media Mentions', 4, 0, 4, 1),
        mkWidget('foh-pr-sentiment', 3, VizType.KPI_CARD, 'Share of Voice', 8, 0, 4, 1),
        mkWidget('foh-pr-sentiment', 4, VizType.TIME_SERIES, 'Sentiment Over Time', 0, 1, 12, 3),
        mkWidget('foh-pr-sentiment', 5, VizType.PIVOT, 'Mentions by Source', 0, 4, 12, 3)
      ]
    },
    {
      id: 'foh-social-growth',
      name: 'Social Media Growth',
      category: 'Marketing',
      archetype: 'Ops',
      difficulty: 'Novice',
      description: 'Audience growth, engagement rates, and top performing posts.',
      widgets: [
        mkWidget('foh-social-growth', 1, VizType.TIME_SERIES, 'Follower Growth', 0, 0, 8, 3),
        mkWidget('foh-social-growth', 2, VizType.KPI_CARD, 'Engagement Rate', 8, 0, 4, 1),
        mkWidget('foh-social-growth', 3, VizType.KPI_CARD, 'Total Reach', 8, 1, 4, 1),
        mkWidget('foh-social-growth', 4, VizType.KPI_CARD, 'Viral Coefficient', 8, 2, 4, 1),
        mkWidget('foh-social-growth', 5, VizType.BAR, 'Content Type Performance', 0, 3, 12, 3)
      ]
    },
    {
      id: 'foh-churn-prevent',
      name: 'Churn Prevention Desk',
      category: 'Support',
      archetype: 'Analyst',
      difficulty: 'Pro',
      description: 'Identify at-risk customers and analyze churn drivers.',
      widgets: [
        mkWidget('foh-churn-prevent', 1, VizType.GAUGE, 'Churn Probability', 0, 0, 4, 3),
        mkWidget('foh-churn-prevent', 2, VizType.KPI_CARD, 'At-Risk ARR', 4, 0, 4, 1),
        mkWidget('foh-churn-prevent', 3, VizType.KPI_CARD, 'Saved this Month', 8, 0, 4, 1),
        mkWidget('foh-churn-prevent', 4, VizType.COHORT, 'Retention Cohorts', 4, 1, 8, 4),
        mkWidget('foh-churn-prevent', 5, VizType.BAR, 'Top Churn Reasons', 0, 3, 4, 2)
      ]
    },
    {
      id: 'foh-web-traffic',
      name: 'Digital Traffic Tower',
      category: 'Marketing',
      archetype: 'Analyst',
      difficulty: 'Intermediate',
      description: 'Deep dive into web sessions, bounce rates, and traffic sources.',
      widgets: [
        mkWidget('foh-web-traffic', 1, VizType.SANKEY, 'Traffic Flow', 0, 0, 12, 4),
        mkWidget('foh-web-traffic', 2, VizType.KPI_CARD, 'Unique Visitors', 0, 4, 3, 1),
        mkWidget('foh-web-traffic', 3, VizType.KPI_CARD, 'Bounce Rate', 3, 4, 3, 1),
        mkWidget('foh-web-traffic', 4, VizType.KPI_CARD, 'Avg Session', 6, 4, 3, 1),
        mkWidget('foh-web-traffic', 5, VizType.KPI_CARD, 'Pages / Visit', 9, 4, 3, 1)
      ]
    },
    {
      id: 'foh-event-roi',
      name: 'Event Success Tracker',
      category: 'Marketing',
      archetype: 'Ops',
      difficulty: 'Intermediate',
      description: 'Post-event analysis of registrations, attendance, and lead capture.',
      widgets: [
        mkWidget('foh-event-roi', 1, VizType.KPI_CARD, 'Registrations', 0, 0, 4, 1),
        mkWidget('foh-event-roi', 2, VizType.KPI_CARD, 'Attendance %', 4, 0, 4, 1),
        mkWidget('foh-event-roi', 3, VizType.KPI_CARD, 'Leads Captured', 8, 0, 4, 1),
        mkWidget('foh-event-roi', 4, VizType.BAR, 'Registration by Ticket Type', 0, 1, 6, 3),
        mkWidget('foh-event-roi', 5, VizType.TIME_SERIES, 'Check-in Velocity', 6, 1, 6, 3)
      ]
    }
  ];

  const bohTemplates: DashboardTemplate[] = [
    {
      id: 'boh-cfo-overview',
      name: 'CFO Financial Control',
      category: 'Finance',
      archetype: 'Executive',
      difficulty: 'Pro',
      description: 'Top-level financial metrics including EBITDA, Cash Flow, and OpEx.',
      widgets: [
        mkWidget('boh-cfo-overview', 1, VizType.KPI_CARD, 'EBITDA', 0, 0, 3, 1),
        mkWidget('boh-cfo-overview', 2, VizType.KPI_CARD, 'Net Burn', 3, 0, 3, 1),
        mkWidget('boh-cfo-overview', 3, VizType.KPI_CARD, 'Cash Runway', 6, 0, 3, 1),
        mkWidget('boh-cfo-overview', 4, VizType.KPI_CARD, 'Gross Margin', 9, 0, 3, 1),
        mkWidget('boh-cfo-overview', 5, VizType.WATERFALL, 'P&L Waterfall', 0, 1, 8, 4),
        mkWidget('boh-cfo-overview', 6, VizType.STACKED_BAR, 'OpEx by Dept', 8, 1, 4, 4),
        mkWidget('boh-cfo-overview', 7, VizType.TABLE, 'Major Variances', 0, 5, 12, 3)
      ]
    },
    {
      id: 'boh-hr-talent',
      name: 'Talent Acquisition Pipe',
      category: 'HR',
      archetype: 'Ops',
      difficulty: 'Intermediate',
      description: 'Monitor hiring velocity, time-to-fill, and offer acceptance rates.',
      widgets: [
        mkWidget('boh-hr-talent', 1, VizType.FUNNEL, 'Hiring Funnel', 0, 0, 6, 4),
        mkWidget('boh-hr-talent', 2, VizType.KPI_CARD, 'Open Roles', 6, 0, 3, 1),
        mkWidget('boh-hr-talent', 3, VizType.KPI_CARD, 'Time to Fill', 9, 0, 3, 1),
        mkWidget('boh-hr-talent', 4, VizType.KPI_CARD, 'Offer Accept %', 6, 1, 3, 1),
        mkWidget('boh-hr-talent', 5, VizType.KPI_CARD, 'Diversity %', 9, 1, 3, 1),
        mkWidget('boh-hr-talent', 6, VizType.BAR, 'Source of Hire', 6, 2, 6, 2)
      ]
    },
    {
      id: 'boh-it-ops',
      name: 'IT Ops Command',
      category: 'Ops',
      archetype: 'Ops',
      difficulty: 'Pro',
      description: 'System uptime, incident response times, and infrastructure health.',
      widgets: [
        mkWidget('boh-it-ops', 1, VizType.KPI_CARD, 'System Uptime', 0, 0, 3, 1),
        mkWidget('boh-it-ops', 2, VizType.KPI_CARD, 'Active Incidents', 3, 0, 3, 1),
        mkWidget('boh-it-ops', 3, VizType.KPI_CARD, 'MTTR', 6, 0, 3, 1),
        mkWidget('boh-it-ops', 4, VizType.KPI_CARD, 'Cloud Spend', 9, 0, 3, 1),
        mkWidget('boh-it-ops', 5, VizType.TIME_SERIES, 'Latency (p99)', 0, 1, 8, 3),
        mkWidget('boh-it-ops', 6, VizType.GAUGE, 'Server Load', 8, 1, 4, 3),
        mkWidget('boh-it-ops', 7, VizType.TABLE, 'Recent Outages', 0, 4, 12, 2)
      ]
    },
    {
      id: 'boh-sc-logistics',
      name: 'Supply Chain Velocity',
      category: 'Supply Chain',
      archetype: 'Ops',
      difficulty: 'Pro',
      description: 'Track inventory turnover, shipping times, and logistics costs.',
      widgets: [
        mkWidget('boh-sc-logistics', 1, VizType.GEO_MAP, 'Shipment Tracking', 0, 0, 8, 5),
        mkWidget('boh-sc-logistics', 2, VizType.KPI_CARD, 'On-Time Deliv %', 8, 0, 4, 1),
        mkWidget('boh-sc-logistics', 3, VizType.KPI_CARD, 'Avg Ship Cost', 8, 1, 4, 1),
        mkWidget('boh-sc-logistics', 4, VizType.BAR, 'Inv Turnover', 8, 2, 4, 3)
      ]
    },
    {
      id: 'boh-procure-spend',
      name: 'Procurement & Spend',
      category: 'Finance',
      archetype: 'Analyst',
      difficulty: 'Intermediate',
      description: 'Analyze vendor spend, contract renewals, and savings per category.',
      widgets: [
        mkWidget('boh-procure-spend', 1, VizType.TREEMAP, 'Spend by Category', 0, 0, 8, 4),
        mkWidget('boh-procure-spend', 2, VizType.KPI_CARD, 'Total Spend', 8, 0, 4, 1),
        mkWidget('boh-procure-spend', 3, VizType.KPI_CARD, 'Active Vendors', 8, 1, 4, 1),
        mkWidget('boh-procure-spend', 4, VizType.TABLE, 'Contracts Expiring', 8, 2, 4, 2),
        mkWidget('boh-procure-spend', 5, VizType.BAR, 'Top 10 Vendors', 0, 4, 12, 3)
      ]
    },
    {
      id: 'boh-legal-risk',
      name: 'Legal Risk & Compliance',
      category: 'Legal',
      archetype: 'Executive',
      difficulty: 'Novice',
      description: 'Monitor contract statuses, compliance audits, and legal requests.',
      widgets: [
        mkWidget('boh-legal-risk', 1, VizType.KPI_CARD, 'Open Matters', 0, 0, 3, 1),
        mkWidget('boh-legal-risk', 2, VizType.KPI_CARD, 'Audit Risk Score', 3, 0, 3, 1),
        mkWidget('boh-legal-risk', 3, VizType.KPI_CARD, 'Contracts Pending', 6, 0, 3, 1),
        mkWidget('boh-legal-risk', 4, VizType.KPI_CARD, 'Ext Counsel Spend', 9, 0, 3, 1),
        mkWidget('boh-legal-risk', 5, VizType.STACKED_BAR, 'Requests by Dept', 0, 1, 6, 3),
        mkWidget('boh-legal-risk', 6, VizType.PIVOT, 'Compliance Checklist', 6, 1, 6, 3)
      ]
    },
    {
      id: 'boh-eng-sprint',
      name: 'Engineering Pulse',
      category: 'Engineering',
      archetype: 'Ops',
      difficulty: 'Intermediate',
      description: 'Sprint burndown, velocity tracking, and bug triage metrics.',
      widgets: [
        mkWidget('boh-eng-sprint', 1, VizType.TIME_SERIES, 'Burndown Chart', 0, 0, 8, 3),
        mkWidget('boh-eng-sprint', 2, VizType.KPI_CARD, 'Sprint Velocity', 8, 0, 4, 1),
        mkWidget('boh-eng-sprint', 3, VizType.KPI_CARD, 'Bug Ratio', 8, 1, 4, 1),
        mkWidget('boh-eng-sprint', 4, VizType.KPI_CARD, 'Code Coverage', 8, 2, 4, 1),
        mkWidget('boh-eng-sprint', 5, VizType.BAR, 'Bugs by Severity', 0, 3, 6, 3),
        mkWidget('boh-eng-sprint', 6, VizType.TABLE, 'Pull Request Age', 6, 3, 6, 3)
      ]
    },
    {
      id: 'boh-emp-eng',
      name: 'Employee Sentiment',
      category: 'HR',
      archetype: 'Executive',
      difficulty: 'Intermediate',
      description: 'Results from pulse surveys, retention risk, and eNPS.',
      widgets: [
        mkWidget('boh-emp-eng', 1, VizType.GAUGE, 'eNPS Score', 0, 0, 4, 3),
        mkWidget('boh-emp-eng', 2, VizType.KPI_CARD, 'Survey Participation', 4, 0, 4, 1),
        mkWidget('boh-emp-eng', 3, VizType.KPI_CARD, 'Retention Rate', 8, 0, 4, 1),
        mkWidget('boh-emp-eng', 4, VizType.HEATMAP, 'Sentiment by Dept', 4, 1, 8, 4),
        mkWidget('boh-emp-eng', 5, VizType.BAR, 'Key Themes', 0, 3, 4, 2)
      ]
    },
    {
      id: 'boh-facilities',
      name: 'Workplace Operations',
      category: 'Ops',
      archetype: 'Ops',
      difficulty: 'Novice',
      description: 'Office occupancy, facilities tickets, and utility consumption.',
      widgets: [
        mkWidget('boh-facilities', 1, VizType.KPI_CARD, 'Global Occupancy', 0, 0, 4, 1),
        mkWidget('boh-facilities', 2, VizType.KPI_CARD, 'Open Tickets', 4, 0, 4, 1),
        mkWidget('boh-facilities', 3, VizType.KPI_CARD, 'Energy Usage', 8, 0, 4, 1),
        mkWidget('boh-facilities', 4, VizType.GEO_MAP, 'Office Locations', 0, 1, 8, 4),
        mkWidget('boh-facilities', 5, VizType.BAR, 'Tickets by Type', 8, 1, 4, 4)
      ]
    },
    {
      id: 'boh-data-gov',
      name: 'Data Governance Hub',
      category: 'Engineering',
      archetype: 'Analyst',
      difficulty: 'Pro',
      description: 'Monitor data pipeline freshness, schema errors, and quality scores.',
      widgets: [
        mkWidget('boh-data-gov', 1, VizType.KPI_CARD, 'Data Quality Score', 0, 0, 3, 1),
        mkWidget('boh-data-gov', 2, VizType.KPI_CARD, 'Failed Jobs', 3, 0, 3, 1),
        mkWidget('boh-data-gov', 3, VizType.KPI_CARD, 'Rows Processed', 6, 0, 3, 1),
        mkWidget('boh-data-gov', 4, VizType.KPI_CARD, 'Avg Latency', 9, 0, 3, 1),
        mkWidget('boh-data-gov', 5, VizType.TIME_SERIES, 'Pipeline Freshness', 0, 1, 12, 2),
        mkWidget('boh-data-gov', 6, VizType.TABLE, 'Schema Validation Errors', 0, 3, 12, 3)
      ]
    }
  ];

  return [...fohTemplates, ...bohTemplates];
};
