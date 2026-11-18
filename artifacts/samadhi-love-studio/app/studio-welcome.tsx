import { DivineSpark } from "./cosmic-channel";
import { screenOf } from "./studio-routes";

/** The welcome belongs to Create, including legacy links into its subsections. */
export function StudioWelcome({ view, visible }: {
  view: Parameters<typeof screenOf>[0];
  visible: boolean;
}) {
  if (!visible || screenOf(view) !== "create") return null;
  return <DivineSpark variant="banner"/>;
}
