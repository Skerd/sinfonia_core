export const plans = [
  {
    name: "Basic plan",
    monthlyPrice: 19,
    annualPrice: 15,
    description: "Perfect for individuals and small teams getting started.",
    features: {
      Projects: "5",
      "Team members": "3",
      Storage: "10GB",
      "Email support": true,
      "Advanced analytics": false,
      "Custom integrations": false,
      "Priority support": false
    }
  },
  {
    name: "Business plan",
    monthlyPrice: 29,
    annualPrice: 23,
    description: "Ideal for growing teams and businesses",
    features: {
      Projects: "25",
      "Team members": "10",
      Storage: "100GB",
      "Email support": true,
      "Advanced analytics": true,
      "Custom integrations": false,
      "Priority support": false
    }
  },
  {
    name: "Enterprise plan",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "Advanced features for large organizations.",
    features: {
      Projects: "Unlimited",
      "Team members": "Unlimited",
      Storage: "1TB",
      "Email support": true,
      "Advanced analytics": true,
      "Custom integrations": true,
      "Priority support": true
    }
  }
];

export type Plan = (typeof plans)[number];

export type FeatureName = keyof Plan["features"];

export const allFeatures: FeatureName[] = [
  "Projects",
  "Team members",
  "Storage",
  "Email support",
  "Advanced analytics",
  "Custom integrations",
  "Priority support"
];

