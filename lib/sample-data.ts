import type { AnalysisRequest } from "@/lib/types";

export const sampleRequest: AnalysisRequest = {
  brief: {
    projectName: "Northstar Advisory landing page",
    goal: "Increase consultation bookings for a premium financial consulting firm.",
    audience: "Founders and executives looking for strategic finance support.",
    deliverableType: "Landing page refresh",
    tone: "Calm, premium, expert, direct",
    constraints:
      "Keep the existing brand palette, preserve the approved page sections, and launch by Friday.",
  },
  feedback:
    "The top section feels busy and I am not sure where to click first.\n" +
    "Can we make it pop more?\n" +
    "There is too much going on above the fold.\n" +
    "Could we add a blog and maybe three new service pages while we are at it?\n" +
    "One stakeholder wants it more minimal, another asked for more graphics and animations.\n" +
    "The testimonials feel a bit flat.",
};
