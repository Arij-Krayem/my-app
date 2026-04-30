export const GUARDRAIL_METRICS = [
  "spend",
  "roas",
  "ctr",
  "cpc",
  "cpa",
  "impressions",
  "clicks",
  "conversions",
] as const;

export const GUARDRAIL_OPERATORS = [">", "<", ">=", "<=", "=="] as const;
export const GUARDRAIL_SEVERITIES = ["WARNING", "CRITICAL"] as const;

export type GuardrailMetric = (typeof GUARDRAIL_METRICS)[number];
export type GuardrailOperator = (typeof GUARDRAIL_OPERATORS)[number];
export type GuardrailSeverity = (typeof GUARDRAIL_SEVERITIES)[number];

export type GuardrailRuleInput = {
  brandId: string;
  metricKey: GuardrailMetric;
  operator: GuardrailOperator;
  threshold: number;
  severity: GuardrailSeverity;
};

export type GuardrailRuleField = keyof GuardrailRuleInput;
export type GuardrailRuleErrors = Partial<Record<GuardrailRuleField, string>>;

type RawGuardrailRuleInput = Partial<Record<GuardrailRuleField, unknown>>;

const metricLabels: Record<GuardrailMetric, string> = {
  spend: "Spend",
  roas: "ROAS",
  ctr: "CTR",
  cpc: "CPC",
  cpa: "CPA",
  impressions: "Impressions",
  clicks: "Clicks",
  conversions: "Conversions",
};

const countMetrics = new Set<GuardrailMetric>(["impressions", "clicks", "conversions"]);
const nonNegativeMetrics = new Set<GuardrailMetric>(GUARDRAIL_METRICS);

function isGuardrailMetric(value: unknown): value is GuardrailMetric {
  return typeof value === "string" && GUARDRAIL_METRICS.includes(value as GuardrailMetric);
}

function isGuardrailOperator(value: unknown): value is GuardrailOperator {
  return typeof value === "string" && GUARDRAIL_OPERATORS.includes(value as GuardrailOperator);
}

function isGuardrailSeverity(value: unknown): value is GuardrailSeverity {
  return typeof value === "string" && GUARDRAIL_SEVERITIES.includes(value as GuardrailSeverity);
}

function thresholdFrom(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateGuardrailRuleInput(input: RawGuardrailRuleInput): {
  data: GuardrailRuleInput | null;
  errors: GuardrailRuleErrors;
} {
  const errors: GuardrailRuleErrors = {};

  const brandId = typeof input.brandId === "string" ? input.brandId.trim() : "";
  if (!brandId) errors.brandId = "Select a brand for this rule.";

  const metricKey = typeof input.metricKey === "string" ? input.metricKey.trim().toLowerCase() : input.metricKey;
  if (!isGuardrailMetric(metricKey)) errors.metricKey = "Select a valid metric.";

  const operator = input.operator;
  if (!isGuardrailOperator(operator)) errors.operator = "Select a valid operator.";

  const threshold = thresholdFrom(input.threshold);
  if (threshold === null) {
    errors.threshold = "Enter a numeric threshold.";
  }

  const severity = input.severity;
  if (!isGuardrailSeverity(severity)) errors.severity = "Select a valid severity.";

  if (!errors.metricKey && threshold !== null) {
    const metric = metricKey as GuardrailMetric;
    const label = metricLabels[metric];

    if (nonNegativeMetrics.has(metric) && threshold < 0) {
      errors.threshold = `${label} thresholds cannot be negative.`;
    } else if (metric === "ctr" && threshold > 100) {
      errors.threshold = "CTR thresholds must be between 0 and 100.";
    } else if (countMetrics.has(metric) && !Number.isInteger(threshold)) {
      errors.threshold = `${label} thresholds must be whole numbers.`;
    }
  }

  if (Object.keys(errors).length > 0) return { data: null, errors };

  return {
    data: {
      brandId,
      metricKey: metricKey as GuardrailMetric,
      operator: operator as GuardrailOperator,
      threshold: threshold as number,
      severity: severity as GuardrailSeverity,
    },
    errors,
  };
}
