import { Badge } from "./ui";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const tone = confidence >= 0.8 ? "good" : confidence >= 0.5 ? "warn" : "bad";
  return <Badge tone={tone}>{percent}%</Badge>;
}
